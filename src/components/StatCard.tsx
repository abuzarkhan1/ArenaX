import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

const colorClasses = {
  blue: {
    gradient: 'linear-gradient(135deg, #00E5FF 0%, #0095FF 100%)',
    glow: 'rgba(0, 229, 255, 0.4)',
    border: 'rgba(0, 229, 255, 0.3)',
    bg: 'rgba(0, 229, 255, 0.05)'
  },
  green: {
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    glow: 'rgba(16, 185, 129, 0.4)',
    border: 'rgba(16, 185, 129, 0.3)',
    bg: 'rgba(16, 185, 129, 0.05)'
  },
  purple: {
    gradient: 'linear-gradient(135deg, #8A2BE2 0%, #6B21A8 100%)',
    glow: 'rgba(138, 43, 226, 0.4)',
    border: 'rgba(138, 43, 226, 0.3)',
    bg: 'rgba(138, 43, 226, 0.05)'
  },
  orange: {
    gradient: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
    glow: 'rgba(249, 115, 22, 0.4)',
    border: 'rgba(249, 115, 22, 0.3)',
    bg: 'rgba(249, 115, 22, 0.05)'
  },
  red: {
    gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    glow: 'rgba(239, 68, 68, 0.4)',
    border: 'rgba(239, 68, 68, 0.3)',
    bg: 'rgba(239, 68, 68, 0.05)'
  },
};

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, color }) => {
  const colors = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="rounded-xl overflow-hidden relative group"
      style={{
        background: 'rgba(30, 30, 30, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
      }}
    >
      <div className="relative p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-gray-400 text-sm font-medium mb-3">{title}</p>
            <p className="text-4xl font-black text-white mb-2 tracking-tight">{value}</p>
            {trend && (
              <div className="flex items-center space-x-1">
                <span className={`text-sm font-bold ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                </span>
                <span className="text-xs text-gray-400">vs last period</span>
              </div>
            )}
          </div>

          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
            className="w-16 h-16 rounded-xl flex items-center justify-center"
            style={{
              background: colors.gradient,
              boxShadow: `0 4px 12px ${colors.glow}`
            }}
          >
            <Icon className="text-white" size={32} strokeWidth={2.5} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;