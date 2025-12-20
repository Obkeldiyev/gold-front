import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sun, Moon, Globe, Bell, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface HeaderProps {
  collapsed: boolean;
}

export default function Header({ collapsed }: HeaderProps) {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user, isSuperAdmin } = useAuth();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  const languageLabels: Record<string, string> = {
    en: 'EN',
    ru: 'RU',
    uz: 'UZ',
  };

  return (
    <header
      className="fixed top-0 right-0 h-20 bg-background/80 backdrop-blur-xl border-b border-border/50 z-40 flex items-center justify-between px-6"
      style={{ left: collapsed ? 80 : 280, transition: 'left 0.3s ease-in-out' }}
    >
      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder={t('common.search') + '...'}
          className="pl-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
        />
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
        </Button>

        {/* Language switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <Globe className="h-4 w-4" />
              <span className="font-medium">{languageLabels[i18n.language] || 'EN'}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => changeLanguage('en')}>
              🇺🇸 English
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeLanguage('ru')}>
              🇷🇺 Русский
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeLanguage('uz')}>
              🇺🇿 O'zbek
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        {/* User info */}
        <div className="flex items-center gap-3 pl-3 border-l border-border">
          <div className="w-9 h-9 rounded-full gold-gradient flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">
              {isSuperAdmin ? 'SA' : 'M'}
            </span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium">
              {isSuperAdmin ? 'Super Admin' : 'Manager'}
            </p>
            <p className="text-xs text-muted-foreground">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
