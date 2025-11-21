import React, { useEffect, useState } from 'react';
import {
  Users, Trophy, Coins, TrendingUp, Clock, DollarSign,
  ArrowUpRight, ArrowDownRight, Activity, Target
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend as ChartLegend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import StatCard from '../components/StatCard';
import { dashboardAPI, transactionAPI } from '../services/api';
import { DashboardStats } from '../types';

// Register Chart.js components
ChartJS.register(ArcElement, ChartTooltip, ChartLegend);

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashboardRes, trendsRes] = await Promise.all([
        dashboardAPI.getStats(),
        transactionAPI.getTrends(30)
      ]);

      setStats(dashboardRes.data.dashboard);
      setTrends(trendsRes.data.trends);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const prepareCategoryDoughnutData = () => {
    if (!trends || !trends.categoryBreakdown) return null;

    const labels = trends.categoryBreakdown.map((item: any) =>
      item._id.replace(/_/g, ' ').toUpperCase()
    );
    const data = trends.categoryBreakdown.map((item: any) => item.total);

    return {
      labels: labels,
      datasets: [{
        label: 'Transaction Amount',
        data: data,
        backgroundColor: COLORS,
        borderWidth: 0,
      }],
    };
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#888888',
          padding: 12,
          font: { size: 12 },
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(30, 30, 30, 0.95)',
        titleColor: '#FFFFFF',
        bodyColor: '#888888',
        borderColor: 'rgba(0, 191, 255, 0.3)',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function (context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            return `${label}: ${value.toLocaleString()} AX`;
          }
        }
      },
    },
    cutout: '70%',
  };

  const COLORS = ['#00BFFF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#121212' }}>
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2" style={{ borderColor: '#00BFFF' }}></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#121212' }}>
        <p className="text-gray-400 text-lg">Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ background: '#121212' }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats.overview.totalUsers}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Active Users"
          value={stats.overview.activeUsers}
          icon={Users}
          color="green"
        />
        <StatCard
          title="Total Tournaments"
          value={stats.overview.totalTournaments}
          icon={Trophy}
          color="purple"
        />
        <StatCard
          title="Live Tournaments"
          value={stats.overview.liveTournaments}
          icon={Clock}
          color="orange"
        />
        <StatCard
          title="Pending Approval"
          value={stats.overview.pendingTournaments}
          icon={Clock}
          color="red"
        />
        <StatCard
          title="Coins in Circulation"
          value={stats.overview.totalCoinsInCirculation.toLocaleString()}
          icon={Coins}
          color="blue"
        />
        <StatCard
          title="Total Revenue (PKR)"
          value={`₨${stats.overview.totalRevenuePKR.toLocaleString()}`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Total Transactions"
          value={stats.overview.totalTransactions || 0}
          icon={Activity}
          color="purple"
        />
      </div>

      {/* Transaction Trends - Same as Wallet */}
      {trends && (
        <div className="mb-8">
          <div
            className="rounded-xl p-6"
            style={{
              background: 'rgba(30, 30, 30, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Transaction Trends (30 Days)</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: '#10B981' }}></div>
                  <span className="text-gray-400 text-sm">Credit</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: '#EF4444' }}></div>
                  <span className="text-gray-400 text-sm">Debit</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={trends.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis
                  dataKey="_id"
                  stroke="#888888"
                  style={{ fontSize: '12px' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#888888" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(30, 30, 30, 0.95)',
                    border: '1px solid rgba(0, 191, 255, 0.3)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#FFFFFF' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="credit"
                  stroke="#10B981"
                  strokeWidth={3}
                  name="Credit"
                  dot={{ fill: '#10B981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="debit"
                  stroke="#EF4444"
                  strokeWidth={3}
                  name="Debit"
                  dot={{ fill: '#EF4444', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Category Breakdown Doughnut Chart */}
        {trends && (
          <div
            className="rounded-xl p-6"
            style={{
              background: 'rgba(30, 30, 30, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
            }}
          >
            <h3 className="text-xl font-bold text-white mb-6">Transaction Categories</h3>
            <div className="flex items-center justify-center" style={{ height: '300px' }}>
              {prepareCategoryDoughnutData() && <Doughnut data={prepareCategoryDoughnutData()!} options={doughnutOptions} />}
            </div>
          </div>
        )}

        {/* Coin Purchases Bar Chart */}
        <div
          className="rounded-xl p-6"
          style={{
            background: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
          }}
        >
          <h3 className="text-xl font-bold text-white mb-6">Daily Coin Purchases</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.charts.coinPurchasesTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis
                dataKey="_id"
                stroke="#888888"
                style={{ fontSize: '12px' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#888888" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(30, 30, 30, 0.95)',
                  border: '1px solid rgba(0, 191, 255, 0.3)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#FFFFFF' }}
              />
              <Bar dataKey="totalCoins" fill="#00BFFF" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Top Coin Holders */}
        <div
          className="rounded-xl p-6"
          style={{
            background: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
          }}
        >
          <h3 className="text-xl font-bold text-white mb-6">Top Coin Holders</h3>
          <div className="space-y-4">
            {stats.topCoinHolders.slice(0, 5).map((holder, index) => (
              <div
                key={holder._id}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ background: 'rgba(0, 191, 255, 0.05)' }}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white"
                    style={{ background: COLORS[index % COLORS.length] }}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{holder.username}</p>
                    <p className="text-gray-400 text-xs">{holder.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold">{holder.coinBalance.toLocaleString()}</p>
                  <p className="text-gray-400 text-xs">AX Coins</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div
          className="rounded-xl p-6"
          style={{
            background: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
          }}
        >
          <h3 className="text-xl font-bold text-white mb-6">Recent Transactions</h3>
          <div className="space-y-4">
            {stats.recentTransactions.slice(0, 5).map((transaction) => (
              <div
                key={transaction._id}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ background: 'rgba(255, 255, 255, 0.02)' }}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{
                      background: transaction.transactionType === 'credit'
                        ? 'rgba(16, 185, 129, 0.2)'
                        : 'rgba(239, 68, 68, 0.2)'
                    }}
                  >
                    {transaction.transactionType === 'credit' ? (
                      <ArrowDownRight size={16} style={{ color: '#10B981' }} />
                    ) : (
                      <ArrowUpRight size={16} style={{ color: '#EF4444' }} />
                    )}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{transaction.userId.username}</p>
                    <p className="text-gray-400 text-xs">{transaction.category.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className="font-bold"
                    style={{
                      color: transaction.transactionType === 'credit' ? '#10B981' : '#EF4444'
                    }}
                  >
                    {transaction.transactionType === 'credit' ? '+' : '-'}{transaction.amount}
                  </p>
                  <p className="text-gray-400 text-xs">AX</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Growth Stats */}
        <div
          className="rounded-xl p-6"
          style={{
            background: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
          }}
        >
          <h3 className="text-xl font-bold text-white mb-6">User Growth (30 Days)</h3>
          <div className="space-y-4">
            {stats.charts.userGrowth.map((item, index) => (
              <div
                key={item._id}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ background: 'rgba(139, 92, 246, 0.05)' }}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: COLORS[index % COLORS.length] }}
                  >
                    <Users size={16} className="text-white" />
                  </div>
                  <p className="text-white font-semibold">{item._id}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold">{item.count}</p>
                  <p className="text-gray-400 text-xs">Users</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div
        className="rounded-xl p-6"
        style={{
          background: 'rgba(30, 30, 30, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <h3 className="text-xl font-bold text-white mb-6">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="/users"
            className="p-4 rounded-lg text-center transition-all hover:scale-105"
            style={{
              background: 'rgba(0, 191, 255, 0.1)',
              border: '1px solid rgba(0, 191, 255, 0.3)'
            }}
          >
            <Users size={32} className="mx-auto mb-2" style={{ color: '#00BFFF' }} />
            <p className="text-white font-semibold">Manage Users</p>
          </a>

          <a
            href="/tournaments"
            className="p-4 rounded-lg text-center transition-all hover:scale-105"
            style={{
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.3)'
            }}
          >
            <Trophy size={32} className="mx-auto mb-2" style={{ color: '#8B5CF6' }} />
            <p className="text-white font-semibold">Tournaments</p>
          </a>

          <a
            href="/wallet"
            className="p-4 rounded-lg text-center transition-all hover:scale-105"
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}
          >
            <Coins size={32} className="mx-auto mb-2" style={{ color: '#10B981' }} />
            <p className="text-white font-semibold">Wallet</p>
          </a>

          <a
            href="/settings"
            className="p-4 rounded-lg text-center transition-all hover:scale-105"
            style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)'
            }}
          >
            <Target size={32} className="mx-auto mb-2" style={{ color: '#F59E0B' }} />
            <p className="text-white font-semibold">Settings</p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;