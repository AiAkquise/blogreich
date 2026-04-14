import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { formatDate } from '@/lib/utils';
import type { Blog, Company } from '@/types';
import { Search, PenTool, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const statusBadge: Record<string, { variant: 'default' | 'success' | 'warning' | 'info'; label: string }> = {
  draft: { variant: 'default', label: 'Entwurf' },
  generating: { variant: 'warning', label: 'In Generierung' },
  review: { variant: 'info', label: 'Ueberpruefen' },
  published: { variant: 'success', label: 'Veroeffentlicht' },
};

const PAGE_SIZE = 10;

export default function MyBlogs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from('companies').select('*').eq('user_id', user.id).then(({ data }) => {
      setCompanies((data || []) as Company[]);
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let query = supabase
      .from('blogs')
      .select('*, companies(name)', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (statusFilter) query = query.eq('status', statusFilter);
    if (companyFilter) query = query.eq('company_id', companyFilter);
    if (search) query = query.ilike('title', `%${search}%`);

    query.then(({ data, count }) => {
      setBlogs((data || []) as Blog[]);
      setTotal(count || 0);
    });
  }, [user, page, statusFilter, companyFilter, search]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Meine Blogs</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">{total} Blog-Artikel</p>
        </div>
        <Link to="/blog/new">
          <Button>
            <PenTool className="h-4 w-4" />
            Neuer Blog
          </Button>
        </Link>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
            <input
              type="text"
              placeholder="Blogs durchsuchen..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-surface-200 bg-white text-sm text-surface-900 placeholder:text-surface-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            className="rounded-lg border border-surface-200 bg-white px-3 py-2.5 text-sm text-surface-700 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-300"
          >
            <option value="">Alle Status</option>
            <option value="draft">Entwurf</option>
            <option value="generating">In Generierung</option>
            <option value="review">Ueberpruefen</option>
            <option value="published">Veroeffentlicht</option>
          </select>
          <select
            value={companyFilter}
            onChange={(e) => { setCompanyFilter(e.target.value); setPage(0); }}
            className="rounded-lg border border-surface-200 bg-white px-3 py-2.5 text-sm text-surface-700 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-300"
          >
            <option value="">Alle Unternehmen</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-200 dark:border-surface-700">
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">Titel</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">Unternehmen</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">Status</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">Woerter</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">Erstellt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
              {blogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <FileText className="h-10 w-10 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
                    <p className="text-surface-500 dark:text-surface-400">Keine Blogs gefunden</p>
                  </td>
                </tr>
              ) : (
                blogs.map((blog) => (
                  <tr
                    key={blog.id}
                    onClick={() => navigate(`/blog/${blog.id}/edit`)}
                    className="cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-surface-900 dark:text-surface-100 truncate max-w-xs">{blog.title}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-surface-500 dark:text-surface-400">
                      {blog.companies?.name || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={statusBadge[blog.status]?.variant}>{statusBadge[blog.status]?.label}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-surface-500 dark:text-surface-400">
                      {(blog.actual_word_count || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-surface-500 dark:text-surface-400">
                      {formatDate(blog.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-surface-200 dark:border-surface-700 px-6 py-3">
            <p className="text-sm text-surface-500 dark:text-surface-400">
              Seite {page + 1} von {totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
