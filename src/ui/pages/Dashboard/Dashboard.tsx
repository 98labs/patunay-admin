import { PageHeader, Cards } from "@components";

const Dashboard = () => {
  return (
    <div className="bg-base-100 dark:bg-base-100 text-base-content dark:text-base-content">
      <PageHeader name="Dashboard" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Cards 
          variant="primary"
          title="Total Artworks" 
          message="View and manage all registered artworks in your collection" 
        />
        <Cards 
          variant="secondary"
          title="NFC Tags" 
          message="Monitor NFC tag assignments and status" 
        />
        <Cards 
          variant="accent"
          title="Recent Activity" 
          message="Track recent changes and updates to your artworks" 
        />
      </div>
    </div>
  );
};

export default Dashboard;
