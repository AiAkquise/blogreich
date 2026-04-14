import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { apiPost } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import type { Blog, BlogImage } from '@/types';
import { Save, FileDown, Bold, Italic, Heading2, Heading3, Link as LinkIcon, Image, List, Loader2, ArrowLeft, Eye, Code, ChevronDown, Sparkles } from 'lucide-react';

function markdownToHtml(md: string): string {
  let html = md
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-6 mb-2 text-surface-900 dark:text-surface-100">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-8 mb-3 text-surface-900 dark:text-surface-100">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-8 mb-4 text-surface-900 dark:text-surface-100">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^\- (.*$)/gm, '<li class="ml-4">$1</li>')
    .replace(/\n\n/g, '</p><p class="mb-4 leading-relaxed text-surface-700 dark:text-surface-300">')
    .replace(/\n/g, '<br />');
  html = `<p class="mb-4 leading-relaxed text-surface-700 dark:text-surface-300">${html}</p>`;
  return html;
}

export default function BlogEditor() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [activeView, setActiveView] = useState<'split' | 'editor' | 'preview'>('split');
  const [generatingImages, setGeneratingImages] = useState(false);
  const [blogImages, setBlogImages] = useState<BlogImage[]>([]);

  useEffect(() => {
    if (!id || !user) return;
    supabase
      .from('blogs')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setBlog(data as Blog);
          setContent(data.content || '');
        }
      });
    // Load existing images
    supabase
      .from('blog_images')
      .select('*')
      .eq('blog_id', id)
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) setBlogImages(data as BlogImage[]);
      });
  }, [id, user]);

  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 250));

  const calculateSeoScore = useCallback(() => {
    let score = 50;
    if (wordCount > 500) score += 10;
    if (wordCount > 1000) score += 10;
    if (blog?.primary_keyword && content.toLowerCase().includes(blog.primary_keyword.toLowerCase())) {
      score += 15;
    }
    if (content.includes('## ')) score += 10;
    if (content.includes('### ')) score += 5;
    return Math.min(100, score);
  }, [content, wordCount, blog]);

  const seoScore = calculateSeoScore();

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('editor') as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const newContent = content.substring(0, start) + prefix + selected + suffix + content.substring(end);
    setContent(newContent);
  };

  const handleSave = async (status?: string) => {
    if (!blog) return;
    setSaving(true);
    await supabase
      .from('blogs')
      .update({
        content,
        actual_word_count: wordCount,
        seo_score: seoScore,
        status: status || blog.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', blog.id);
    if (status) setBlog({ ...blog, status: status as Blog['status'] });
    setSaving(false);
  };

  const handleExport = (format: 'markdown' | 'html') => {
    const blob = format === 'markdown'
      ? new Blob([content], { type: 'text/markdown' })
      : new Blob([markdownToHtml(content)], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${blog?.title || 'blog'}.${format === 'markdown' ? 'md' : 'html'}`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
  };

  interface ImageGenerateResponse {
    images: { id: string; image_url: string; prompt: string; position: string }[];
  }

  const handleGenerateImages = async () => {
    if (!blog) return;
    setGeneratingImages(true);
    try {
      const result = await apiPost<ImageGenerateResponse>('/api/images/generate', {
        blog_id: blog.id,
        auto_generate: true,
        count: 3,
      });
      setBlogImages(prev => [
        ...prev,
        ...result.images.map(img => ({
          id: img.id,
          blog_id: blog.id,
          user_id: user!.id,
          image_url: img.image_url,
          prompt: img.prompt,
          position: img.position,
          created_at: new Date().toISOString(),
        })),
      ]);
      // Insert image markdown references into content
      const imageMarkdown = result.images
        .map(img => `![${img.prompt.slice(0, 60)}](${img.image_url})`)
        .join('\n\n');
      setContent(prev => prev + '\n\n---\n\n## Bilder\n\n' + imageMarkdown);
    } catch {
      // Silently handle — user can retry
    }
    setGeneratingImages(false);
  };

  if (!blog) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const statusBadge: Record<string, { variant: 'default' | 'success' | 'warning' | 'info'; label: string }> = {
    draft: { variant: 'default', label: 'Entwurf' },
    generating: { variant: 'warning', label: 'In Generierung' },
    review: { variant: 'info', label: 'Ueberpruefen' },
    published: { variant: 'success', label: 'Veroeffentlicht' },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/blogs')} className="rounded-lg p-2 text-surface-400 hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800 dark:hover:text-surface-300 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-surface-900 dark:text-surface-50">{blog.title}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant={statusBadge[blog.status]?.variant}>{statusBadge[blog.status]?.label}</Badge>
              <span className="text-xs text-surface-400">{wordCount} Woerter</span>
              <span className="text-xs text-surface-400">{readTime} Min. Lesezeit</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden">
            <button onClick={() => setActiveView('editor')} className={`px-3 py-1.5 text-xs font-medium transition-colors ${activeView === 'editor' ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400' : 'text-surface-500 hover:bg-surface-50 dark:hover:bg-surface-800'}`}>
              <Code className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setActiveView('split')} className={`px-3 py-1.5 text-xs font-medium border-x border-surface-200 dark:border-surface-700 transition-colors ${activeView === 'split' ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400' : 'text-surface-500 hover:bg-surface-50 dark:hover:bg-surface-800'}`}>
              Geteilt
            </button>
            <button onClick={() => setActiveView('preview')} className={`px-3 py-1.5 text-xs font-medium transition-colors ${activeView === 'preview' ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400' : 'text-surface-500 hover:bg-surface-50 dark:hover:bg-surface-800'}`}>
              <Eye className="h-3.5 w-3.5" />
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={() => handleSave('draft')}>Als Entwurf speichern</Button>
          <Button size="sm" onClick={() => handleSave()} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Speichern
          </Button>
          <div className="relative">
            <Button variant="secondary" size="sm" onClick={() => setShowExport(!showExport)}>
              <FileDown className="h-4 w-4" />
              <ChevronDown className="h-3 w-3" />
            </Button>
            {showExport && (
              <div className="absolute right-0 top-full mt-1 w-40 rounded-lg border border-surface-200 bg-white py-1 shadow-lg z-10 dark:border-surface-700 dark:bg-surface-900">
                <button onClick={() => handleExport('html')} className="w-full px-3 py-2 text-left text-sm hover:bg-surface-50 dark:hover:bg-surface-800 text-surface-700 dark:text-surface-300">
                  Als HTML exportieren
                </button>
                <button onClick={() => handleExport('markdown')} className="w-full px-3 py-2 text-left text-sm hover:bg-surface-50 dark:hover:bg-surface-800 text-surface-700 dark:text-surface-300">
                  Als Markdown exportieren
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 rounded-lg border border-surface-200 bg-white p-1.5 dark:border-surface-700 dark:bg-surface-900">
        <button onClick={() => insertMarkdown('**', '**')} className="rounded p-2 text-surface-500 hover:bg-surface-100 hover:text-surface-700 dark:hover:bg-surface-800 dark:hover:text-surface-300 transition-colors" title="Fett">
          <Bold className="h-4 w-4" />
        </button>
        <button onClick={() => insertMarkdown('*', '*')} className="rounded p-2 text-surface-500 hover:bg-surface-100 hover:text-surface-700 dark:hover:bg-surface-800 dark:hover:text-surface-300 transition-colors" title="Kursiv">
          <Italic className="h-4 w-4" />
        </button>
        <div className="h-5 w-px bg-surface-200 dark:bg-surface-700 mx-1" />
        <button onClick={() => insertMarkdown('## ')} className="rounded p-2 text-surface-500 hover:bg-surface-100 hover:text-surface-700 dark:hover:bg-surface-800 dark:hover:text-surface-300 transition-colors" title="H2">
          <Heading2 className="h-4 w-4" />
        </button>
        <button onClick={() => insertMarkdown('### ')} className="rounded p-2 text-surface-500 hover:bg-surface-100 hover:text-surface-700 dark:hover:bg-surface-800 dark:hover:text-surface-300 transition-colors" title="H3">
          <Heading3 className="h-4 w-4" />
        </button>
        <div className="h-5 w-px bg-surface-200 dark:bg-surface-700 mx-1" />
        <button onClick={() => insertMarkdown('[', '](url)')} className="rounded p-2 text-surface-500 hover:bg-surface-100 hover:text-surface-700 dark:hover:bg-surface-800 dark:hover:text-surface-300 transition-colors" title="Link">
          <LinkIcon className="h-4 w-4" />
        </button>
        <button onClick={() => insertMarkdown('![Alt Text](', ')')} className="rounded p-2 text-surface-500 hover:bg-surface-100 hover:text-surface-700 dark:hover:bg-surface-800 dark:hover:text-surface-300 transition-colors" title="Bild">
          <Image className="h-4 w-4" />
        </button>
        <button onClick={() => insertMarkdown('- ')} className="rounded p-2 text-surface-500 hover:bg-surface-100 hover:text-surface-700 dark:hover:bg-surface-800 dark:hover:text-surface-300 transition-colors" title="Liste">
          <List className="h-4 w-4" />
        </button>
        <div className="h-5 w-px bg-surface-200 dark:bg-surface-700 mx-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleGenerateImages}
          disabled={generatingImages || !content.trim()}
          title="KI-Bilder generieren"
        >
          {generatingImages ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {generatingImages ? 'Bilder werden generiert...' : 'KI-Bilder'}
        </Button>
      </div>

      <div className={`grid gap-4 ${activeView === 'split' ? 'grid-cols-2' : 'grid-cols-1'}`} style={{ height: 'calc(100vh - 280px)' }}>
        {(activeView === 'editor' || activeView === 'split') && (
          <textarea
            id="editor"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full rounded-xl border border-surface-200 bg-white p-5 text-sm font-mono text-surface-800 placeholder:text-surface-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200 scrollbar-thin"
            placeholder="Schreibe deinen Blog-Artikel hier..."
          />
        )}
        {(activeView === 'preview' || activeView === 'split') && (
          <div className="h-full rounded-xl border border-surface-200 bg-white p-6 overflow-y-auto dark:border-surface-700 dark:bg-surface-900 scrollbar-thin">
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
            />
          </div>
        )}
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">SEO-Bewertung</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-32 h-2 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${seoScore >= 70 ? 'bg-emerald-500' : seoScore >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${seoScore}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-surface-900 dark:text-surface-100">{seoScore}/100</span>
            </div>
          </div>
          <div className="h-8 w-px bg-surface-200 dark:bg-surface-700" />
          <div>
            <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">Woerter</p>
            <p className="text-sm font-semibold text-surface-900 dark:text-surface-100 mt-1">{wordCount.toLocaleString()}</p>
          </div>
          <div className="h-8 w-px bg-surface-200 dark:bg-surface-700" />
          <div>
            <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">Lesezeit</p>
            <p className="text-sm font-semibold text-surface-900 dark:text-surface-100 mt-1">{readTime} Min.</p>
          </div>
          {blog.primary_keyword && (
            <>
              <div className="h-8 w-px bg-surface-200 dark:bg-surface-700" />
              <div>
                <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">Keyword-Dichte</p>
                <p className="text-sm font-semibold text-surface-900 dark:text-surface-100 mt-1">
                  {wordCount > 0
                    ? ((content.toLowerCase().split(blog.primary_keyword.toLowerCase()).length - 1) / wordCount * 100).toFixed(1)
                    : '0.0'}%
                </p>
              </div>
            </>
          )}
        </div>
      </Card>

      {blogImages.length > 0 && (
        <Card className="p-4">
          <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-3">Generierte Bilder ({blogImages.length})</p>
          <div className="grid grid-cols-3 gap-3">
            {blogImages.map((img) => (
              <div key={img.id} className="relative group rounded-lg overflow-hidden border border-surface-200 dark:border-surface-700">
                <img src={img.image_url} alt={img.prompt} className="w-full h-32 object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                  <p className="text-xs text-white line-clamp-2">{img.prompt}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
