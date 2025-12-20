import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { managerApi } from '@/lib/api';
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
import { Users, Plus, Trash2, Loader2, UserCircle, Shield } from 'lucide-react';

export default function Managers() {
  const { t } = useTranslation();
  const { isSuperAdmin } = useAuth();
  
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    first_name: '',
    second_name: '',
    third_name: '',
    username: '',
    password: '',
    deleteUsername: '',
  });

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
          deleteUsername: '',
        });
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create manager');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteManager = async () => {
    if (!formData.deleteUsername.trim()) {
      toast.error('Please enter the username');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await managerApi.delete(formData.deleteUsername);
      
      if (response.success) {
        toast.success(response.message);
        setDeleteDialogOpen(false);
        setFormData({ ...formData, deleteUsername: '' });
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete manager');
    } finally {
      setIsSubmitting(false);
    }
  };

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

          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                {t('managers.deleteManager')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('managers.deleteManager')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  Enter the username of the manager you want to delete.
                </p>
                <div className="space-y-2">
                  <Label>{t('managers.username')}</Label>
                  <Input
                    value={formData.deleteUsername}
                    onChange={(e) => setFormData({ ...formData, deleteUsername: e.target.value })}
                    placeholder="Manager username"
                  />
                </div>
                <Button
                  onClick={handleDeleteManager}
                  variant="destructive"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('common.delete')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

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
                You need to know their username to delete them.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Requires exact username</li>
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
