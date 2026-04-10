import { useAuth } from '@/context/AuthContext';

export const usePermissions = () => {
  const { user } = useAuth();
  const role = user?.role || 'guest';

  return {
    canViewDashboard: true, // everyone can view dashboard
    canUploadDocuments: ['startup', 'mentor', 'employee', 'admin'].includes(role),
    canManageAllDocuments: role === 'admin',
    canApproveDocuments: role === 'admin',
    canExportData: role === 'admin',
    canManageUsers: role === 'admin',
    isStartup: role === 'startup' || role === 'employee',
    isMentor: role === 'mentor',
    isGuest: role === 'guest',
    isEmployee: role === 'employee' || role === 'startup',
    isAdmin: role === 'admin'
  };
};
