import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { apiPost } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent } from '@/components/ui/Card';
import { Dialog, DialogTitle } from '@/components/ui/Dialog';
import type { Company } from '@/types';
import {
  Building2,
  Plus,
  Globe,
  Users,
  Briefcase,
  Loader2,
  X,
  Search as SearchIcon,
  Trash2,
} from 'lucide-react';

export default function Companies() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [description, setDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [mainOfferings, setMainOfferings] = useState('');
  const [websiteUrls, setWebsiteUrls] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [styleProfile, setStyleProfile] = useState('');

  const fetchCompanies = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setCompanies((data || []) as Company[]);
  };

  useEffect(() => { fetchCompanies(); }, [user]);

  const resetForm = () => {
    setName(''); setIndustry(''); setDescription('');
    setTargetAudience(''); setMainOfferings('');
    setWebsiteUrls([]); setUrlInput(''); setStyleProfile('');
    setSavedCompanyId(null); setAnalyzeError('');
  };

  const addUrl = () => {
    const url = urlInput.trim();
    if (url && !websiteUrls.includes(url)) {
      setWebsiteUrls([...websiteUrls, url]);
      setUrlInput('');
    }
  };

  const [analyzeError, setAnalyzeError] = useState('');
  const [savedCompanyId, setSavedCompanyId] = useState<string | null>(null);

  const saveCompanyFirst = async (): Promise<string | null> => {
    if (!user || !name.trim()) return null;
    const { data, error } = await supabase
      .from('companies')
      .insert({
        user_id: user.id,
        name,
        industry,
        description,
        target_audience: targetAudience,
        main_offerings: mainOfferings,
        website_urls: websiteUrls,
      })
      .select('id')
      .maybeSingle();
    if (error || !data) return null;
    setSavedCompanyId(data.id);
    return data.id;
  };

  interface CompanyAnalyzeResponse {
    style_profile: string;
    style_data: Record<string, unknown>;
    pages_analyzed: number;
    sitemap_urls: string[];
  }

  const analyzeWebsite = async () => {
    setAnalyzing(true);
    setAnalyzeError('');
    try {
      // Save company first if not saved yet
      let companyId = savedCompanyId;
      if (!companyId) {
        companyId = await saveCompanyFirst();
        if (!companyId) {
          throw new Error('Bitte zuerst einen Firmennamen eingeben');
        }
      }

      const result = await apiPost<CompanyAnalyzeResponse>('/api/companies/analyze', {
        company_id: companyId,
        website_urls: websiteUrls,
      });
      setStyleProfile(result.style_profile);
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : 'Website-Analyse fehlgeschlagen');
    }
    setAnalyzing(false);
  };

  const handleSubmit = async () => {
    if (!user || !name.trim()) return;
    setLoading(true);

    if (savedCompanyId) {
      // Company was already created during analyze — update it
      await supabase
        .from('companies')
        .update({
          name,
          industry,
          description,
          target_audience: targetAudience,
          main_offerings: mainOfferings,
          website_urls: websiteUrls,
          style_profile: styleProfile ? { text: styleProfile } : null,
        })
        .eq('id', savedCompanyId);
    } else {
      // New company — insert
      await supabase.from('companies').insert({
        user_id: user.id,
        name,
        industry,
        description,
        target_audience: targetAudience,
        main_offerings: mainOfferings,
        website_urls: websiteUrls,
        style_profile: styleProfile ? { text: styleProfile } : null,
      });
    }

    resetForm();
    setSavedCompanyId(null);
    setAnalyzeError('');
    setDialogOpen(false);
    setLoading(false);
    fetchCompanies();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('companies').delete().eq('id', id);
    fetchCompanies();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Unternehmen</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">{companies.length} Unternehmen-Profile</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Neues Unternehmen
        </Button>
      </div>

      {companies.length === 0 ? (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-100 dark:bg-surface-800 mb-4">
                <Building2 className="h-8 w-8 text-surface-400" />
              </div>
              <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-1">Kein Unternehmen vorhanden</h3>
              <p className="text-surface-500 dark:text-surface-400 mb-4 max-w-sm">Erstelle ein Unternehmen-Profil, um personalisierte Blog-Artikel zu generieren.</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                Unternehmen erstellen
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company) => (
            <Card key={company.id} className="group hover:border-primary-200 hover:shadow-md transition-all duration-300 dark:hover:border-primary-800">
              <CardContent>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white text-lg font-bold shadow-md shadow-primary-500/20">
                      {company.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-surface-900 dark:text-surface-50">{company.name}</h3>
                      {company.industry && (
                        <p className="text-sm text-surface-500 dark:text-surface-400">{company.industry}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(company.id)}
                    className="opacity-0 group-hover:opacity-100 rounded-lg p-1.5 text-surface-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {company.description && (
                  <p className="mt-3 text-sm text-surface-600 dark:text-surface-400 line-clamp-2">{company.description}</p>
                )}
                <div className="mt-4 flex flex-wrap gap-3">
                  {company.target_audience && (
                    <span className="inline-flex items-center gap-1 text-xs text-surface-500 dark:text-surface-400">
                      <Users className="h-3 w-3" /> {company.target_audience}
                    </span>
                  )}
                  {company.main_offerings && (
                    <span className="inline-flex items-center gap-1 text-xs text-surface-500 dark:text-surface-400">
                      <Briefcase className="h-3 w-3" /> {company.main_offerings}
                    </span>
                  )}
                  {company.website_urls.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs text-surface-500 dark:text-surface-400">
                      <Globe className="h-3 w-3" /> {company.website_urls.length} URL(s)
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); resetForm(); }} className="max-w-xl">
        <DialogTitle>Neues Unternehmen</DialogTitle>
        <div className="space-y-4">
          <Input label="Firmenname" placeholder="z.B. Musterfirma GmbH" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Branche" placeholder="z.B. SaaS, E-Commerce..." value={industry} onChange={(e) => setIndustry(e.target.value)} />
          <Textarea label="Firmenbeschreibung" placeholder="Beschreibe dein Unternehmen..." value={description} onChange={(e) => setDescription(e.target.value)} />
          <Input label="Zielgruppe" placeholder="z.B. B2B SaaS-Unternehmen" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} />
          <Input label="Hauptangebote" placeholder="z.B. Cloud-Software, Beratung" value={mainOfferings} onChange={(e) => setMainOfferings(e.target.value)} />

          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Website-URLs</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUrl())}
                placeholder="https://..."
                className="flex-1 rounded-lg border border-surface-200 bg-white px-3.5 py-2.5 text-sm dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
              <Button variant="secondary" onClick={addUrl}>Hinzufuegen</Button>
            </div>
            {websiteUrls.length > 0 && (
              <div className="mt-2 space-y-1">
                {websiteUrls.map((url) => (
                  <div key={url} className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                    <Globe className="h-3 w-3 shrink-0" />
                    <span className="truncate">{url}</span>
                    <button onClick={() => setWebsiteUrls(websiteUrls.filter((u) => u !== url))} className="shrink-0 text-surface-400 hover:text-red-500">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {websiteUrls.length > 0 && (
              <Button variant="ghost" size="sm" className="mt-2" onClick={analyzeWebsite} disabled={analyzing || !name.trim()}>
                {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <SearchIcon className="h-3.5 w-3.5" />}
                {analyzing ? 'Analyse laeuft...' : 'Website analysieren'}
              </Button>
            )}
            {analyzeError && (
              <p className="mt-1 text-xs text-red-500">{analyzeError}</p>
            )}
          </div>

          {styleProfile && (
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Schreibstil-Preview</label>
              <div className="rounded-lg border border-surface-200 bg-surface-50 p-3 text-sm text-surface-600 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400">
                {styleProfile}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Abbrechen</Button>
            <Button onClick={handleSubmit} disabled={!name.trim() || loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Erstellen'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
