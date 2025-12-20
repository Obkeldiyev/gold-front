import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Wallet,
  Building2,
  Users,
  ArrowRightLeft,
  UserCircle,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const { logout, isSuperAdmin } = useAuth();

  const navItems = [
    { 
      path: '/dashboard', 
      icon: LayoutDashboard, 
      label: t('nav.dashboard'),
      roles: ['super admin', 'manager']
    },
    { 
      path: '/balance', 
      icon: Wallet, 
      label: t('nav.balance'),
      roles: ['super admin', 'manager']
    },
    { 
      path: '/branches', 
      icon: Building2, 
      label: t('nav.branches'),
      roles: ['super admin', 'manager']
    },
    { 
      path: '/managers', 
      icon: Users, 
      label: t('nav.managers'),
      roles: ['super admin']
    },
    { 
      path: '/transactions', 
      icon: ArrowRightLeft, 
      label: t('nav.transactions'),
      roles: ['super admin', 'manager']
    },
    { 
      path: '/profile', 
      icon: UserCircle, 
      label: t('nav.profile'),
      roles: ['super admin']
    },
  ];

  const filteredItems = navItems.filter(item => 
    isSuperAdmin ? true : item.roles.includes('manager')
  );

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-screen bg-sidebar z-50 flex flex-col border-r border-sidebar-border"
    >
      {/* Logo */}
      <div className="h-20 flex items-center justify-center border-b border-sidebar-border">
        <motion.div
          animate={{ scale: collapsed ? 0.8 : 1 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center shadow-lg">
            <span className="text-lg font-bold text-primary-foreground">V</span>
          </div>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="text-xl font-bold text-sidebar-foreground"
            >
              Vostok
            </motion.span>
          )}
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {filteredItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                  isActive
                    ? 'gold-gradient text-primary-foreground font-medium shadow-lg gold-glow'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                )}
              >
                <Icon className={cn('h-5 w-5 flex-shrink-0', collapsed && 'mx-auto')} />
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <Button
          variant="ghost"
          onClick={logout}
          className={cn(
            'w-full justify-start gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>{t('nav.logout')}</span>}
        </Button>
      </div>

      {/* Toggle button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="absolute -right-4 top-24 w-8 h-8 rounded-full bg-sidebar border border-sidebar-border hover:bg-sidebar-accent z-50"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>
    </motion.aside>
  );
}
