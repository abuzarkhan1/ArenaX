import React, { useEffect, useState } from 'react';
import { Download, Users, Trophy, DollarSign, TrendingUp, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend as ChartLegend } from 'chart.js';
import { Pie, Doughnut } from 'react-chartjs-2';
import { reportsAPI } from '../services/api';

// Register Chart.js components
ChartJS.register(ArcElement, ChartTooltip, ChartLegend);

const Reports: React.FC = () => {
  const [reports, setReports] = useState<any>(null);
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [period]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await reportsAPI.getComprehensive(period);
      setReports(response.data.reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type: string) => {
    try {
      setExportLoading(true);
      const response = await reportsAPI.exportReport(type, period);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}_report_${period}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report');
    } finally {
      setExportLoading(false);
    }
  };

  const chartOptions = {
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
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#121212' }}>
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2" style={{ borderColor: '#00BFFF' }}></div>
      </div>
    );
  }

  if (!reports) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#121212' }}>
        <p className="text-gray-400 text-lg">Failed to load reports</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ background: '#121212' }}>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Reports & Analytics</h1>
          <p className="text-gray-400">Comprehensive platform insights and data export</p>
        </div>
        
        {/* Export Dropdown */}
        <div className="relative group">
          <button 
            disabled={exportLoading}
            className="px-6 py-3 rounded-lg font-semibold text-white transition-all flex items-center space-x-2 hover:scale-105"
            style={{
              background: 'rgba(0, 191, 255, 0.2)',
              border: '1px solid rgba(0, 191, 255, 0.5)',
              color: '#00BFFF'
            }}
          >
            <Download size={20} />
            <span>{exportLoading ? 'Exporting...' : 'Export Report'}</span>
          </button>
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10"
            style={{
              background: 'rgba(30, 30, 30, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div className="py-2">
              <button onClick={() => handleExport('users')} className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-800 transition-colors">
                Export Users Report
              </button>
              <button onClick={() => handleExport('tournaments')} className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-800 transition-colors">
                Export Tournaments Report
              </button>
              <button onClick={() => handleExport('transactions')} className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-800 transition-colors">
                Export Transactions Report
              </button>
              <button onClick={() => handleExport('deposits')} className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-800 transition-colors">
                Export Deposits Report
              </button>
              <button onClick={() => handleExport('withdrawals')} className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-800 transition-colors">
                Export Withdrawals Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex space-x-4 mb-8">
        {['day', 'week', 'month', 'year'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className="px-6 py-3 rounded-lg font-medium transition-all capitalize"
            style={
              period === p
                ? {
                    background: 'rgba(0, 191, 255, 0.2)',
                    border: '1px solid rgba(0, 191, 255, 0.5)',
                    color: '#00BFFF'
                  }
                : {
                    background: 'rgba(30, 30, 30, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#888888'
                  }
            }
          >
            {p}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-8 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'users', label: 'User Analytics', icon: Users },
          { id: 'tournaments', label: 'Tournaments', icon: Trophy },
          { id: 'financial', label: 'Financial', icon: DollarSign },
          { id: 'deposits', label: 'Deposits & Withdrawals', icon: ArrowDownCircle },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-6 py-3 rounded-lg font-medium transition-all flex items-center space-x-2 whitespace-nowrap"
            style={
              activeTab === tab.id
                ? {
                    background: 'rgba(0, 191, 255, 0.2)',
                    border: '1px solid rgba(0, 191, 255, 0.5)',
                    color: '#00BFFF'
                  }
                : {
                    background: 'rgba(30, 30, 30, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#888888'
                  }
            }
          >
            <tab.icon size={18} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab reports={reports} chartOptions={chartOptions} />}
      {activeTab === 'users' && <UserAnalyticsTab reports={reports} chartOptions={chartOptions} />}
      {activeTab === 'tournaments' && <TournamentsTab reports={reports} chartOptions={chartOptions} />}
      {activeTab === 'financial' && <FinancialTab reports={reports} chartOptions={chartOptions} />}
      {activeTab === 'deposits' && <DepositsWithdrawalsTab reports={reports} chartOptions={chartOptions} />}
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{ reports: any; chartOptions: any }> = ({ reports, chartOptions }) => {
  const { userAnalytics, tournamentPerformance, financialOverview, revenueBreakdown } = reports;

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={userAnalytics.totalUsers} icon={Users} color="blue" />
        <StatCard title="Active Users" value={userAnalytics.activeUsers} icon={Users} color="green" />
        <StatCard title="Total Tournaments" value={tournamentPerformance.totalTournaments} icon={Trophy} color="purple" />
        <StatCard title="Net Profit (PKR)" value={`₨${financialOverview.netProfit.toLocaleString()}`} icon={DollarSign} color="green" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <ChartCard title="Revenue Breakdown">
          <div style={{ height: '300px' }}>
            <Doughnut
              data={{
                labels: ['Tournament Entries', 'Deposits'],
                datasets: [{
                  data: [revenueBreakdown.tournamentEntryRevenue, revenueBreakdown.depositRevenue],
                  backgroundColor: ['#00BFFF', '#10B981'],
                  borderWidth: 0,
                }]
              }}
              options={chartOptions}
            />
          </div>
        </ChartCard>

        {/* User Growth */}
        <ChartCard title="User Growth Trend">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userAnalytics.userGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="_id" stroke="#888888" style={{ fontSize: '12px' }} />
              <YAxis stroke="#888888" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(30, 30, 30, 0.95)',
                  border: '1px solid rgba(0, 191, 255, 0.3)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#FFFFFF' }}
              />
              <Line type="monotone" dataKey="count" stroke="#00BFFF" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};

