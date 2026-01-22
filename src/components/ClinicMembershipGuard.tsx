import { useClinic } from '@/contexts/ClinicContext';
import { useEffect, useState } from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';

/**
 * Component that protects clinic routes.
 * Checks if the user is a member of the clinic being accessed.
 * If not, redirects to the dashboard.
 */
export const ClinicMembershipGuard: React.FC = () => {
  const { clinicId } = useParams<{ clinicId: string }>();
  const { clinics, isLoading } = useClinic();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Wait until clinics are loaded
    if (!isLoading) {
      setIsChecking(false);
    }
  }, [isLoading]);

  // Show loading while checking
  if (isLoading || isChecking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // Check if the user is a member of this clinic
  const isMember = clinics.some(clinic => clinic.id === clinicId);

  if (!isMember) {
    console.warn(`[ClinicMembershipGuard] User is not a member of clinic ${clinicId}`);
    return <Navigate to="/dashboard" replace />;
  }

  // User is a member, render the children routes
  return <Outlet />;
};
