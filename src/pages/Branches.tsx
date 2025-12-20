import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { branchesApi, balanceApi, Branch } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  ArrowRightLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  Loader2,
  Search,
  Filter,
  Folder,
} from 'lucide-react';

// Branch colors for visual distinction
const branchColors = [
  'from-blue-500 to-cyan-500',
  'from-orange-500 to-amber-500',
  'from-yellow-500 to-lime-500',
  'from-red-500 to-pink-500',
  'from-purple-500 to-violet-500',
  'from-emerald-500 to-teal-500',
  'from-indigo-500 to-blue-500',
  'from-rose-500 to-red-500',
];

export default function Branches() {
  const { t } = useTranslation();
  const { isSuperAdmin } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'balance'>('name');

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [toBalanceDialogOpen, setToBalanceDialogOpen] = useState(false);
  const [toBranchDialogOpen, setToBranchDialogOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    ugarAmount: '',
    reason: '',
    fromBranchId: '',
    toBranchId: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      toast.error(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      amount: '',
      ugarAmount: '',
      reason: '',
      fromBranchId: '',
      toBranchId: '',
    });
  };

  const handleAddBranch = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a branch name');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await branchesApi.create(formData.name, formData.description);
      if (response.success) {
        toast.success(response.message);
        setAddDialogOpen(false);
        resetForm();
        fetchBranches();
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create branch');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditBranch = async () => {
    if (!selectedBranch || !formData.name.trim()) {
      toast.error('Please enter a branch name');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await branchesApi.update(
        selectedBranch.name,
        formData.name,
        formData.description
      );
      if (response.success) {
        toast.success(response.message);
        setEditDialogOpen(false);
        resetForm();
        setSelectedBranch(null);
        fetchBranches();
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update branch');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBranch = async (branch: Branch) => {
    try {
      const response = await branchesApi.delete(branch.id, branch.name);
      if (response.success) {
        toast.success(response.message);
        fetchBranches();
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete branch');
    }
  };

  const handleTransferToBranch = async () => {
    if (!selectedBranch || !formData.amount) {
      toast.error('Please enter an amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await branchesApi.balanceToBranch(
        parseFloat(formData.amount),
        selectedBranch.id
      );
      if (response.success) {
        toast.success('Transfer successful');
        setTransferDialogOpen(false);
        resetForm();
        setSelectedBranch(null);
        fetchBranches();
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Transfer failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransferToBalance = async () => {
    if (!selectedBranch || !formData.amount) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await branchesApi.branchToBalance(
        parseFloat(formData.amount),
        selectedBranch.id,
        parseFloat(formData.ugarAmount) || 0,
        formData.reason
      );
      if (response.success) {
        toast.success('Transfer successful');
        setToBalanceDialogOpen(false);
        resetForm();
        setSelectedBranch(null);
        fetchBranches();
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Transfer failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBranchToBranch = async () => {
    if (!formData.fromBranchId || !formData.toBranchId || !formData.amount) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await branchesApi.branchToBranch(
        parseFloat(formData.amount),
        parseInt(formData.fromBranchId),
        parseInt(formData.toBranchId)
      );
      if (response.success) {
        toast.success(response.message);
        setToBranchDialogOpen(false);
        resetForm();
        fetchBranches();
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Transfer failed');
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

  const filteredBranches = branches
    .filter(branch => 
      branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return (b.balance || 0) - (a.balance || 0);
    });

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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('branches.title')}</h1>
          <p className="text-muted-foreground">
            Manage branches, transfer gold between them
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {isSuperAdmin && (
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gold-gradient gold-glow">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('branches.addBranch')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('branches.addBranch')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>{t('branches.branchName')}</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter branch name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('branches.description')}</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter description"
                    />
                  </div>
                  <Button
                    onClick={handleAddBranch}
                    className="w-full gold-gradient"
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('common.add')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          <Dialog open={toBranchDialogOpen} onOpenChange={setToBranchDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Branch to Branch
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Transfer Between Branches</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>From Branch</Label>
                  <Select
                    value={formData.fromBranchId}
                    onValueChange={(val) => setFormData({ ...formData, fromBranchId: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id.toString()}>
                          {branch.name} ({formatNumber(branch.balance || 0)} gr)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>To Branch</Label>
                  <Select
                    value={formData.toBranchId}
                    onValueChange={(val) => setFormData({ ...formData, toBranchId: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches
                        .filter((b) => b.id.toString() !== formData.fromBranchId)
                        .map((branch) => (
                          <SelectItem key={branch.id} value={branch.id.toString()}>
                            {branch.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('branches.amount')} ({t('common.gr')})</Label>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <Button
                  onClick={handleBranchToBranch}
                  className="w-full gold-gradient"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Transfer
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search branches..."
            className="pl-10"
          />
        </div>
        <Select value={sortBy} onValueChange={(val: 'name' | 'balance') => setSortBy(val)}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Sort by Name</SelectItem>
            <SelectItem value="balance">Sort by Balance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence>
          {filteredBranches.map((branch, index) => (
            <motion.div
              key={branch.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="glass-card p-5 hover:shadow-xl transition-all group">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${branchColors[index % branchColors.length]} flex items-center justify-center shadow-lg`}>
                    <Folder className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{branch.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {branch.description || 'No description'}
                    </p>
                    <p className="text-lg font-bold mt-2">
                      {formatNumber(branch.balance || 0)} <span className="text-sm text-muted-foreground">{t('common.gr')}</span>
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-border/50">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setSelectedBranch(branch);
                      setTransferDialogOpen(true);
                    }}
                  >
                    <ArrowDownToLine className="h-3 w-3 mr-1" />
                    Receive
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setSelectedBranch(branch);
                      setToBalanceDialogOpen(true);
                    }}
                  >
                    <ArrowUpFromLine className="h-3 w-3 mr-1" />
                    Give
                  </Button>
                  {isSuperAdmin && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedBranch(branch);
                          setFormData({ ...formData, name: branch.name, description: branch.description || '' });
                          setEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Branch</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{branch.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteBranch(branch)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              {t('common.delete')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredBranches.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">{t('common.noResults')}</p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('branches.editBranch')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>{t('branches.branchName')}</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('branches.description')}</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <Button onClick={handleEditBranch} className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer to Branch Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer to {selectedBranch?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Transfer gold from main balance to this branch.
            </p>
            <div className="space-y-2">
              <Label>{t('branches.amount')} ({t('common.gr')})</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <Button onClick={handleTransferToBranch} className="w-full gold-gradient" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Transfer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer to Balance Dialog */}
      <Dialog open={toBalanceDialogOpen} onOpenChange={setToBalanceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer from {selectedBranch?.name} to Balance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Transfer gold from this branch back to main balance.
            </p>
            <div className="space-y-2">
              <Label>{t('branches.amount')} ({t('common.gr')})</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('branches.ugarAmount')} ({t('common.gr')})</Label>
              <Input
                type="number"
                value={formData.ugarAmount}
                onChange={(e) => setFormData({ ...formData, ugarAmount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('branches.reason')}</Label>
              <Textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Reason for ugar..."
              />
            </div>
            <Button onClick={handleTransferToBalance} className="w-full gold-gradient" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Transfer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
