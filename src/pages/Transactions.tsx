import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { branchesApi, Branch } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  ArrowRightLeft,
  Search,
  Filter,
  Calendar as CalendarIcon,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  Loader2,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Mock transaction data since the API doesn't have a dedicated transactions endpoint
interface Transaction {
  id: number;
  type: 'income' | 'outcome' | 'branch_in' | 'branch_out' | 'branch_transfer';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  date: Date;
  description: string;
  branchId?: number;
  branchName?: string;
  fromBranch?: string;
  toBranch?: string;
}

export default function Transactions() {
  const { t } = useTranslation();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  // Generate mock transactions for display
  const [transactions] = useState<Transaction[]>(() => {
    const types: Transaction['type'][] = ['income', 'outcome', 'branch_in', 'branch_out', 'branch_transfer'];
    const statuses: Transaction['status'][] = ['completed', 'pending', 'failed'];
    const mockBranches = ['Turk', 'Dorika', 'Bulgariy', 'Quyish', 'Shtamp', 'Zanjir', '750', 'Afinash'];
    
    return Array.from({ length: 50 }, (_, i) => {
      const type = types[Math.floor(Math.random() * types.length)];
      const branchIndex = Math.floor(Math.random() * mockBranches.length);
      
      return {
        id: i + 1,
        type,
        amount: Math.floor(Math.random() * 5000) + 100,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        description: type === 'branch_transfer' 
          ? `Transfer between branches`
          : type === 'income' 
            ? 'Gold purchase'
            : type === 'outcome'
              ? 'Gold sale'
              : `Branch ${type === 'branch_in' ? 'received' : 'sent'} gold`,
        branchId: branchIndex + 1,
        branchName: mockBranches[branchIndex],
        fromBranch: type === 'branch_transfer' ? mockBranches[branchIndex] : undefined,
        toBranch: type === 'branch_transfer' ? mockBranches[(branchIndex + 1) % mockBranches.length] : undefined,
      };
    }).sort((a, b) => b.date.getTime() - a.date.getTime());
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const response = await branchesApi.getAll();
      if (response.success) {
        setBranches(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch branches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('all');
    setSelectedType('all');
    setSelectedBranch('all');
    setDateFrom(undefined);
    setDateTo(undefined);
    setMinAmount('');
    setMaxAmount('');
  };

  const hasActiveFilters = 
    searchTerm || 
    selectedStatus !== 'all' || 
    selectedType !== 'all' || 
    selectedBranch !== 'all' ||
    dateFrom ||
    dateTo ||
    minAmount ||
    maxAmount;

  const filteredTransactions = transactions.filter(tx => {
    // Search filter
    if (searchTerm && !tx.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !tx.branchName?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Status filter
    if (selectedStatus !== 'all' && tx.status !== selectedStatus) {
      return false;
    }
    
    // Type filter
    if (selectedType !== 'all' && tx.type !== selectedType) {
      return false;
    }
    
    // Branch filter
    if (selectedBranch !== 'all' && tx.branchName !== selectedBranch) {
      return false;
    }
    
    // Date range filter
    if (dateFrom && tx.date < dateFrom) {
      return false;
    }
    if (dateTo && tx.date > dateTo) {
      return false;
    }
    
    // Amount range filter
    if (minAmount && tx.amount < parseFloat(minAmount)) {
      return false;
    }
    if (maxAmount && tx.amount > parseFloat(maxAmount)) {
      return false;
    }
    
    return true;
  });

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const getTypeIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'income':
        return <ArrowDownRight className="h-4 w-4 text-success" />;
      case 'outcome':
        return <ArrowUpRight className="h-4 w-4 text-destructive" />;
      case 'branch_in':
        return <ArrowDownRight className="h-4 w-4 text-blue-500" />;
      case 'branch_out':
        return <ArrowUpRight className="h-4 w-4 text-orange-500" />;
      case 'branch_transfer':
        return <ArrowRightLeft className="h-4 w-4 text-purple-500" />;
    }
  };

  const getTypeBadge = (type: Transaction['type']) => {
    const styles: Record<string, string> = {
      income: 'bg-success/10 text-success',
      outcome: 'bg-destructive/10 text-destructive',
      branch_in: 'bg-blue-500/10 text-blue-500',
      branch_out: 'bg-orange-500/10 text-orange-500',
      branch_transfer: 'bg-purple-500/10 text-purple-500',
    };
    
    const labels: Record<string, string> = {
      income: 'Income',
      outcome: 'Outcome',
      branch_in: 'Branch In',
      branch_out: 'Branch Out',
      branch_transfer: 'Transfer',
    };
    
    return (
      <span className={cn('px-2 py-1 rounded-full text-xs font-medium', styles[type])}>
        {labels[type]}
      </span>
    );
  };

  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return <span className="status-completed">{t('common.completed')}</span>;
      case 'pending':
        return <span className="status-pending">{t('common.pending')}</span>;
      case 'failed':
        return <span className="status-failed">{t('common.failed')}</span>;
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
          View and filter all transactions across the system
        </p>
      </div>

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
              {t('filters.clearFilters')}
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="space-y-2">
            <Label>{t('common.search')}</Label>
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

          {/* Status */}
          <div className="space-y-2">
            <Label>{t('filters.status')}</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.all')}</SelectItem>
                <SelectItem value="completed">{t('common.completed')}</SelectItem>
                <SelectItem value="pending">{t('common.pending')}</SelectItem>
                <SelectItem value="failed">{t('common.failed')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>{t('filters.type')}</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.all')}</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="outcome">Outcome</SelectItem>
                <SelectItem value="branch_in">Branch In</SelectItem>
                <SelectItem value="branch_out">Branch Out</SelectItem>
                <SelectItem value="branch_transfer">Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Branch */}
          <div className="space-y-2">
            <Label>{t('filters.branch')}</Label>
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.all')}</SelectItem>
                {['Turk', 'Dorika', 'Bulgariy', 'Quyish', 'Shtamp', 'Zanjir', '750', 'Afinash'].map((name) => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date From */}
          <div className="space-y-2">
            <Label>{t('common.from')}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, 'PP') : 'Pick a date'}
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
            <Label>{t('common.to')}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, 'PP') : 'Pick a date'}
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

          {/* Min Amount */}
          <div className="space-y-2">
            <Label>Min Amount ({t('common.gr')})</Label>
            <Input
              type="number"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              placeholder="0"
            />
          </div>

          {/* Max Amount */}
          <div className="space-y-2">
            <Label>Max Amount ({t('common.gr')})</Label>
            <Input
              type="number"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              placeholder="10000"
            />
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
                <th>№</th>
                <th>{t('common.date')}</th>
                <th>{t('common.time')}</th>
                <th>{t('filters.type')}</th>
                <th>{t('filters.branch')}</th>
                <th>{t('common.total')}</th>
                <th>{t('common.status')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx, index) => (
                <motion.tr
                  key={tx.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <td className="font-mono text-muted-foreground">{tx.id}</td>
                  <td>{format(tx.date, 'dd/MM/yyyy')}</td>
                  <td>{format(tx.date, 'HH:mm')}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(tx.type)}
                      {getTypeBadge(tx.type)}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {tx.type === 'branch_transfer' 
                        ? `${tx.fromBranch} → ${tx.toBranch}`
                        : tx.branchName || '-'}
                    </div>
                  </td>
                  <td className={cn(
                    'font-semibold font-mono',
                    tx.type === 'income' || tx.type === 'branch_in' ? 'text-success' : 'text-destructive'
                  )}>
                    {tx.type === 'income' || tx.type === 'branch_in' ? '+' : '-'}
                    {formatNumber(tx.amount)} {t('common.gr')}
                  </td>
                  <td>{getStatusBadge(tx.status)}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <ArrowRightLeft className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">{t('common.noResults')}</p>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
