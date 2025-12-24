import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { managerApi, Manager } from '@/lib/api';
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
import { Users, Plus, Trash2, Loader2, UserCircle, Shield, Search, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function Managers() {
  const { t } = useTranslation();
  const { isSuperAdmin } = useAuth();
  
  const [managers, setManagers] = useState<Manager[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    first_name: '',
    second_name: '',
    third_name: '',
    username: '',
    password: '',
  });

  useEffect(() => {
    if (isSuperAdmin) {
      fetchManagers();
    }
  }, [isSuperAdmin]);

  const fetchManagers = async () => {
    try {
      const response = await managerApi.getAll();
      if (response.success) {
        setManagers(response.data || []);
      } else {
        console.error('Failed to fetch managers:', response.message);
        toast.error(response.message || 'Failed to load managers');
      }
    } catch (error: any) {
      console.error('Failed to fetch managers:', error);
      toast.error(error.response?.data?.message || 'Failed to load managers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddManager = async () => {
    const { first_name, second_name, third_name, username, password } = formData;
    
    if (!first_name || !second_name || !username || !password) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await managerApi.create({
        first_name,
        second_name,
        third_name,
        username,
        password,
      });
      
      if (response.success) {
        toast.success(response.message);
        setAddDialogOpen(false);
        setFormData({
          first_name: '',
          second_name: '',
          third_name: '',
          username: '',
          password: '',
        });
        fetchManagers(); // Refresh the list
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create manager');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteManager = async (username: string) => {
    try {
      const response = await managerApi.delete(username);
      
      if (response.success) {
        toast.success(response.message);
        fetchManagers(); // Refresh the list
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete manager');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      return null;
    }
  };

  const filteredManagers = managers.filter(manager =>
    manager.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    manager.second_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    manager.third_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    manager.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Shield className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
        <p className="text-muted-foreground">Only Super Admins can access this page.</p>
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
          <h1 className="text-3xl font-bold mb-2">{t('managers.title')}</h1>
          <p className="text-muted-foreground">
            Create and manage system managers
          </p>
        </div>
        <div className="flex gap-3">
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gold-gradient gold-glow">
                <Plus className="mr-2 h-4 w-4" />
                {t('managers.addManager')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t('managers.addManager')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('managers.firstName')} *</Label>
                    <Input
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      placeholder="First name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('managers.secondName')} *</Label>
                    <Input
                      value={formData.second_name}
                      onChange={(e) => setFormData({ ...formData, second_name: e.target.value })}
                      placeholder="Last name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t('managers.thirdName')}</Label>
                  <Input
                    value={formData.third_name}
                    onChange={(e) => setFormData({ ...formData, third_name: e.target.value })}
                    placeholder="Middle name (optional)"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('managers.username')} *</Label>
                  <Input
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Username for login"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('managers.password')} *</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Password"
                  />
                </div>
                <Button
                  onClick={handleAddManager}
                  className="w-full gold-gradient"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('common.add')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search managers..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Managers List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">All Managers ({filteredManagers.length})</h3>
          </div>
          
          {filteredManagers.length === 0 ? (
            <Card className="glass-card p-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No managers found matching your search.' : 'No managers created yet.'}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredManagers.map((manager, index) => (
                <motion.div
                  key={manager.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="glass-card p-6 hover:shadow-lg transition-all">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <UserCircle className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">
                          {manager.first_name} {manager.second_name}
                          {manager.third_name && ` ${manager.third_name}`}
                        </h4>
                        <p className="text-sm text-muted-foreground truncate">
                          @{manager.username}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Role: {manager.role}
                        </p>
                        {manager.createdAt && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(manager.createdAt)}
                          </p>
                        )}
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Manager</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete manager "{manager.first_name} {manager.second_name}" (@{manager.username})? 
                              This action cannot be undone and they will lose all access immediately.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteManager(manager.username)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Delete Manager
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-card p-8">
          <div className="flex items-start gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600">
              <Plus className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Create Manager</h3>
              <p className="text-muted-foreground mb-4">
                Add new managers to help manage branches and transactions. 
                Managers have limited access compared to Super Admins.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• View balance and branches</li>
                <li>• Perform branch transactions</li>
                <li>• Transfer between branches</li>
                <li>• Cannot create/delete branches</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-8">
          <div className="flex items-start gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600">
              <Trash2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Remove Manager</h3>
              <p className="text-muted-foreground mb-4">
                Remove managers who no longer need access to the system.
                Click the delete button on any manager card above.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Instant confirmation dialog</li>
                <li>• Action cannot be undone</li>
                <li>• All access is revoked immediately</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      {/* Manager role info */}
      <Card className="glass-card p-8">
        <div className="flex flex-col lg:flex-row items-start gap-8">
          <div className="flex-shrink-0">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Users className="h-12 w-12 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-4">Manager Role Permissions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-success mb-2">✓ Can Do</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-success" />
                    View main balance
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-success" />
                    View all branches
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-success" />
                    Transfer from balance to branch
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-success" />
                    Transfer from branch to balance
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-success" />
                    Transfer between branches
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-destructive mb-2">✗ Cannot Do</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                    Create/delete branches
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                    Add income/outcome to balance
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                    Manage other managers
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                    Create super admins
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                    Access super admin profile
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
