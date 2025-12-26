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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Wallet, TrendingUp, TrendingDown, Loader2, Plus, Minus, Calendar, Search, Upload, X } from 'lucide-react';
import { format } from 'date-fns';

export default function BalancePage() {
  const { t } = useTranslation();
  const { isSuperAdmin } = useAuth();
  const [balance, setBalance] = useState<Balance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [outcomeDialogOpen, setOutcomeDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // Form states
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('completed');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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

  const resetForm = () => {
    setAmount('');
    setStatus('completed');
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
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
        balance?.id || 1,
        selectedImage || undefined
      );
      
      if (response.success) {
        toast.success('Income added successfully');
        setIncomeDialogOpen(false);
        resetForm();
        fetchBalance();
      } else {
        toast.error(response.message || 'Failed to add income');
      }
    } catch (error: any) {
      console.error('Income error:', error);
      // More specific error handling
      if (error.response?.status === 409) {
        toast.error('Something went wrong with the balance operation');
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('You are not authorized to perform this action');
      } else {
        toast.error(error.response?.data?.message || 'Something went wrong. Please try again.');
      }
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
        balance?.id || 1,
        selectedImage || undefined
      );
      
      if (response.success) {
        toast.success('Outcome added successfully');
        setOutcomeDialogOpen(false);
        resetForm();
        fetchBalance();
      } else {
        toast.error(response.message || 'Failed to add outcome');
      }
    } catch (error: any) {
      console.error('Outcome error:', error);
      // More specific error handling
      if (error.response?.status === 409) {
        toast.error('Something went wrong with the balance operation');
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('You are not authorized to perform this action');
      } else {
        toast.error(error.response?.data?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredIncomes = (balance?.incomes || []).filter(income => {
    const matchesSearch = searchTerm === '' || 
      income.amount.toString().includes(searchTerm) ||
      income.status.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || income.status === selectedStatus;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredOutcomes = (balance?.outcomes || []).filter(outcome => {
    const matchesSearch = searchTerm === '' || 
      outcome.amount.toString().includes(searchTerm) ||
      outcome.status.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || outcome.status === selectedStatus;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <span className="status-completed">{t('transactions.status.completed')}</span>;
      case 'pending':
        return <span className="status-pending">{t('transactions.status.pending')}</span>;
      case 'failed':
        return <span className="status-failed">{t('transactions.status.failed')}</span>;
      default:
        return <span className="status-pending">{status}</span>;
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return t('transactions.noDate');
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return t('transactions.invalidDate');
      return format(date, 'MMM dd, yyyy HH:mm');
    } catch (error) {
      return t('transactions.invalidDate');
    }
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
            <Dialog open={incomeDialogOpen} onOpenChange={(open) => {
              setIncomeDialogOpen(open);
              if (!open) {
                resetForm();
              }
            }}>
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
                  
                  {/* Image Upload */}
                  <div className="space-y-2">
                    <Label>Attach Image (Optional)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        id="income-image-upload"
                      />
                      <Label
                        htmlFor="income-image-upload"
                        className="flex items-center gap-2 px-4 py-2 border border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <Upload className="h-4 w-4" />
                        {selectedImage ? selectedImage.name : 'Choose image'}
                      </Label>
                      {selectedImage && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedImage(null);
                            setImagePreview(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {imagePreview && (
                      <div className="mt-2">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full max-w-xs h-32 object-cover rounded-lg border"
                        />
                      </div>
                    )}
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

            <Dialog open={outcomeDialogOpen} onOpenChange={(open) => {
              setOutcomeDialogOpen(open);
              if (!open) {
                resetForm();
              }
            }}>
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
                  
                  {/* Image Upload */}
                  <div className="space-y-2">
                    <Label>Attach Image (Optional)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        id="outcome-image-upload"
                      />
                      <Label
                        htmlFor="outcome-image-upload"
                        className="flex items-center gap-2 px-4 py-2 border border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <Upload className="h-4 w-4" />
                        {selectedImage ? selectedImage.name : 'Choose image'}
                      </Label>
                      {selectedImage && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedImage(null);
                            setImagePreview(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {imagePreview && (
                      <div className="mt-2">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full max-w-xs h-32 object-cover rounded-lg border"
                        />
                      </div>
                    )}
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

      {/* Incomes and Outcomes History */}
      <Card className="glass-card p-6">
        <Tabs defaultValue="incomes" className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="incomes" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Incomes ({balance?.incomes?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="outcomes" className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Outcomes ({balance?.outcomes?.length || 0})
              </TabsTrigger>
            </TabsList>
            
            {/* Filters */}
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="pl-10 w-48"
                />
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Incomes Tab */}
          <TabsContent value="incomes" className="space-y-4">
            {filteredIncomes.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm || selectedStatus !== 'all' ? 'No incomes match your filters.' : 'No incomes recorded yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredIncomes.map((income, index) => (
                  <motion.div
                    key={income.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="glass-card p-4 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-success" />
                          </div>
                          <div>
                            <p className="font-semibold text-success">
                              +{formatNumber(income.amount)} {t('common.gr')}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(income.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(income.status)}
                          <p className="text-xs text-muted-foreground mt-1">ID: #{income.id}</p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Outcomes Tab */}
          <TabsContent value="outcomes" className="space-y-4">
            {filteredOutcomes.length === 0 ? (
              <div className="text-center py-12">
                <TrendingDown className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm || selectedStatus !== 'all' ? 'No outcomes match your filters.' : 'No outcomes recorded yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOutcomes.map((outcome, index) => (
                  <motion.div
                    key={outcome.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="glass-card p-4 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                            <TrendingDown className="h-5 w-5 text-destructive" />
                          </div>
                          <div>
                            <p className="font-semibold text-destructive">
                              -{formatNumber(outcome.amount)} {t('common.gr')}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(outcome.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(outcome.status)}
                          <p className="text-xs text-muted-foreground mt-1">ID: #{outcome.id}</p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
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
