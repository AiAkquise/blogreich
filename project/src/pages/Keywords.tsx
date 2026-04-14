import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { apiPost } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Dialog, DialogTitle } from '@/components/ui/Dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import type { Company, Keyword, KeywordCluster } from '@/types';
import { KeyRound, Plus, Target, Hash, TrendingUp, Loader2 } from 'lucide-react';

interface KeywordResearchResponse {
  cluster_id: string;
  cluster_name: string;
  primary_keyword: string;
  keywords: { keyword: string; score: number }[];
}

export default function Keywords() {
  const { user } = useAuth();
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [clusters, setClusters] = useState<KeywordCluster[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [researching, setResearching] = useState(false);
  const [researchError, setResearchError] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [topicInput, setTopicInput] = useState('');

  const fetchData = () => {
    if (!user) return;
    Promise.all([
      supabase.from('keywords').select('*').eq('user_id', user.id).order('score', { ascending: false }),
      supabase.from('keyword_clusters').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('companies').select('*').eq('user_id', user.id),
    ]).then(([kw, cl, co]) => {
      setKeywords((kw.data || []) as Keyword[]);
      setClusters((cl.data || []) as KeywordCluster[]);
      setCompanies((co.data || []) as Company[]);
    });
  };

  useEffect(() => { fetchData(); }, [user]);

  const startResearch = async () => {
    if (!selectedCompanyId) return;
    setResearching(true);
    setResearchError('');
    try {
      await apiPost<KeywordResearchResponse>('/api/keywords/research', {
        company_id: selectedCompanyId,
        topic: topicInput.trim() || null,
      });
      setDialogOpen(false);
      setSelectedCompanyId('');
      setTopicInput('');
      fetchData();
    } catch (err) {
      setResearchError(err instanceof Error ? err.message : 'Keyword-Recherche fehlgeschlagen');
    }
    setResearching(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Keywords & Cluster</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">Verwalte deine SEO-Keywords</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Neue Keyword-Recherche
        </Button>
      </div>

      <Tabs defaultValue="keywords">
        <TabsList>
          <TabsTrigger value="keywords">
            <span className="flex items-center gap-1.5"><KeyRound className="h-3.5 w-3.5" /> Keywords</span>
          </TabsTrigger>
          <TabsTrigger value="clusters">
            <span className="flex items-center gap-1.5"><Target className="h-3.5 w-3.5" /> Cluster</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="keywords">
          {keywords.length === 0 ? (
            <Card>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-100 dark:bg-surface-800 mb-4">
                    <KeyRound className="h-8 w-8 text-surface-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-1">Keine Keywords vorhanden</h3>
                  <p className="text-surface-500 dark:text-surface-400 max-w-sm">Starte eine Keyword-Recherche, um relevante Keywords fuer deine Blog-Artikel zu finden.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="overflow-hidden p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-200 dark:border-surface-700">
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">Keyword</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">Score</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                  {keywords.map((kw) => (
                    <tr key={kw.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-primary-400" />
                          <span className="font-medium text-surface-900 dark:text-surface-100">{kw.keyword}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden">
                            <div className="h-full rounded-full bg-primary-500" style={{ width: `${kw.score}%` }} />
                          </div>
                          <span className="text-sm text-surface-500">{kw.score}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={kw.status === 'active' ? 'success' : 'default'}>{kw.status === 'active' ? 'Aktiv' : kw.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="clusters">
          {clusters.length === 0 ? (
            <Card>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-100 dark:bg-surface-800 mb-4">
                    <Target className="h-8 w-8 text-surface-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-1">Keine Cluster vorhanden</h3>
                  <p className="text-surface-500 dark:text-surface-400 max-w-sm">Cluster gruppieren zusammengehoerige Keywords fuer eine bessere Content-Strategie.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clusters.map((cluster) => (
                <Card key={cluster.id} className="hover:border-primary-200 hover:shadow-md transition-all duration-300 dark:hover:border-primary-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{cluster.name}</CardTitle>
                      <Badge variant={cluster.status === 'open' ? 'info' : 'success'}>{cluster.status === 'open' ? 'Offen' : 'Abgeschlossen'}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2.5">
                      {cluster.primary_keyword && (
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingUp className="h-4 w-4 text-primary-500" />
                          <span className="text-surface-700 dark:text-surface-300">{cluster.primary_keyword}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400">
                        <Hash className="h-4 w-4" />
                        {keywords.filter((k) => k.cluster_id === cluster.id).length} Keywords
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); setResearchError(''); }} className="max-w-md">
        <DialogTitle>Neue Keyword-Recherche</DialogTitle>
        <div className="space-y-4">
          <Select
            label="Unternehmen"
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            options={[
              { value: '', label: 'Unternehmen waehlen...' },
              ...companies.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
          <Input
            label="Thema (optional)"
            placeholder="z.B. Content Marketing Trends 2026"
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
          />
          {researchError && (
            <p className="text-sm text-red-500">{researchError}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setDialogOpen(false); setResearchError(''); }}>Abbrechen</Button>
            <Button onClick={startResearch} disabled={!selectedCompanyId || researching}>
              {researching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Recherche starten'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
