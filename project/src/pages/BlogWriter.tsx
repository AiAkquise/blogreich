import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { apiPost, apiGet } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardContent } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import type { Company } from '@/types';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Loader2,
  Check,
  Wand2,
  Zap,
  Globe,
  FileText,
  X,
  AlertCircle,
} from 'lucide-react';

const STEPS = [
  'Gliederung wird erstellt...',
  'Abschnitte werden geschrieben...',
  'Bilder werden generiert...',
  'Blog fertig!',
];

export default function BlogWriter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [title, setTitle] = useState('');
  const [contentSource, setContentSource] = useState('ai');
  const [sourceUrl, setSourceUrl] = useState('');
  const [language, setLanguage] = useState('de');
  const [tone, setTone] = useState('professional');
  const [targetAudience, setTargetAudience] = useState('');
  const [wordCount, setWordCount] = useState(3000);
  const [primaryKeyword, setPrimaryKeyword] = useState('');
  const [secondaryKeywords, setSecondaryKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const [easyTitle, setEasyTitle] = useState('');
  const [easyCompanyId, setEasyCompanyId] = useState('');
  const [easyGenerating, setEasyGenerating] = useState(false);
  const [easyStep, setEasyStep] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .then(({ data }) => setCompanies((data || []) as Company[]));
  }, [user]);

  const companyOptions = [
    { value: '', label: 'Kein Unternehmen' },
    ...companies.map((c) => ({ value: c.id, label: c.name })),
  ];

  const [generationError, setGenerationError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const stepMap: Record<string, number> = {
    outline: 0,
    sections: 1,
    intro: 2,
    conclusion: 2,
    images: 3,
    done: 3,
  };

  interface BlogStatusResponse {
    status: string;
    current_step: string | null;
    progress: number;
    error: string | null;
  }

  const generateBlog = useCallback(async (blogTitle: string, cId: string, isEasy: boolean) => {
    const setStep = isEasy ? setEasyStep : setCurrentStep;
    const setGen = isEasy ? setEasyGenerating : setGenerating;

    setGen(true);
    setStep(0);
    setGenerationError(null);

    try {
      // 1. Create blog in Supabase (CRUD via Supabase SDK)
      const { data: blog, error: insertError } = await supabase
        .from('blogs')
        .insert({
          user_id: user!.id,
          title: blogTitle,
          company_id: cId || null,
          status: 'draft',
          language: isEasy ? 'de' : language,
          tone: isEasy ? 'professional' : tone,
          target_word_count: isEasy ? 3000 : wordCount,
          actual_word_count: 0,
          primary_keyword: isEasy ? '' : primaryKeyword,
          secondary_keywords: isEasy ? [] : secondaryKeywords,
          content_source: isEasy ? 'ai' : contentSource,
          source_url: isEasy ? '' : sourceUrl,
          seo_score: 0,
        })
        .select()
        .maybeSingle();

      if (insertError || !blog) {
        throw new Error(insertError?.message || 'Blog konnte nicht erstellt werden');
      }

      // 2. Start backend generation job (KI-Op via apiClient)
      await apiPost('/api/blogs/generate', {
        blog_id: blog.id,
        title: blogTitle,
        company_id: cId || null,
        language: isEasy ? 'de' : language,
        tone: isEasy ? 'professional' : tone,
        target_word_count: isEasy ? 3000 : wordCount,
        primary_keyword: isEasy ? '' : primaryKeyword,
        secondary_keywords: isEasy ? [] : secondaryKeywords,
        content_source: isEasy ? 'ai' : contentSource,
        source_url: isEasy ? '' : sourceUrl,
      });

      // 3. Poll for status every 2 seconds
      pollRef.current = setInterval(async () => {
        try {
          const status = await apiGet<BlogStatusResponse>(`/api/blogs/${blog.id}/status`);
          if (status.current_step) {
            setStep(stepMap[status.current_step] ?? 0);
          }

          if (status.status === 'completed') {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
            setGen(false);
            navigate(`/blog/${blog.id}/edit`);
          }

          if (status.status === 'failed') {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
            setGen(false);
            setGenerationError(status.error || 'Generierung fehlgeschlagen');
          }
        } catch {
          // Polling error — keep trying
        }
      }, 2000);
    } catch (err) {
      setGen(false);
      setGenerationError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    }
  }, [user, language, tone, wordCount, primaryKeyword, secondaryKeywords, contentSource, sourceUrl, navigate]);

  const handleAdvancedGenerate = () => {
    if (!title.trim()) return;
    generateBlog(title, companyId, false);
  };

  const handleEasyGenerate = () => {
    if (!easyTitle.trim()) return;
    generateBlog(easyTitle, easyCompanyId, true);
  };

  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (kw && !secondaryKeywords.includes(kw)) {
      setSecondaryKeywords([...secondaryKeywords, kw]);
      setKeywordInput('');
    }
  };

  const removeKeyword = (kw: string) => {
    setSecondaryKeywords(secondaryKeywords.filter((k) => k !== kw));
  };

  const renderProgress = (steps: number, isGenerating: boolean) => {
    if (!isGenerating) return null;
    return (
      <Card className="mt-6 border-primary-200 dark:border-primary-800">
        <CardContent>
          <div className="space-y-4">
            {STEPS.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                {i < steps ? (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                ) : i === steps ? (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
                    <Loader2 className="h-4 w-4 text-primary-600 dark:text-primary-400 animate-spin" />
                  </div>
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800">
                    <span className="text-xs text-surface-400">{i + 1}</span>
                  </div>
                )}
                <span className={`text-sm ${i <= steps ? 'text-surface-900 dark:text-surface-100 font-medium' : 'text-surface-400 dark:text-surface-500'}`}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Blog Schreiber</h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">Erstelle einen neuen Blog-Artikel mit KI</p>
      </div>

      <Tabs defaultValue="advanced">
        <TabsList>
          <TabsTrigger value="advanced">
            <span className="flex items-center gap-1.5"><Wand2 className="h-3.5 w-3.5" /> Blog Schreiber</span>
          </TabsTrigger>
          <TabsTrigger value="easy">
            <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" /> Einfacher Modus</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="advanced">
          <div className="space-y-6">
            <Card>
              <CardContent>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Blog-Titel
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Gib deinen Blog-Titel ein..."
                  className="w-full rounded-xl border border-surface-200 bg-white px-5 py-4 text-lg font-medium text-surface-900 placeholder:text-surface-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100 dark:placeholder:text-surface-500"
                />
                <Button variant="ghost" size="sm" className="mt-2" onClick={() => {}}>
                  <Sparkles className="h-3.5 w-3.5" />
                  Themen vorschlagen lassen
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Select
                  label="Content-Quelle"
                  value={contentSource}
                  onChange={(e) => setContentSource(e.target.value)}
                  options={[
                    { value: 'ai', label: 'KI-generiert' },
                    { value: 'realtime', label: 'Mit Realtime-Info' },
                    { value: 'url', label: 'Von URL' },
                  ]}
                />
                {contentSource === 'url' && (
                  <div className="mt-3">
                    <Input
                      label="Quell-URL"
                      placeholder="https://..."
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                    />
                  </div>
                )}
                <div className="flex items-center gap-2 mt-3 text-xs text-surface-500 dark:text-surface-400">
                  {contentSource === 'ai' && <><Wand2 className="h-3.5 w-3.5" /> Komplett KI-generierter Inhalt</>}
                  {contentSource === 'realtime' && <><Globe className="h-3.5 w-3.5" /> Mit aktuellen Informationen aus dem Web</>}
                  {contentSource === 'url' && <><FileText className="h-3.5 w-3.5" /> Basierend auf dem Inhalt der angegebenen URL</>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="flex w-full items-center justify-between text-left"
              >
                <span className="font-medium text-surface-900 dark:text-surface-100">Erweiterte Einstellungen</span>
                {settingsOpen ? <ChevronUp className="h-5 w-5 text-surface-400" /> : <ChevronDown className="h-5 w-5 text-surface-400" />}
              </button>
              {settingsOpen && (
                <div className="mt-4 space-y-4 border-t border-surface-100 dark:border-surface-800 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Sprache"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      options={[
                        { value: 'de', label: 'Deutsch' },
                        { value: 'en', label: 'Englisch' },
                      ]}
                    />
                    <Select
                      label="Tonalitaet"
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      options={[
                        { value: 'professional', label: 'Professionell' },
                        { value: 'casual', label: 'Locker' },
                        { value: 'academic', label: 'Akademisch' },
                        { value: 'creative', label: 'Kreativ' },
                      ]}
                    />
                  </div>
                  <Input
                    label="Zielgruppe"
                    placeholder="z.B. Marketing-Manager, Startups..."
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                  />
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      Wort-Anzahl: {wordCount.toLocaleString()}
                    </label>
                    <input
                      type="range"
                      min={1000}
                      max={5000}
                      step={500}
                      value={wordCount}
                      onChange={(e) => setWordCount(Number(e.target.value))}
                      className="w-full accent-primary-600"
                    />
                    <div className="flex justify-between text-xs text-surface-400 mt-1">
                      <span>1.000</span>
                      <span>5.000</span>
                    </div>
                  </div>
                  <Input
                    label="Haupt-Keyword"
                    placeholder="Haupt-Keyword (optional)"
                    value={primaryKeyword}
                    onChange={(e) => setPrimaryKeyword(e.target.value)}
                  />
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      Neben-Keywords
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                        placeholder="Keyword eingeben..."
                        className="flex-1 rounded-lg border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100"
                      />
                      <Button variant="secondary" onClick={addKeyword}>Hinzufuegen</Button>
                    </div>
                    {secondaryKeywords.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {secondaryKeywords.map((kw) => (
                          <span key={kw} className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                            {kw}
                            <button onClick={() => removeKeyword(kw)} className="hover:text-red-500 transition-colors">
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <Select
                    label="Unternehmen"
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    options={companyOptions}
                  />
                </div>
              )}
            </Card>

            <Button
              onClick={handleAdvancedGenerate}
              disabled={!title.trim() || generating}
              className="w-full"
              size="lg"
            >
              {generating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Blog generieren
                </>
              )}
            </Button>

            {renderProgress(currentStep, generating)}
            {generationError && (
              <Card className="mt-4 border-red-200 dark:border-red-800">
                <CardContent>
                  <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <p className="text-sm">{generationError}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="easy">
          <div className="space-y-6">
            <Card>
              <CardContent>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Blog-Titel
                </label>
                <input
                  type="text"
                  value={easyTitle}
                  onChange={(e) => setEasyTitle(e.target.value)}
                  placeholder="Gib deinen Blog-Titel ein..."
                  className="w-full rounded-xl border border-surface-200 bg-white px-5 py-4 text-lg font-medium text-surface-900 placeholder:text-surface-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100 dark:placeholder:text-surface-500"
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Select
                  label="Unternehmen"
                  value={easyCompanyId}
                  onChange={(e) => setEasyCompanyId(e.target.value)}
                  options={companyOptions}
                />
              </CardContent>
            </Card>

            <Button
              onClick={handleEasyGenerate}
              disabled={!easyTitle.trim() || easyGenerating}
              className="w-full"
              size="lg"
            >
              {easyGenerating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  Generieren
                </>
              )}
            </Button>

            {renderProgress(easyStep, easyGenerating)}
            {generationError && easyGenerating === false && (
              <Card className="mt-4 border-red-200 dark:border-red-800">
                <CardContent>
                  <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <p className="text-sm">{generationError}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
