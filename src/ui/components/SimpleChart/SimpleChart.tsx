import { useMemo } from 'react';

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface SimpleChartProps {
  data: ChartData[];
  type: 'bar' | 'line' | 'donut';
  title?: string;
  height?: number;
  className?: string;
}

const SimpleChart: React.FC<SimpleChartProps> = ({
  data,
  type,
  title,
  height = 200,
  className = '',
}) => {
  const maxValue = useMemo(() => Math.max(...data.map(d => d.value), 1), [data]);
  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);

  const defaultColors = [
    'hsl(var(--p))', // primary
    'hsl(var(--s))', // secondary
    'hsl(var(--a))', // accent
    'hsl(var(--su))', // success
    'hsl(var(--w))', // warning
    'hsl(var(--e))', // error
    'hsl(var(--in))', // info
  ];

  const getColor = (index: number, customColor?: string) => {
    return customColor || defaultColors[index % defaultColors.length];
  };

  const renderBarChart = () => (
    <div className="flex items-end justify-between h-full px-4 pb-4">
      {data.map((item, index) => {
        const heightPercent = (item.value / maxValue) * 100;
        return (
          <div key={item.label} className="flex flex-col items-center flex-1 mx-1">
            <div className="flex flex-col items-center justify-end flex-1 w-full">
              <div className="text-xs font-medium mb-1 text-base-content/80">
                {item.value}
              </div>
              <div
                className="w-full rounded-t transition-all duration-300 hover:opacity-80"
                style={{
                  height: `${heightPercent}%`,
                  backgroundColor: getColor(index, item.color),
                  minHeight: '4px',
                }}
              />
            </div>
            <div className="text-xs text-base-content/60 mt-2 text-center leading-tight">
              {item.label}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderLineChart = () => {
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - (item.value / maxValue) * 80; // 80% of height for data, 20% for padding
      return { x, y, ...item };
    });

    const pathD = points.reduce((path, point, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${path} ${command} ${point.x} ${point.y}`;
    }, '');

    return (
      <div className="relative h-full">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Grid lines */}
          {[20, 40, 60, 80].map(y => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="100"
              y2={y}
              stroke="hsl(var(--bc) / 0.1)"
              strokeWidth="0.5"
            />
          ))}
          
          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke={getColor(0)}
            strokeWidth="2"
            className="transition-all duration-300"
          />
          
          {/* Points */}
          {points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="2"
              fill={getColor(0)}
              className="transition-all duration-300 hover:r-3"
            />
          ))}
        </svg>
        
        {/* Labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
          {data.map((item, index) => (
            <div key={index} className="text-xs text-base-content/60 text-center">
              {item.label}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDonutChart = () => {
    const center = 50;
    const radius = 35;
    const strokeWidth = 8;
    
    let cumulativePercentage = 0;
    
    return (
      <div className="flex items-center justify-center h-full">
        <div className="relative">
          <svg viewBox="0 0 100 100" className="w-32 h-32 transform -rotate-90">
            {/* Background circle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="hsl(var(--bc) / 0.1)"
              strokeWidth={strokeWidth}
            />
            
            {/* Data segments */}
            {data.map((item, index) => {
              const percentage = total > 0 ? (item.value / total) * 100 : 0;
              const strokeDasharray = `${percentage * 2.2} ${220}`;
              const strokeDashoffset = -(cumulativePercentage * 2.2);
              
              cumulativePercentage += percentage;
              
              return (
                <circle
                  key={index}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={getColor(index, item.color)}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-300 hover:stroke-8"
                />
              );
            })}
          </svg>
          
          {/* Center value */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-bold text-base-content">{total}</div>
              <div className="text-xs text-base-content/60">Total</div>
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="ml-6 space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getColor(index, item.color) }}
              />
              <div className="text-sm">
                <span className="font-medium">{item.label}</span>
                <span className="text-base-content/60 ml-1">({item.value})</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-base-100 border border-base-300 rounded-lg shadow-sm ${className}`}>
      {title && (
        <div className="p-4 border-b border-base-300">
          <h3 className="text-lg font-semibold text-base-content">{title}</h3>
        </div>
      )}
      <div style={{ height }} className="p-2">
        {type === 'bar' && renderBarChart()}
        {type === 'line' && renderLineChart()}
        {type === 'donut' && renderDonutChart()}
      </div>
    </div>
  );
};

export default SimpleChart;