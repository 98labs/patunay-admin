interface SystemService {
  name: string;
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  lastCheck: string;
}

interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
}

interface SystemHealthProps {
  status: 'healthy' | 'warning' | 'critical';
  services: SystemService[];
  metrics: SystemMetrics;
  className?: string;
}

const SystemHealth: React.FC<SystemHealthProps> = ({
  status,
  services,
  metrics,
  className = '',
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'up':
        return 'text-success';
      case 'warning':
      case 'degraded':
        return 'text-warning';
      case 'critical':
      case 'down':
        return 'text-error';
      default:
        return 'text-base-content';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'up':
        return 'badge-success';
      case 'warning':
      case 'degraded':
        return 'badge-warning';
      case 'critical':
      case 'down':
        return 'badge-error';
      default:
        return 'badge-ghost';
    }
  };

  const getMetricColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'text-error';
    if (value >= thresholds.warning) return 'text-warning';
    return 'text-success';
  };

  return (
    <div className={`bg-base-100 border border-base-300 rounded-lg shadow-sm ${className}`}>
      <div className="p-4 border-b border-base-300">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-base-content">System Health</h3>
          <span className={`badge ${getStatusBadge(status)} badge-sm`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Services Status */}
        <div>
          <h4 className="text-sm font-medium text-base-content/70 mb-3">Services</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {services.map((service) => (
              <div key={service.name} className="flex items-center justify-between p-3 bg-base-200/50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    service.status === 'up' ? 'bg-success' :
                    service.status === 'degraded' ? 'bg-warning' : 'bg-error'
                  }`} />
                  <span className="text-sm font-medium">{service.name}</span>
                </div>
                <div className="text-right">
                  <span className={`text-xs ${getStatusColor(service.status)}`}>
                    {service.status}
                  </span>
                  {service.responseTime && (
                    <div className="text-xs text-base-content/60">
                      {service.responseTime}ms
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Metrics */}
        <div>
          <h4 className="text-sm font-medium text-base-content/70 mb-3">System Metrics</h4>
          <div className="space-y-3">
            {/* CPU Usage */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm">CPU Usage</span>
                <span className={`text-sm font-medium ${getMetricColor(metrics.cpuUsage, { warning: 70, critical: 90 })}`}>
                  {metrics.cpuUsage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-base-300 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    metrics.cpuUsage >= 90 ? 'bg-error' :
                    metrics.cpuUsage >= 70 ? 'bg-warning' : 'bg-success'
                  }`}
                  style={{ width: `${Math.min(metrics.cpuUsage, 100)}%` }}
                />
              </div>
            </div>

            {/* Memory Usage */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm">Memory Usage</span>
                <span className={`text-sm font-medium ${getMetricColor(metrics.memoryUsage, { warning: 80, critical: 95 })}`}>
                  {metrics.memoryUsage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-base-300 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    metrics.memoryUsage >= 95 ? 'bg-error' :
                    metrics.memoryUsage >= 80 ? 'bg-warning' : 'bg-success'
                  }`}
                  style={{ width: `${Math.min(metrics.memoryUsage, 100)}%` }}
                />
              </div>
            </div>

            {/* Disk Usage */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm">Disk Usage</span>
                <span className={`text-sm font-medium ${getMetricColor(metrics.diskUsage, { warning: 85, critical: 95 })}`}>
                  {metrics.diskUsage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-base-300 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    metrics.diskUsage >= 95 ? 'bg-error' :
                    metrics.diskUsage >= 85 ? 'bg-warning' : 'bg-success'
                  }`}
                  style={{ width: `${Math.min(metrics.diskUsage, 100)}%` }}
                />
              </div>
            </div>

            {/* Network Latency */}
            <div className="flex justify-between items-center">
              <span className="text-sm">Network Latency</span>
              <span className={`text-sm font-medium ${getMetricColor(metrics.networkLatency, { warning: 100, critical: 200 })}`}>
                {metrics.networkLatency.toFixed(0)}ms
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;