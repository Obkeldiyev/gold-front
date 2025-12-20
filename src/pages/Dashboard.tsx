import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { balanceApi, branchesApi, Balance, Branch } from '@/lib/api';
import { 
  Wallet, 
  Building2, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { t } = useTranslation();
  const { isSuperAdmin } = useAuth();
  const [balance, setBalance] = useState<Balance | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [balanceRes, branchesRes] = await Promise.all([
        balanceApi.getBalance(),
        branchesApi.getAll(),
      ]);
      
      if (balanceRes.success && balanceRes.data?.[0]) {
        setBalance(balanceRes.data[0]);
      }
      if (branchesRes.success) {
        setBranches(branchesRes.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const totalBranchBalance = branches.reduce((sum, b) => sum + (b.balance || 0), 0);

  const stats = [
    {
      title: t('dashboard.totalBalance'),
      value: formatNumber(balance?.balance || 0),
      suffix: t('common.gr'),
      icon: Wallet,
      trend: '+12.5%',
      trendUp: true,
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      title: t('dashboard.totalBranches'),
      value: branches.length,
      icon: Building2,
      trend: '+2',
      trendUp: true,
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'Total Branch Balance',
      value: formatNumber(totalBranchBalance),
      suffix: t('common.gr'),
      icon: TrendingUp,
      trend: '+8.2%',
      trendUp: true,
      gradient: 'from-blue-500 to-indigo-600',
    },
    {
      title: 'Active Operations',
      value: '24',
      icon: Sparkles,
      trend: '+5',
      trendUp: true,
      gradient: 'from-purple-500 to-pink-600',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Welcome section */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {t('dashboard.welcome')} 👋
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your gold trading today.
          </p>
        </div>
        <div className="flex gap-3">
          {isSuperAdmin && (
            <Link to="/balance">
              <Button className="gold-gradient gold-glow">
                <TrendingUp className="mr-2 h-4 w-4" />
                {t('dashboard.income')}
              </Button>
            </Link>
          )}
        </div>
      </motion.div>

      {/* Stats grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Card className="stat-card relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">
                      {stat.title}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">{stat.value}</span>
                      {stat.suffix && (
                        <span className="text-lg text-muted-foreground">{stat.suffix}</span>
                      )}
                    </div>
                    <div className={`flex items-center gap-1 text-sm ${stat.trendUp ? 'text-success' : 'text-destructive'}`}>
                      {stat.trendUp ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4" />
                      )}
                      <span>{stat.trend}</span>
                      <span className="text-muted-foreground">this month</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                {/* Decorative gradient */}
                <div 
                  className={`absolute -bottom-8 -right-8 w-32 h-32 rounded-full opacity-10 bg-gradient-to-br ${stat.gradient} blur-2xl`} 
                />
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Main balance card */}
      <motion.div variants={itemVariants}>
        <Card className="glass-card p-8 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl gold-gradient flex items-center justify-center gold-glow">
                  <Wallet className="h-7 w-7 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                    Main Portfolio Value
                  </p>
                  <h2 className="text-4xl font-bold gold-text">
                    {formatNumber(balance?.balance || 0)} <span className="text-2xl">{t('common.gr')}</span>
                  </h2>
                </div>
              </div>
              <p className="text-muted-foreground max-w-md">
                Your central balance for all gold trading operations. Transfer to branches or add income/outcomes.
              </p>
            </div>
            
            <div className="flex gap-3">
              {isSuperAdmin && (
                <>
                  <Link to="/balance">
                    <Button variant="outline" className="border-success text-success hover:bg-success/10">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Add Income
                    </Button>
                  </Link>
                  <Link to="/balance">
                    <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">
                      <TrendingDown className="mr-2 h-4 w-4" />
                      Add Outcome
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-primary/10 blur-3xl" />
        </Card>
      </motion.div>

      {/* Branches overview */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">{t('branches.allBranches')}</h3>
          <Link to="/branches">
            <Button variant="ghost" className="text-primary">
              View All
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.slice(0, 6).map((branch, index) => (
            <motion.div
              key={branch.id}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
            >
              <Card className="glass-card p-5 hover:shadow-lg transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{branch.name}</h4>
                    <p className="text-sm text-muted-foreground truncate">
                      {branch.description || 'No description'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">
                      {formatNumber(branch.balance || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">{t('common.gr')}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick actions */}
      {isSuperAdmin && (
        <motion.div variants={itemVariants}>
          <h3 className="text-xl font-semibold mb-6">{t('dashboard.quickActions')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: t('branches.addBranch'), icon: Building2, path: '/branches', color: 'from-blue-500 to-indigo-600' },
              { label: t('managers.addManager'), icon: TrendingUp, path: '/managers', color: 'from-emerald-500 to-teal-600' },
              { label: t('branches.transfer'), icon: ArrowUpRight, path: '/branches', color: 'from-amber-500 to-orange-600' },
              { label: t('profile.updateProfile'), icon: Sparkles, path: '/profile', color: 'from-purple-500 to-pink-600' },
            ].map((action, index) => {
              const Icon = action.icon;
              return (
                <Link key={action.label} to={action.path}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="glass-card rounded-xl p-6 text-center cursor-pointer hover:shadow-lg transition-all"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} mx-auto mb-3 flex items-center justify-center`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <p className="font-medium text-sm">{action.label}</p>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
