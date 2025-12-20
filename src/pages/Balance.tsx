import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { balanceApi, Balance } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Wallet, TrendingUp, TrendingDown, Loader2, Plus, Minus } from 'lucide-react';

export default function BalancePage() {
  const { t } = useTranslation();
  const { isSuperAdmin } = useAuth();
  const [balance, setBalance] = useState<Balance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [outcomeDialogOpen, setOutcomeDialogOpen] = useState(false);
  
  // Form states
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('completed');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      const response = await balanceApi.getBalance();
      if (response.success && response.data?.[0]) {
        setBalance(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      toast.error(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleIncome = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await balanceApi.addIncome(
        parseFloat(amount),
        status,
        balance?.id || 1
      );
      
      if (response.success) {
        toast.success('Income added successfully');
        setIncomeDialogOpen(false);
        setAmount('');
        fetchBalance();
      } else {
        toast.error(response.message || 'Failed to add income');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add income');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOutcome = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await balanceApi.addOutcome(
        parseFloat(amount),
        status,
        balance?.id || 1
      );
      
      if (response.success) {
        toast.success('Outcome added successfully');
        setOutcomeDialogOpen(false);
        setAmount('');
        fetchBalance();
      } else {
        toast.error(response.message || 'Failed to add outcome');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add outcome');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('balance.title')}</h1>
          <p className="text-muted-foreground">
            Manage your main balance, add incomes and outcomes
          </p>
        </div>
        {isSuperAdmin && (
          <div className="flex gap-3">
            <Dialog open={incomeDialogOpen} onOpenChange={setIncomeDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-success hover:bg-success/90">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('balance.addIncome')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('balance.addIncome')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>{t('balance.amount')} ({t('common.gr')})</Label>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('balance.status')}</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="completed">{t('common.completed')}</SelectItem>
                        <SelectItem value="pending">{t('common.pending')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleIncome} 
                    className="w-full bg-success hover:bg-success/90"
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('balance.submit')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={outcomeDialogOpen} onOpenChange={setOutcomeDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Minus className="mr-2 h-4 w-4" />
                  {t('balance.addOutcome')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('balance.addOutcome')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>{t('balance.amount')} ({t('common.gr')})</Label>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('balance.status')}</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="completed">{t('common.completed')}</SelectItem>
                        <SelectItem value="pending">{t('common.pending')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleOutcome} 
                    className="w-full"
                    variant="destructive"
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('balance.submit')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Main balance display */}
      <Card className="glass-card p-8 relative overflow-hidden">
        <div className="flex flex-col items-center text-center space-y-6">
          <motion.div 
            className="w-24 h-24 rounded-3xl gold-gradient flex items-center justify-center gold-glow"
            animate={{ 
              boxShadow: [
                '0 0 20px hsl(38 92% 50% / 0.3)',
                '0 0 40px hsl(38 92% 50% / 0.5)',
                '0 0 20px hsl(38 92% 50% / 0.3)',
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Wallet className="h-12 w-12 text-primary-foreground" />
          </motion.div>
          
          <div>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest mb-2">
              {t('balance.currentBalance')}
            </p>
            <motion.h1 
              className="text-6xl font-bold gold-text"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              {formatNumber(balance?.balance || 0)}
            </motion.h1>
            <p className="text-2xl text-muted-foreground mt-2">{t('common.gr')}</p>
          </div>

          <div className="flex gap-8 pt-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-success mb-1">
                <TrendingUp className="h-5 w-5" />
                <span className="font-semibold">Income</span>
              </div>
              <p className="text-sm text-muted-foreground">Add gold to balance</p>
            </div>
            <div className="w-px bg-border" />
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-destructive mb-1">
                <TrendingDown className="h-5 w-5" />
                <span className="font-semibold">Outcome</span>
              </div>
              <p className="text-sm text-muted-foreground">Remove gold from balance</p>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
      </Card>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-card p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-success/10">
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Add Income</h3>
              <p className="text-sm text-muted-foreground">
                Record incoming gold amounts to increase your main balance. 
                Each transaction is tracked with status and timestamp.
              </p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-destructive/10">
              <TrendingDown className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Add Outcome</h3>
              <p className="text-sm text-muted-foreground">
                Record outgoing gold amounts to decrease your main balance.
                Only available if you have sufficient balance.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
