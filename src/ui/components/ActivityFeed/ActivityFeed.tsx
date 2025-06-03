import { format, formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  details?: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  className?: string;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, className = '' }) => {
  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return 'text-success';
      case 'update':
      case 'edit':
        return 'text-warning';
      case 'delete':
        return 'text-error';
      case 'read':
      case 'view':
        return 'text-info';
      default:
        return 'text-base-content';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return '✨';
      case 'update':
      case 'edit':
        return '✏️';
      case 'delete':
        return '🗑️';
      case 'read':
      case 'view':
        return '👁️';
      default:
        return '📝';
    }
  };

  return (
    <div className={`bg-base-100 border border-base-300 rounded-lg shadow-sm ${className}`}>
      <div className="p-4 border-b border-base-300">
        <h3 className="text-lg font-semibold text-base-content">Recent Activity</h3>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="p-6 text-center text-base-content/60">
            No recent activity to display
          </div>
        ) : (
          <div className="divide-y divide-base-300">
            {activities.map((activity) => (
              <div key={activity.id} className="p-4 hover:bg-base-200/50 transition-colors">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 text-lg">
                    {getActionIcon(activity.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${getActionColor(activity.action)}`}>
                        {activity.action}
                      </span>
                      <span className="text-sm text-base-content/60">
                        {activity.resource}
                      </span>
                    </div>
                    <p className="text-sm text-base-content/80 mt-1">
                      {activity.details || `${activity.action} operation on ${activity.resource}`}
                    </p>
                    <div className="flex items-center space-x-2 mt-2 text-xs text-base-content/60">
                      <span>{activity.user}</span>
                      <span>•</span>
                      <span title={format(new Date(activity.timestamp), 'PPpp')}>
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;