import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import type { Blog, Company } from '@/types';
import {
  FileText,
  FilePenLine,
  CheckCircle2,
  Building2,
  PenTool,
  ArrowRight,
  TrendingUp,
  Clock,
} from 'lucide-react';

const statusBadge: Record<string, { variant: 'default' | 'success' | 'warning' | 'info'; label: string }> = {
  draft: { variant: 'default', label: 'Entwurf' },
  generating: { variant: 'warning', label: 'In Generierung' },
  review: { variant: 'info', label: 'Ueberpruefen' },
  published: { variant: 'success', label: 'Veroeffentlicht' },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stats, setStats] = useState({ total: 0, drafts: 0, published: 0 });

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [blogsRes, companiesRes] = await Promise.all([
        supabase
          .from('blogs')
          .select('*, companies(name)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('companies').select('*').eq('user_id', user.id),
      ]);

      const blogData = (blogsRes.data || []) as Blog[];
      setBlogs(blogData);
      setCompanies((companiesRes.data || []) as Company[]);

      const allBlogs = await supabase
        .from('blogs')
        .select('status')
        .eq('user_id', user.id);
      const all = allBlogs.data || [];
      setStats({
        total: all.length,
        drafts: all.filter((b) => b.status === 'draft').length,
        published: all.filter((b) => b.status === 'published').length,
      });
    };

    fetchData();
  }, [user]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Uebersicht</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            Willkommen zurueck! Hier ist dein Ueberblick.
          </p>
        </div>
        <Link to="/blog/new">
          <Button>
            <PenTool className="h-4 w-4" />
            Neuen Blog erstellen
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="group hover:border-primary-200 hover:shadow-md transition-all duration-300 dark:hover:border-primary-800">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-surface-500 dark:text-surface-400">Gesamt Blogs</p>
                <p className="text-3xl font-bold text-surface-900 dark:text-surface-50 mt-1">{stats.total}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400 group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:border-amber-200 hover:shadow-md transition-all duration-300 dark:hover:border-amber-800">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-surface-500 dark:text-surface-400">Entwuerfe</p>
                <p className="text-3xl font-bold text-surface-900 dark:text-surface-50 mt-1">{stats.drafts}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 group-hover:scale-110 transition-transform duration-300">
                <FilePenLine className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:border-emerald-200 hover:shadow-md transition-all duration-300 dark:hover:border-emerald-800">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-surface-500 dark:text-surface-400">Veroeffentlicht</p>
                <p className="text-3xl font-bold text-surface-900 dark:text-surface-50 mt-1">{stats.published}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:border-sky-200 hover:shadow-md transition-all duration-300 dark:hover:border-sky-800">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-surface-500 dark:text-surface-400">Unternehmen</p>
                <p className="text-3xl font-bold text-surface-900 dark:text-surface-50 mt-1">{companies.length}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400 group-hover:scale-110 transition-transform duration-300">
                <Building2 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Letzte Blogs</CardTitle>
              <Link to="/blogs" className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1 font-medium">
                Alle anzeigen <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {blogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-100 dark:bg-surface-800 mb-4">
                  <FileText className="h-8 w-8 text-surface-400" />
                </div>
                <p className="text-surface-500 dark:text-surface-400 mb-4">Noch keine Blogs erstellt</p>
                <Link to="/blog/new">
                  <Button size="sm">Ersten Blog erstellen</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {blogs.map((blog) => (
                  <Link
                    key={blog.id}
                    to={`/blog/${blog.id}/edit`}
                    className="flex items-center justify-between rounded-lg border border-surface-100 p-4 hover:bg-surface-50 hover:border-surface-200 transition-all duration-200 dark:border-surface-800 dark:hover:bg-surface-800/50 dark:hover:border-surface-700 group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-surface-900 dark:text-surface-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {blog.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        {blog.companies && (
                          <span className="text-xs text-surface-500 dark:text-surface-400 flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {blog.companies.name}
                          </span>
                        )}
                        <span className="text-xs text-surface-400 dark:text-surface-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(blog.created_at)}
                        </span>
                      </div>
                    </div>
                    <Badge variant={statusBadge[blog.status]?.variant || 'default'}>
                      {statusBadge[blog.status]?.label || blog.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Unternehmen</CardTitle>
              <Link to="/companies" className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1 font-medium">
                Alle <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {companies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-100 dark:bg-surface-800 mb-3">
                  <Building2 className="h-6 w-6 text-surface-400" />
                </div>
                <p className="text-sm text-surface-500 dark:text-surface-400 mb-3">Kein Unternehmen</p>
                <Link to="/companies">
                  <Button size="sm" variant="outline">Hinzufuegen</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {companies.slice(0, 5).map((company) => (
                  <div key={company.id} className="flex items-center gap-3 rounded-lg border border-surface-100 p-3 dark:border-surface-800">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400 text-sm font-bold shrink-0">
                      {company.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">{company.name}</p>
                      {company.industry && (
                        <p className="text-xs text-surface-500 dark:text-surface-400 truncate">{company.industry}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary-500" />
            Schnellaktionen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link to="/blog/new" className="group">
              <div className="rounded-xl border border-surface-200 p-4 hover:border-primary-300 hover:bg-primary-50/50 transition-all duration-200 dark:border-surface-700 dark:hover:border-primary-700 dark:hover:bg-primary-900/10">
                <PenTool className="h-5 w-5 text-primary-500 mb-2 group-hover:scale-110 transition-transform" />
                <p className="font-medium text-surface-900 dark:text-surface-100 text-sm">Blog schreiben</p>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">KI-gestuetzt erstellen</p>
              </div>
            </Link>
            <Link to="/companies" className="group">
              <div className="rounded-xl border border-surface-200 p-4 hover:border-sky-300 hover:bg-sky-50/50 transition-all duration-200 dark:border-surface-700 dark:hover:border-sky-700 dark:hover:bg-sky-900/10">
                <Building2 className="h-5 w-5 text-sky-500 mb-2 group-hover:scale-110 transition-transform" />
                <p className="font-medium text-surface-900 dark:text-surface-100 text-sm">Unternehmen</p>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Profile verwalten</p>
              </div>
            </Link>
            <Link to="/keywords" className="group">
              <div className="rounded-xl border border-surface-200 p-4 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all duration-200 dark:border-surface-700 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/10">
                <TrendingUp className="h-5 w-5 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                <p className="font-medium text-surface-900 dark:text-surface-100 text-sm">Keywords</p>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">SEO optimieren</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
