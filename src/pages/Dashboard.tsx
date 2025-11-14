import React, { useEffect, useState } from 'react';
import { Users, Trophy, Coins, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend as ChartLegend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import StatCard from '../components/StatCard';
import { dashboardAPI } from '../services/api';
import { DashboardStats } from '../types';

// Register Chart.js components
ChartJS.register(ArcElement, ChartTooltip, ChartLegend);

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await dashboardAPI.getStats();
      setStats(response.data.dashboard);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const prepareDoughnutData = () => {
    if (!stats || !stats.charts.userGrowth) return null;

    const labels = stats.charts.userGrowth.map(item => item._id);
    const data = stats.charts.userGrowth.map(item => item.count);
    const colors = ['#00BFFF', '#00FF7F', '#8A2BE2', '#FFD700', '#FF6B6B'];

    return {
      labels: labels,
      datasets: [{
        label: 'Users',
        data: data,
        backgroundColor: colors,
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
      },
    },
    cutout: '70%',
  };

  const prepareTopCoinHoldersData = () => {
    if (!stats || !stats.topCoinHolders) return null;

    const labels = stats.topCoinHolders.map(holder => holder.username);
    const data = stats.topCoinHolders.map(holder => holder.coinBalance);
    const colors = ['#00BFFF', '#00FF7F', '#8A2BE2', '#FFD700', '#FF6B6B'];

    return {
      labels: labels,
      datasets: [{
        label: 'Coin Balance',
        data: data,
        backgroundColor: colors,
        borderWidth: 0,
      }],
    };
  };

  const prepareRecentTransactionsData = () => {
    if (!stats || !stats.recentTransactions) return null;

    const transactions = stats.recentTransactions.slice(0, 5);
    const labels = transactions.map(t => t.userId.username);
    const data = transactions.map(t => Math.abs(t.amount));
    const colors = transactions.map(t => 
      t.transactionType === 'credit' ? '#00FF7F' : '#EF4444'
    );

    return {
      labels: labels,
      datasets: [{
        label: 'Amount',
        data: data,
        backgroundColor: colors,
        borderWidth: 0,
      }],
    };
  };

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
        <p className="text-gray-400">Welcome to ArenaX Admin Panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
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
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User Growth Chart */}
        <div
          className="rounded-xl p-6"
          style={{
            background: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
          }}
        >
          <h3 className="text-xl font-bold text-white mb-6">User Growth (Last 30 Days)</h3>
          <div className="flex items-center justify-center" style={{ height: '300px' }}>
            {prepareDoughnutData() && <Doughnut data={prepareDoughnutData()!} options={doughnutOptions} />}
          </div>
        </div>

        {/* Coin Purchases Chart */}
        <div
          className="rounded-xl p-6"
          style={{
            background: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
          }}
        >
          <h3 className="text-xl font-bold text-white mb-6">Coin Purchases (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.charts.coinPurchasesTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="_id" stroke="#888888" style={{ fontSize: '12px' }} />
              <YAxis stroke="#888888" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(30, 30, 30, 0.95)',
                  border: '1px solid rgba(0, 191, 255, 0.3)',
                  borderRadius: '8px',
                  backdropFilter: 'blur(10px)',
                }}
                labelStyle={{ color: '#FFFFFF' }}
              />
              <Bar dataKey="totalCoins" fill="#00BFFF" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          <div className="flex items-center justify-center" style={{ height: '300px' }}>
            {prepareTopCoinHoldersData() && <Doughnut data={prepareTopCoinHoldersData()!} options={doughnutOptions} />}
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
          <div className="flex items-center justify-center" style={{ height: '300px' }}>
            {prepareRecentTransactionsData() && <Doughnut data={prepareRecentTransactionsData()!} options={doughnutOptions} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;