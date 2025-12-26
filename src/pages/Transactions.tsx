import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { branchesApi, balanceApi, Branch, Balance, Transaction } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  ArrowRightLeft,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  Loader2,
  Wallet,
  Search,
  Filter,
  Calendar as CalendarIcon,
  X,
  Image as ImageIcon,
  Eye,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Transactions() {
  const { t } = useTranslation();
  const { isSuperAdmin } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactionDetailOpen, setTransactionDetailOpen] = useState(false);

  // Balance to Branch form
  const [balanceToBranchForm, setBalanceToBranchForm] = useState({
    amount: '',
    branchId: '',
    isSubmitting: false,
  });
  const [balanceToBranchImage, setBalanceToBranchImage] = useState<File | null>(null);
  const [balanceToBranchImagePreview, setBalanceToBranchImagePreview] = useState<string | null>(null);

  // Branch to Balance form
  const [branchToBalanceForm, setBranchToBalanceForm] = useState({
    amount: '',
    branchId: '',
    ugarAmount: '',
    reason: '',
    isSubmitting: false,
  });
  const [branchToBalanceImage, setBranchToBalanceImage] = useState<File | null>(null);
  const [branchToBalanceImagePreview, setBranchToBalanceImagePreview] = useState<string | null>(null);

  // Branch to Branch form
  const [branchToBranchForm, setBranchToBranchForm] = useState({
    amount: '',
    fromBranchId: '',
    toBranchId: '',
    isSubmitting: false,
  });
  const [branchToBranchImage, setBranchToBranchImage] = useState<File | null>(null);
  const [branchToBranchImagePreview, setBranchToBranchImagePreview] = useState<string | null>(null);

  // Helper function to build full image URL from filename
  const getImageUrl = (imageName: string | null | undefined): string | null => {
    console.log(imageName);
    const fullUrl = `/api/uploads/${imageName}`;
    return fullUrl;
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [branchesRes, balanceRes, transactionsRes] = await Promise.all([
        branchesApi.getAll(),
        balanceApi.getBalance(),
        branchesApi.getAllTransactions(),
      ]);

      if (branchesRes.success) {
        setBranches(branchesRes.data || []);
      }
      if (balanceRes.success && balanceRes.data?.[0]) {
        setBalance(balanceRes.data[0]);
      }
      if (transactionsRes.success) {
        console.log('Raw transactions from backend:', transactionsRes.data);
        // Log a sample transaction to see the image data structure
        if (transactionsRes.data && transactionsRes.data.length > 0) {
          console.log('Sample transaction:', transactionsRes.data[0]);
        }
        setTransactions(transactionsRes.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'balanceToBranch' | 'branchToBalance' | 'branchToBranch'
  ) => {
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

      // Set image based on type
      if (type === 'balanceToBranch') {
        setBalanceToBranchImage(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setBalanceToBranchImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else if (type === 'branchToBalance') {
        setBranchToBalanceImage(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setBranchToBalanceImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else if (type === 'branchToBranch') {
        setBranchToBranchImage(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setBranchToBranchImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const clearImage = (type: 'balanceToBranch' | 'branchToBalance' | 'branchToBranch') => {
    if (type === 'balanceToBranch') {
      setBalanceToBranchImage(null);
      setBalanceToBranchImagePreview(null);
    } else if (type === 'branchToBalance') {
      setBranchToBalanceImage(null);
      setBranchToBalanceImagePreview(null);
    } else if (type === 'branchToBranch') {
      setBranchToBranchImage(null);
      setBranchToBranchImagePreview(null);
    }
  };

  const handleBalanceToBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!balanceToBranchForm.amount || !balanceToBranchForm.branchId) {
      toast.error('Please fill all fields');
      return;
    }

    setBalanceToBranchForm(prev => ({ ...prev, isSubmitting: true }));

    try {
      const response = await branchesApi.balanceToBranch(
        parseFloat(balanceToBranchForm.amount),
        balanceToBranchForm.branchId,
        balanceToBranchImage || undefined
      );

      if (response.success) {
        toast.success('Transfer completed successfully');
        setBalanceToBranchForm({ amount: '', branchId: '', isSubmitting: false });
        clearImage('balanceToBranch');
        fetchData(); // Refresh data
      } else {
        toast.error(response.message || 'Transfer failed');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Transfer failed');
    } finally {
      setBalanceToBranchForm(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleBranchToBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchToBalanceForm.amount || !branchToBalanceForm.branchId || !branchToBalanceForm.ugarAmount || !branchToBalanceForm.reason) {
      toast.error('Please fill all fields');
      return;
    }

    setBranchToBalanceForm(prev => ({ ...prev, isSubmitting: true }));

    try {
      const response = await branchesApi.branchToBalance(
        parseFloat(branchToBalanceForm.amount),
        branchToBalanceForm.branchId,
        parseFloat(branchToBalanceForm.ugarAmount),
        branchToBalanceForm.reason,
        branchToBalanceImage || undefined
      );

      if (response.success) {
        toast.success('Transfer completed successfully');
        setBranchToBalanceForm({ amount: '', branchId: '', ugarAmount: '', reason: '', isSubmitting: false });
        clearImage('branchToBalance');
        fetchData(); // Refresh data
      } else {
        toast.error(response.message || 'Transfer failed');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Transfer failed');
    } finally {
      setBranchToBalanceForm(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleBranchToBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchToBranchForm.amount || !branchToBranchForm.fromBranchId || !branchToBranchForm.toBranchId) {
      toast.error('Please fill all fields');
      return;
    }

    if (branchToBranchForm.fromBranchId === branchToBranchForm.toBranchId) {
      toast.error('Cannot transfer to the same branch');
      return;
    }

    setBranchToBranchForm(prev => ({ ...prev, isSubmitting: true }));

    try {
      const response = await branchesApi.branchToBranch(
        parseFloat(branchToBranchForm.amount),
        branchToBranchForm.fromBranchId,
        branchToBranchForm.toBranchId,
        branchToBranchImage || undefined
      );

      if (response.success) {
        toast.success('Transfer completed successfully');
        setBranchToBranchForm({ amount: '', fromBranchId: '', toBranchId: '', isSubmitting: false });
        clearImage('branchToBranch');
        fetchData(); // Refresh data
      } else {
        toast.error(response.message || 'Transfer failed');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Transfer failed');
    } finally {
      setBranchToBranchForm(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setSelectedBranch('all');
    setSelectedStatus('all');
    setMinAmount('');
    setMaxAmount('');
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const hasActiveFilters =
    searchTerm ||
    selectedType !== 'all' ||
    selectedBranch !== 'all' ||
    selectedStatus !== 'all' ||
    minAmount ||
    maxAmount ||
    dateFrom ||
    dateTo;

  const filteredTransactions = transactions.filter(tx => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        tx.reason?.toLowerCase().includes(searchLower) ||
        tx.branch?.toLowerCase().includes(searchLower) ||
        tx.from?.toLowerCase().includes(searchLower) ||
        tx.to?.toLowerCase().includes(searchLower) ||
        tx.source?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Type filter
    if (selectedType !== 'all' && tx.type !== selectedType) {
      return false;
    }

    // Branch filter
    if (selectedBranch !== 'all') {
      const branchMatches =
        tx.branch === selectedBranch ||
        tx.from === selectedBranch ||
        tx.to === selectedBranch;
      if (!branchMatches) return false;
    }

    // Status filter (only for transactions that have status)
    if (selectedStatus !== 'all' && tx.status && tx.status !== selectedStatus) {
      return false;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      const txDate = new Date(tx.date);
      if (dateFrom && txDate < dateFrom) return false;
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        if (txDate > endOfDay) return false;
      }
    }

    // Amount range filter
    if (minAmount && tx.amount < parseFloat(minAmount)) {
      return false;
    }
    if (maxAmount && tx.amount > parseFloat(maxAmount)) {
      return false;
    }

    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getTypeIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'INCOME':
        return <ArrowDownRight className="h-4 w-4 text-success" />;
      case 'OUTCOME':
        return <ArrowUpRight className="h-4 w-4 text-destructive" />;
      case 'BALANCE_TO_BRANCH':
        return <ArrowDownRight className="h-4 w-4 text-blue-500" />;
      case 'BRANCH_TO_BALANCE':
        return <ArrowUpRight className="h-4 w-4 text-orange-500" />;
      case 'BRANCH_TO_BRANCH':
        return <ArrowRightLeft className="h-4 w-4 text-purple-500" />;
      case 'UGAR_LOSS':
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      default:
        return <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTypeBadge = (type: Transaction['type']) => {
    const styles: Record<string, string> = {
      INCOME: 'bg-success/10 text-success',
      OUTCOME: 'bg-destructive/10 text-destructive',
      BALANCE_TO_BRANCH: 'bg-blue-500/10 text-blue-500',
      BRANCH_TO_BALANCE: 'bg-orange-500/10 text-orange-500',
      BRANCH_TO_BRANCH: 'bg-purple-500/10 text-purple-500',
      UGAR_LOSS: 'bg-red-500/10 text-red-500',
    };

    const labels: Record<string, string> = {
      INCOME: 'Income',
      OUTCOME: 'Outcome',
      BALANCE_TO_BRANCH: 'Balance → Branch',
      BRANCH_TO_BALANCE: 'Branch → Balance',
      BRANCH_TO_BRANCH: 'Branch → Branch',
      UGAR_LOSS: 'Ugar Loss',
    };

    return (
      <span className={cn('px-2 py-1 rounded-full text-xs font-medium', styles[type] || 'bg-muted text-muted-foreground')}>
        {labels[type] || type}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return <span className="status-completed">Completed</span>;
      case 'pending':
        return <span className="status-pending">Pending</span>;
      case 'failed':
      case 'error':
        return <span className="status-failed">Failed</span>;
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

  const formatDate = (dateString: string, formatStr: string) => {
    if (!dateString) return 'No date';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return format(date, formatStr);
    } catch (error) {
      return 'Invalid date';
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
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">{t('nav.transactions')}</h1>
        <p className="text-muted-foreground">
          Transfer gold between balance and branches, and view transaction history
        </p>
      </div>

      {/* Current Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gold-gradient flex items-center justify-center gold-glow">
              <Wallet className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Main Balance</p>
              <p className="text-2xl font-bold gold-text">
                {formatNumber(balance?.balance || 0)} {t('common.gr')}
              </p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Branch Balance</p>
              <p className="text-2xl font-bold">
                {formatNumber(branches.reduce((sum, b) => sum + (b.balance || 0), 0))} {t('common.gr')}
              </p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Company Balance</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatNumber((balance?.balance || 0) + branches.reduce((sum, b) => sum + (b.balance || 0), 0))} {t('common.gr')}
              </p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <ArrowRightLeft className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Transactions</p>
              <p className="text-2xl font-bold">{transactions.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history">Transaction History</TabsTrigger>
          <TabsTrigger value="transfer">Make Transfer</TabsTrigger>
        </TabsList>

        {/* Transaction History */}
        <TabsContent value="history" className="space-y-6">
          {/* Filters */}
          <Card className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </h3>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear Filters
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="INCOME">Income</SelectItem>
                    <SelectItem value="OUTCOME">Outcome</SelectItem>
                    <SelectItem value="BALANCE_TO_BRANCH">Balance → Branch</SelectItem>
                    <SelectItem value="BRANCH_TO_BALANCE">Branch → Balance</SelectItem>
                    <SelectItem value="BRANCH_TO_BRANCH">Branch → Branch</SelectItem>
                    <SelectItem value="UGAR_LOSS">Ugar Loss</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Branch */}
              <div className="space-y-2">
                <Label>Branch</Label>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.name}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date From */}
              <div className="space-y-2">
                <Label>From Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, 'PP') : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date To */}
              <div className="space-y-2">
                <Label>To Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, 'PP') : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Amount Range */}
              <div className="space-y-2">
                <Label>Amount Range</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    placeholder="Min"
                  />
                  <Input
                    type="number"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Results count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </p>
          </div>

          {/* Transactions Table */}
          <Card className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr className="bg-muted/50">
                    <th>ID</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Details</th>
                    <th>Amount</th>
                    <th>Image</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx, index) => (
                    <motion.tr
                      key={`${tx.type}-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => {
                        setSelectedTransaction(tx);
                        setTransactionDetailOpen(true);
                      }}
                    >
                      <td className="font-mono text-muted-foreground">#{index + 1}</td>
                      <td>{formatDate(tx.date, 'dd/MM/yyyy')}</td>
                      <td>{formatDate(tx.date, 'HH:mm')}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(tx.type)}
                          {getTypeBadge(tx.type)}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {tx.type === 'BRANCH_TO_BRANCH'
                            ? `${tx.from} → ${tx.to}`
                            : tx.type === 'BALANCE_TO_BRANCH'
                              ? `Main → ${tx.branch}`
                              : tx.type === 'BRANCH_TO_BALANCE'
                                ? `${tx.branch} → Main`
                                : tx.type === 'UGAR_LOSS'
                                  ? `${tx.branch} (${tx.reason})`
                                  : tx.source || 'Balance operation'}
                        </div>
                      </td>
                      <td className={cn(
                        'font-semibold font-mono',
                        tx.type === 'INCOME' || tx.type === 'BALANCE_TO_BRANCH' ? 'text-success' : 'text-destructive'
                      )}>
                        {tx.type === 'INCOME' || tx.type === 'BALANCE_TO_BRANCH' ? '+' : '-'}
                        {formatNumber(tx.amount)} {t('common.gr')}
                      </td>
                      <td>
                        {getImageUrl(tx.image) ? (
                          <div className="flex items-center gap-2">
                            <ImageIcon className="h-4 w-4 text-primary" />
                            <span className="text-xs text-muted-foreground">Image</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No image</span>
                        )}
                      </td>
                      <td>
                        {tx.status ? getStatusBadge(tx.status) : (
                          <span className="status-completed">Completed</span>
                        )}
                      </td>
                      <td>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTransaction(tx);
                            setTransactionDetailOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredTransactions.length === 0 && (
              <div className="text-center py-12">
                <ArrowRightLeft className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  {hasActiveFilters ? 'No transactions match your filters.' : 'No transactions found.'}
                </p>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Transfer Forms */}
        <TabsContent value="transfer" className="space-y-6">
          <Card className="glass-card p-6">
            <Tabs defaultValue="balance-to-branch" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="balance-to-branch" className="flex items-center gap-2">
                  <ArrowDownRight className="h-4 w-4" />
                  Balance to Branch
                </TabsTrigger>
                <TabsTrigger value="branch-to-balance" className="flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4" />
                  Branch to Balance
                </TabsTrigger>
                <TabsTrigger value="branch-to-branch" className="flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4" />
                  Branch to Branch
                </TabsTrigger>
              </TabsList>

              {/* Balance to Branch */}
              <TabsContent value="balance-to-branch" className="space-y-4">
                <div className="text-center py-4">
                  <h3 className="text-lg font-semibold mb-2">Transfer from Main Balance to Branch</h3>
                  <p className="text-muted-foreground">Send gold from main balance to a specific branch</p>
                </div>

                <form onSubmit={handleBalanceToBranch} className="space-y-4 max-w-md mx-auto">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount ({t('common.gr')})</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={balanceToBranchForm.amount}
                      onChange={(e) => setBalanceToBranchForm(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="Enter amount"
                      disabled={balanceToBranchForm.isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="branch">Select Branch</Label>
                    <Select
                      value={balanceToBranchForm.branchId}
                      onValueChange={(value) => setBalanceToBranchForm(prev => ({ ...prev, branchId: value }))}
                      disabled={balanceToBranchForm.isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id.toString()}>
                            {branch.name} - {formatNumber(branch.balance || 0)} {t('common.gr')}
                          </SelectItem>
                        ))}
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
                        onChange={(e) => handleImageSelect(e, 'balanceToBranch')}
                        className="hidden"
                        id="balance-to-branch-image"
                      />
                      <Label
                        htmlFor="balance-to-branch-image"
                        className="flex items-center gap-2 px-4 py-2 border border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <Upload className="h-4 w-4" />
                        {balanceToBranchImage ? balanceToBranchImage.name : 'Choose image'}
                      </Label>
                      {balanceToBranchImage && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => clearImage('balanceToBranch')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {balanceToBranchImagePreview && (
                      <div className="mt-2">
                        <img
                          src={balanceToBranchImagePreview}
                          alt="Preview"
                          className="w-full max-w-xs h-32 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full gold-gradient gold-glow"
                    disabled={balanceToBranchForm.isSubmitting}
                  >
                    {balanceToBranchForm.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Transfer to Branch'
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Branch to Balance */}
              <TabsContent value="branch-to-balance" className="space-y-4">
                <div className="text-center py-4">
                  <h3 className="text-lg font-semibold mb-2">Transfer from Branch to Main Balance</h3>
                  <p className="text-muted-foreground">Send gold from a branch back to main balance</p>
                </div>

                <form onSubmit={handleBranchToBalance} className="space-y-4 max-w-md mx-auto">
                  <div className="space-y-2">
                    <Label htmlFor="branch-amount">Amount ({t('common.gr')})</Label>
                    <Input
                      id="branch-amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={branchToBalanceForm.amount}
                      onChange={(e) => setBranchToBalanceForm(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="Enter amount"
                      disabled={branchToBalanceForm.isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="from-branch">Select Branch</Label>
                    <Select
                      value={branchToBalanceForm.branchId}
                      onValueChange={(value) => setBranchToBalanceForm(prev => ({ ...prev, branchId: value }))}
                      disabled={branchToBalanceForm.isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id.toString()}>
                            {branch.name} - {formatNumber(branch.balance || 0)} {t('common.gr')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ugar-amount">Ugar Amount ({t('common.gr')})</Label>
                    <Input
                      id="ugar-amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={branchToBalanceForm.ugarAmount}
                      onChange={(e) => setBranchToBalanceForm(prev => ({ ...prev, ugarAmount: e.target.value }))}
                      placeholder="Enter ugar amount"
                      disabled={branchToBalanceForm.isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason</Label>
                    <Textarea
                      id="reason"
                      value={branchToBalanceForm.reason}
                      onChange={(e) => setBranchToBalanceForm(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="Enter reason for ugar"
                      disabled={branchToBalanceForm.isSubmitting}
                    />
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-2">
                    <Label>Attach Image (Optional)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageSelect(e, 'branchToBalance')}
                        className="hidden"
                        id="branch-to-balance-image"
                      />
                      <Label
                        htmlFor="branch-to-balance-image"
                        className="flex items-center gap-2 px-4 py-2 border border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <Upload className="h-4 w-4" />
                        {branchToBalanceImage ? branchToBalanceImage.name : 'Choose image'}
                      </Label>
                      {branchToBalanceImage && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => clearImage('branchToBalance')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {branchToBalanceImagePreview && (
                      <div className="mt-2">
                        <img
                          src={branchToBalanceImagePreview}
                          alt="Preview"
                          className="w-full max-w-xs h-32 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full gold-gradient gold-glow"
                    disabled={branchToBalanceForm.isSubmitting}
                  >
                    {branchToBalanceForm.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Transfer to Balance'
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Branch to Branch */}
              <TabsContent value="branch-to-branch" className="space-y-4">
                <div className="text-center py-4">
                  <h3 className="text-lg font-semibold mb-2">Transfer Between Branches</h3>
                  <p className="text-muted-foreground">Send gold directly from one branch to another</p>
                </div>

                <form onSubmit={handleBranchToBranch} className="space-y-4 max-w-md mx-auto">
                  <div className="space-y-2">
                    <Label htmlFor="transfer-amount">Amount ({t('common.gr')})</Label>
                    <Input
                      id="transfer-amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={branchToBranchForm.amount}
                      onChange={(e) => setBranchToBranchForm(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="Enter amount"
                      disabled={branchToBranchForm.isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="from-branch-select">From Branch</Label>
                    <Select
                      value={branchToBranchForm.fromBranchId}
                      onValueChange={(value) => setBranchToBranchForm(prev => ({ ...prev, fromBranchId: value }))}
                      disabled={branchToBranchForm.isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose source branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id.toString()}>
                            {branch.name} - {formatNumber(branch.balance || 0)} {t('common.gr')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="to-branch-select">To Branch</Label>
                    <Select
                      value={branchToBranchForm.toBranchId}
                      onValueChange={(value) => setBranchToBranchForm(prev => ({ ...prev, toBranchId: value }))}
                      disabled={branchToBranchForm.isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose destination branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id.toString()}>
                            {branch.name} - {formatNumber(branch.balance || 0)} {t('common.gr')}
                          </SelectItem>
                        ))}
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
                        onChange={(e) => handleImageSelect(e, 'branchToBranch')}
                        className="hidden"
                        id="branch-to-branch-image"
                      />
                      <Label
                        htmlFor="branch-to-branch-image"
                        className="flex items-center gap-2 px-4 py-2 border border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <Upload className="h-4 w-4" />
                        {branchToBranchImage ? branchToBranchImage.name : 'Choose image'}
                      </Label>
                      {branchToBranchImage && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => clearImage('branchToBranch')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {branchToBranchImagePreview && (
                      <div className="mt-2">
                        <img
                          src={branchToBranchImagePreview}
                          alt="Preview"
                          className="w-full max-w-xs h-32 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full gold-gradient gold-glow"
                    disabled={branchToBranchForm.isSubmitting}
                  >
                    {branchToBranchForm.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Transfer Between Branches'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Branches Overview */}
      <Card className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4">Current Branch Balances</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map((branch) => (
            <div key={branch.id} className="glass-card p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{branch.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatNumber(branch.balance || 0)} {t('common.gr')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Transaction Detail Modal */}
      <Dialog open={transactionDetailOpen} onOpenChange={setTransactionDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-3">
                {getTypeIcon(selectedTransaction.type)}
                <div>
                  <h3 className="font-semibold">{getTypeBadge(selectedTransaction.type)}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(selectedTransaction.date, 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-y">
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className={cn(
                    'font-semibold text-lg',
                    selectedTransaction.type === 'INCOME' || selectedTransaction.type === 'BALANCE_TO_BRANCH'
                      ? 'text-success' : 'text-destructive'
                  )}>
                    {selectedTransaction.type === 'INCOME' || selectedTransaction.type === 'BALANCE_TO_BRANCH' ? '+' : '-'}
                    {formatNumber(selectedTransaction.amount)} {t('common.gr')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">
                    {selectedTransaction.status ? getStatusBadge(selectedTransaction.status) : (
                      <span className="status-completed">Completed</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Details</p>
                <p className="text-sm">
                  {selectedTransaction.type === 'BRANCH_TO_BRANCH'
                    ? `Transfer from ${selectedTransaction.from} to ${selectedTransaction.to}`
                    : selectedTransaction.type === 'BALANCE_TO_BRANCH'
                      ? `Transfer from Main Balance to ${selectedTransaction.branch}`
                      : selectedTransaction.type === 'BRANCH_TO_BALANCE'
                        ? `Transfer from ${selectedTransaction.branch} to Main Balance`
                        : selectedTransaction.type === 'UGAR_LOSS'
                          ? `Ugar loss from ${selectedTransaction.branch}: ${selectedTransaction.reason}`
                          : selectedTransaction.source || 'Balance operation'}
                </p>
              </div>

              {getImageUrl(selectedTransaction.image) && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Attached Image</p>
                  <div className="border rounded-lg overflow-hidden">
                    <img
                      src={getImageUrl(selectedTransaction.image)}
                      alt="Transaction image"
                      className="max-w-sm max-h-64 w-auto h-auto object-contain mx-auto"
                      onError={(e) => {
                        console.error('Image failed to load:', e.currentTarget.src);
                        console.error('Original image name:', selectedTransaction.image);
                        // Hide image if it fails to load
                        e.currentTarget.style.display = 'none';
                        // Show error message
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'flex items-center justify-center h-48 text-muted-foreground';
                        errorDiv.innerHTML = `<span>Image failed to load: ${e.currentTarget.src}</span>`;
                        e.currentTarget.parentNode?.appendChild(errorDiv);
                      }}
                    />
                  </div>
                </div>
              )}

              {!getImageUrl(selectedTransaction.image) && (
                <div className="text-center py-8 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No image attached to this transaction</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