// User Analytics Tab
const UserAnalyticsTab: React.FC<{ reports: any; chartOptions: any }> = ({ reports, chartOptions }) => {
  const { userAnalytics } = reports;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={userAnalytics.totalUsers} icon={Users} color="blue" />
        <StatCard title="Active Users" value={userAnalytics.activeUsers} icon={Users} color="green" />
        <StatCard title="Suspended Users" value={userAnalytics.suspendedUsers} icon={Users} color="orange" />
        <StatCard title="Banned Users" value={userAnalytics.bannedUsers} icon={Users} color="red" />
      </div>

      {/* Engagement Rate */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard title="User Engagement Rate">
          <div className="flex items-center justify-center" style={{ height: '300px' }}>
            <div className="text-center">
              <p className="text-6xl font-bold text-cyan-400">{userAnalytics.engagementRate}%</p>
              <p className="text-gray-400 mt-4">Users who joined tournaments</p>
            </div>
          </div>
        </ChartCard>

        {/* User Growth */}
        <ChartCard title="User Growth Over Time">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={userAnalytics.userGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="_id" stroke="#888888" style={{ fontSize: '12px' }} />
              <YAxis stroke="#888888" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(30, 30, 30, 0.95)',
                  border: '1px solid rgba(0, 191, 255, 0.3)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#FFFFFF' }}
              />
              <Bar dataKey="count" fill="#00BFFF" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Top Users Table */}
      <ChartCard title="Top 10 Users by Coin Balance">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Rank</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Username</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Coin Balance</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Total Earned</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Total Spent</th>
              </tr>
            </thead>
            <tbody>
              {userAnalytics.topUsersByCoins.map((user: any, index: number) => (
                <tr key={user._id} className="border-b border-gray-800 hover:bg-gray-900 transition-colors">
                  <td className="py-3 px-4 text-white font-bold">#{index + 1}</td>
                  <td className="py-3 px-4 text-white">{user.username}</td>
                  <td className="py-3 px-4 text-right text-cyan-400 font-semibold">{user.coinBalance.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-green-400">{user.totalCoinsEarned.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-red-400">{user.totalCoinsSpent.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
};

// Tournaments Tab
const TournamentsTab: React.FC<{ reports: any; chartOptions: any }> = ({ reports, chartOptions }) => {
  const { tournamentPerformance } = reports;

  const statusData = {
    labels: tournamentPerformance.tournamentsByStatus.map((s: any) => s._id),
    datasets: [{
      data: tournamentPerformance.tournamentsByStatus.map((s: any) => s.count),
      backgroundColor: ['#00BFFF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'],
      borderWidth: 0,
    }]
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Tournaments" value={tournamentPerformance.totalTournaments} icon={Trophy} color="blue" />
        <StatCard title="Completed" value={tournamentPerformance.completedTournaments} icon={Trophy} color="green" />
        <StatCard title="Completion Rate" value={`${tournamentPerformance.completionRate}%`} icon={TrendingUp} color="purple" />
        <StatCard title="Avg Participants" value={Math.round(tournamentPerformance.avgParticipants)} icon={Users} color="orange" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <ChartCard title="Tournaments by Status">
          <div style={{ height: '300px' }}>
            <Pie data={statusData} options={chartOptions} />
          </div>
        </ChartCard>

        {/* Game Type Distribution */}
        <ChartCard title="Tournaments by Game Type">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tournamentPerformance.tournamentsByGameType}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="_id" stroke="#888888" style={{ fontSize: '12px' }} />
              <YAxis stroke="#888888" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(30, 30, 30, 0.95)',
                  border: '1px solid rgba(0, 191, 255, 0.3)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#FFFFFF' }}
              />
              <Bar dataKey="count" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Tournament Trend */}
      <ChartCard title="Tournament Creation Trend">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={tournamentPerformance.tournamentTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis dataKey="_id" stroke="#888888" style={{ fontSize: '12px' }} />
            <YAxis stroke="#888888" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(30, 30, 30, 0.95)',
                border: '1px solid rgba(0, 191, 255, 0.3)',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#FFFFFF' }}
            />
            <Line type="monotone" dataKey="count" stroke="#8B5CF6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
};

// Financial Tab
const FinancialTab: React.FC<{ reports: any; chartOptions: any }> = ({ reports, chartOptions }) => {
  const { financialOverview, revenueBreakdown } = reports;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue (PKR)" value={`₨${financialOverview.totalRevenue.toLocaleString()}`} icon={DollarSign} color="green" />
        <StatCard title="Total Payouts (PKR)" value={`₨${financialOverview.totalPayouts.toLocaleString()}`} icon={DollarSign} color="red" />
        <StatCard title="Net Profit (PKR)" value={`₨${financialOverview.netProfit.toLocaleString()}`} icon={TrendingUp} color="blue" />
        <StatCard title="Profit Margin" value={`${revenueBreakdown.profitMargin}%`} icon={TrendingUp} color="purple" />
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Revenue Sources">
          <div style={{ height: '300px' }}>
            <Doughnut
              data={{
                labels: ['Tournament Entries', 'Deposits'],
                datasets: [{
                  data: [revenueBreakdown.tournamentEntryRevenue, revenueBreakdown.depositRevenue],
                  backgroundColor: ['#00BFFF', '#10B981'],
                  borderWidth: 0,
                }]
              }}
              options={chartOptions}
            />
          </div>
        </ChartCard>

        <ChartCard title="Transaction Categories">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={financialOverview.transactionsByCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="_id" stroke="#888888" style={{ fontSize: '10px' }} angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#888888" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(30, 30, 30, 0.95)',
                  border: '1px solid rgba(0, 191, 255, 0.3)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#FFFFFF' }}
              />
              <Bar dataKey="total" fill="#10B981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};

// Deposits & Withdrawals Tab
const DepositsWithdrawalsTab: React.FC<{ reports: any; chartOptions: any }> = ({ reports, chartOptions }) => {
  const { depositWithdrawalAnalytics } = reports;

  const depositStatusData = {
    labels: depositWithdrawalAnalytics.deposits.byStatus.map((s: any) => s._id),
    datasets: [{
      data: depositWithdrawalAnalytics.deposits.byStatus.map((s: any) => s.count),
      backgroundColor: ['#F59E0B', '#10B981', '#EF4444', '#00BFFF'],
      borderWidth: 0,
    }]
  };

  const withdrawalStatusData = {
    labels: depositWithdrawalAnalytics.withdrawals.byStatus.map((s: any) => s._id),
    datasets: [{
      data: depositWithdrawalAnalytics.withdrawals.byStatus.map((s: any) => s.count),
      backgroundColor: ['#F59E0B', '#10B981', '#EF4444', '#00BFFF'],
      borderWidth: 0,
    }]
  };

  const formatProcessingTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    return `${hours}h`;
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Avg Deposit Processing" 
          value={formatProcessingTime(depositWithdrawalAnalytics.deposits.avgProcessingTime)} 
          icon={ArrowDownCircle} 
          color="green" 
        />
        <StatCard 
          title="Avg Withdrawal Processing" 
          value={formatProcessingTime(depositWithdrawalAnalytics.withdrawals.avgProcessingTime)} 
          icon={ArrowUpCircle} 
          color="red" 
        />
        <StatCard 
          title="Total Deposits" 
          value={depositWithdrawalAnalytics.deposits.byStatus.reduce((sum: number, s: any) => sum + s.count, 0)} 
          icon={ArrowDownCircle} 
          color="blue" 
        />
        <StatCard 
          title="Total Withdrawals" 
          value={depositWithdrawalAnalytics.withdrawals.byStatus.reduce((sum: number, s: any) => sum + s.count, 0)} 
          icon={ArrowUpCircle} 
          color="purple" 
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deposit Status */}
        <ChartCard title="Deposits by Status">
          <div style={{ height: '300px' }}>
            <Pie data={depositStatusData} options={chartOptions} />
          </div>
        </ChartCard>

        {/* Withdrawal Status */}
        <ChartCard title="Withdrawals by Status">
          <div style={{ height: '300px' }}>
            <Pie data={withdrawalStatusData} options={chartOptions} />
          </div>
        </ChartCard>
      </div>

      {/* Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Deposits by Payment Method">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={depositWithdrawalAnalytics.deposits.byPaymentMethod}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="_id" stroke="#888888" style={{ fontSize: '12px' }} />
              <YAxis stroke="#888888" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(30, 30, 30, 0.95)',
                  border: '1px solid rgba(0, 191, 255, 0.3)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#FFFFFF' }}
              />
              <Bar dataKey="totalAmount" fill="#10B981" radius={[8, 8, 0, 0]} name="Amount" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Withdrawals by Payment Method">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={depositWithdrawalAnalytics.withdrawals.byPaymentMethod}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="_id" stroke="#888888" style={{ fontSize: '12px' }} />
              <YAxis stroke="#888888" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(30, 30, 30, 0.95)',
                  border: '1px solid rgba(0, 191, 255, 0.3)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#FFFFFF' }}
              />
              <Bar dataKey="totalAmount" fill="#EF4444" radius={[8, 8, 0, 0]} name="Amount" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};

// Helper Components
const StatCard: React.FC<{ title: string; value: string | number; icon: any; color: string }> = ({ title, value, icon: Icon, color }) => {
  const colors: any = {
    blue: '#00BFFF',
    green: '#10B981',
    purple: '#8B5CF6',
    orange: '#F59E0B',
    red: '#EF4444',
  };

  return (
    <div
      className="rounded-xl p-6"
      style={{
        background: 'rgba(30, 30, 30, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-gray-400 text-sm">{title}</p>
        <Icon size={20} style={{ color: colors[color] }} />
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
};

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  return (
    <div
      className="rounded-xl p-6"
      style={{
        background: 'rgba(30, 30, 30, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
      }}
    >
      <h3 className="text-xl font-bold text-white mb-6">{title}</h3>
      {children}
    </div>
  );
};

export default Reports;