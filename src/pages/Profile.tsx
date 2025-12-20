import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { superAdminApi, SuperAdmin } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  UserCircle,
  Edit,
  Key,
  User,
  Loader2,
  Shield,
  Save,
} from 'lucide-react';

export default function Profile() {
  const { t } = useTranslation();
  const { isSuperAdmin } = useAuth();
  const [profile, setProfile] = useState<SuperAdmin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'username'>('profile');

  const [profileData, setProfileData] = useState({
    first_name: '',
    second_name: '',
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [usernameData, setUsernameData] = useState({
    oldUsername: '',
    newUsername: '',
  });

  useEffect(() => {
    if (isSuperAdmin) {
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, [isSuperAdmin]);

  const fetchProfile = async () => {
    try {
      const response = await superAdminApi.getProfile();
      if (response.success) {
        setProfile(response.data);
        setProfileData({
          first_name: response.data.first_name || '',
          second_name: response.data.second_name || '',
        });
        setUsernameData({
          oldUsername: response.data.username || '',
          newUsername: '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      toast.error(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!profileData.first_name || !profileData.second_name) {
      toast.error('Please fill all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await superAdminApi.updateProfile(
        profileData.first_name,
        profileData.second_name
      );
      if (response.success) {
        toast.success(response.message);
        fetchProfile();
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!passwordData.oldPassword || !passwordData.newPassword) {
      toast.error('Please fill all password fields');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await superAdminApi.updatePassword(
        passwordData.oldPassword,
        passwordData.newPassword
      );
      if (response.success) {
        toast.success(response.message);
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUsername = async () => {
    if (!usernameData.oldUsername || !usernameData.newUsername) {
      toast.error('Please fill all username fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await superAdminApi.updateUsername(
        usernameData.oldUsername,
        usernameData.newUsername
      );
      if (response.success) {
        toast.success(response.message);
        fetchProfile();
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update username');
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: t('profile.updateProfile'), icon: Edit },
    { id: 'password', label: t('profile.changePassword'), icon: Key },
    { id: 'username', label: t('profile.changeUsername'), icon: User },
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">{t('profile.title')}</h1>
        <p className="text-muted-foreground">
          Manage your profile settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <Card className="glass-card p-8 lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <motion.div 
              className="w-32 h-32 rounded-full gold-gradient flex items-center justify-center mb-6 gold-glow"
              animate={{ 
                boxShadow: [
                  '0 0 20px hsl(38 92% 50% / 0.3)',
                  '0 0 40px hsl(38 92% 50% / 0.5)',
                  '0 0 20px hsl(38 92% 50% / 0.3)',
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <UserCircle className="h-16 w-16 text-primary-foreground" />
            </motion.div>
            
            <h2 className="text-2xl font-bold mb-1">
              {profile?.first_name} {profile?.second_name}
            </h2>
            <p className="text-muted-foreground mb-4">@{profile?.username}</p>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Super Admin</span>
            </div>
          </div>
        </Card>

        {/* Settings Card */}
        <Card className="glass-card p-8 lg:col-span-2">
          {/* Tabs */}
          <div className="flex gap-2 mb-8 border-b border-border pb-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'ghost'}
                  className={activeTab === tab.id ? 'gold-gradient' : ''}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </Button>
              );
            })}
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>{t('profile.firstName')}</Label>
                  <Input
                    value={profileData.first_name}
                    onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                    placeholder="First name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('profile.secondName')}</Label>
                  <Input
                    value={profileData.second_name}
                    onChange={(e) => setProfileData({ ...profileData, second_name: e.target.value })}
                    placeholder="Last name"
                  />
                </div>
              </div>
              <Button
                onClick={handleUpdateProfile}
                className="gold-gradient gold-glow"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                {t('common.save')}
              </Button>
            </motion.div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <Label>{t('profile.oldPassword')}</Label>
                <Input
                  type="password"
                  value={passwordData.oldPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                  placeholder="Current password"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>{t('profile.newPassword')}</Label>
                  <Input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="New password"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Confirm Password</Label>
                  <Input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              <Button
                onClick={handleUpdatePassword}
                className="gold-gradient gold-glow"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Key className="mr-2 h-4 w-4" />
                {t('profile.changePassword')}
              </Button>
            </motion.div>
          )}

          {/* Username Tab */}
          {activeTab === 'username' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>{t('profile.oldUsername')}</Label>
                  <Input
                    value={usernameData.oldUsername}
                    onChange={(e) => setUsernameData({ ...usernameData, oldUsername: e.target.value })}
                    placeholder="Current username"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('profile.newUsername')}</Label>
                  <Input
                    value={usernameData.newUsername}
                    onChange={(e) => setUsernameData({ ...usernameData, newUsername: e.target.value })}
                    placeholder="New username"
                  />
                </div>
              </div>
              <Button
                onClick={handleUpdateUsername}
                className="gold-gradient gold-glow"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <User className="mr-2 h-4 w-4" />
                {t('profile.changeUsername')}
              </Button>
            </motion.div>
          )}
        </Card>
      </div>
    </motion.div>
  );
}
