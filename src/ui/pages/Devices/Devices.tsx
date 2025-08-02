import { PageHeader, Loading } from "@components";
import { useAuthV2 as useAuth } from '../../hooks/useAuthV2';

const Devices = () => {
  const { isAdmin, isLoading: isAuthLoading } = useAuth();

  // TEMPORARILY DISABLED - Auth check
  /*
  if (isAuthLoading) {
    return <Loading fullScreen={false} />;
  }

  // Check admin access
  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4">
        <PageHeader name="Devices" />
        <div className="alert alert-error">
          <div>
            <h3 className="font-bold">No access</h3>
            <div className="text-sm mt-2">
              Please check with your administrator.
            </div>
          </div>
        </div>
      </div>
    );
  }
  */

  return (
    <div className="container mx-auto px-4">
      <PageHeader name="Devices" />
      <div className="mt-6">
        <p className="text-base-content/70">Device management coming soon...</p>
      </div>
    </div>
  );
};

export default Devices;
