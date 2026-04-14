import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Sun, Moon, Copy, Check, User, Key, Palette } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [copied, setCopied] = useState<string | null>(null);

  const maskedKey = 'sk-•••••••••••••••••••••••••••••••••';

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Einstellungen</h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">Verwalte dein Profil und Einstellungen</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary-500" />
            Profil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              label="E-Mail"
              value={user?.email || ''}
              disabled
              className="bg-surface-50 dark:bg-surface-800"
            />
            <Input
              label="Name"
              placeholder="Dein Name"
              defaultValue=""
            />
            <Button>Profil speichern</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary-500" />
            API-Schluessel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">API-Schluessel</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-lg border border-surface-200 bg-surface-50 px-3.5 py-2.5 text-sm font-mono text-surface-500 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400">
                  {maskedKey}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(maskedKey, 'api')}
                >
                  {copied === 'api' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Supabase URL</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-lg border border-surface-200 bg-surface-50 px-3.5 py-2.5 text-sm font-mono text-surface-500 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400 truncate">
                  {import.meta.env.VITE_SUPABASE_URL || '•••'}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(import.meta.env.VITE_SUPABASE_URL || '', 'url')}
                >
                  {copied === 'url' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary-500" />
            Darstellung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-surface-900 dark:text-surface-100">Farbschema</p>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Aktuell: {theme === 'light' ? 'Hell' : 'Dunkel'}
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className="relative flex h-10 w-20 items-center rounded-full bg-surface-200 p-1 transition-colors dark:bg-surface-700"
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-300 dark:bg-surface-600 ${theme === 'dark' ? 'translate-x-10' : 'translate-x-0'}`}>
                {theme === 'light' ? (
                  <Sun className="h-4 w-4 text-amber-500" />
                ) : (
                  <Moon className="h-4 w-4 text-primary-400" />
                )}
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
