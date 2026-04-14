import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  PenTool,
  FileText,
  Building2,
  KeyRound,
  Settings,
  LogOut,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Uebersicht' },
  { to: '/blog/new', icon: PenTool, label: 'Blog Schreiber' },
  { to: '/blogs', icon: FileText, label: 'Meine Blogs' },
  { to: '/companies', icon: Building2, label: 'Unternehmen' },
  { to: '/keywords', icon: KeyRound, label: 'Keywords' },
  { to: '/settings', icon: Settings, label: 'Einstellungen' },
];

export function Sidebar() {
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-surface-200 bg-white transition-all duration-300 dark:border-surface-800 dark:bg-surface-900',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      <div className={cn('flex h-16 items-center border-b border-surface-200 dark:border-surface-800 px-4', collapsed ? 'justify-center' : 'gap-3')}>
        <img
          src="/generation-ccc5ecef-1a19-42c2-8a92-cf4b4f4c9071.png"
          alt="Blogreich"
          className="h-9 w-9 shrink-0 rounded-lg object-contain"
        />
        {!collapsed && (
          <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
            Blogreich
          </span>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                collapsed && 'justify-center px-2',
                isActive
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                  : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-200'
              )
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-surface-200 dark:border-surface-800 p-3 space-y-1">
        <button
          onClick={toggleTheme}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-surface-600 hover:bg-surface-50 hover:text-surface-900 transition-colors dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-200',
            collapsed && 'justify-center px-2'
          )}
        >
          {theme === 'light' ? <Moon className="h-5 w-5 shrink-0" /> : <Sun className="h-5 w-5 shrink-0" />}
          {!collapsed && <span>{theme === 'light' ? 'Dunkelmodus' : 'Hellmodus'}</span>}
        </button>
        <button
          onClick={handleSignOut}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-surface-600 hover:bg-red-50 hover:text-red-600 transition-colors dark:text-surface-400 dark:hover:bg-red-900/20 dark:hover:text-red-400',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Abmelden</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-surface-600 hover:bg-surface-50 hover:text-surface-900 transition-colors dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-200',
            collapsed && 'justify-center px-2'
          )}
        >
          {collapsed ? <ChevronRight className="h-5 w-5 shrink-0" /> : <ChevronLeft className="h-5 w-5 shrink-0" />}
          {!collapsed && <span>Einklappen</span>}
        </button>
      </div>
    </aside>
  );
}
