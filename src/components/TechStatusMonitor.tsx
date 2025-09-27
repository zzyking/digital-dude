import { Activity, Cpu, HardDrive, Wifi, Zap, Monitor } from 'lucide-react';
import type { TechStatusMonitorProps } from '../types';

// 技术状态监控组件
const TechStatusMonitor = ({ stats }: TechStatusMonitorProps) => {
  const getStatusColor = (value: number, thresholds: { good: number, warning: number }) => {
    if (value <= thresholds.good) return 'text-green-400';
    if (value <= thresholds.warning) return 'text-yellow-400';
    return 'text-red-400';
  };

  const formatValue = (value: number) => {
    return typeof value === 'number' ? value.toFixed(0) : value;
  };

  return (
    <div className="card-glass p-6">
      <h3 className="text-xl font-bold text-white mb-6 text-center text-glow flex items-center justify-center gap-2">
        <Activity className="w-5 h-5" />
        系统监控
      </h3>
      
      <div className="grid grid-cols-2 gap-4 font-mono text-sm">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg backdrop-blur-sm border border-white/10 hover:border-white/20 transition-colors">
            <div className="flex items-center gap-2 text-white/80">
              <Monitor className="w-4 h-4" />
              <span>FPS</span>
            </div>
            <span className={`font-bold ${getStatusColor(stats.fps, { good: 50, warning: 30 })}`}>
              {formatValue(stats.fps)}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg backdrop-blur-sm border border-white/10 hover:border-white/20 transition-colors">
            <div className="flex items-center gap-2 text-white/80">
              <Zap className="w-4 h-4" />
              <span>延迟</span>
            </div>
            <span className={`font-bold ${getStatusColor(stats.latency, { good: 50, warning: 100 })}`}>
              {formatValue(stats.latency)}ms
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg backdrop-blur-sm border border-white/10 hover:border-white/20 transition-colors">
            <div className="flex items-center gap-2 text-white/80">
              <Cpu className="w-4 h-4" />
              <span>CPU</span>
            </div>
            <span className={`font-bold ${getStatusColor(stats.cpu, { good: 50, warning: 80 })}`}>
              {formatValue(stats.cpu)}%
            </span>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg backdrop-blur-sm border border-white/10 hover:border-white/20 transition-colors">
            <div className="flex items-center gap-2 text-white/80">
              <HardDrive className="w-4 h-4" />
              <span>内存</span>
            </div>
            <span className={`font-bold ${getStatusColor(stats.memory, { good: 200, warning: 500 })}`}>
              {formatValue(stats.memory)}MB
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg backdrop-blur-sm border border-white/10 hover:border-white/20 transition-colors">
            <div className="flex items-center gap-2 text-white/80">
              <Wifi className="w-4 h-4" />
              <span>网络</span>
            </div>
            <span className="text-green-400 font-bold">
              {stats.network}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg backdrop-blur-sm border border-white/10 hover:border-white/20 transition-colors">
            <div className="flex items-center gap-2 text-white/80">
              <Monitor className="w-4 h-4" />
              <span>WebGL</span>
            </div>
            <span className={`font-bold ${stats.webgl ? 'text-green-400' : 'text-red-400'}`}>
              {stats.webgl ? '✓ 已启用' : '✗ 未启用'}
            </span>
          </div>
        </div>
      </div>
      
      {/* 状态指示器 */}
      <div className="mt-4 flex justify-center">
        <div className="flex items-center gap-4 text-xs text-white/60">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full pulse-glow"></div>
            <span>正常</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            <span>警告</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
            <span>异常</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechStatusMonitor;