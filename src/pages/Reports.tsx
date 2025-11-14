import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend as ChartLegend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { transactionAPI } from '../services/api';

// Register Chart.js components
ChartJS.register(ArcElement, ChartTooltip, ChartLegend);

const Reports: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    try {
      const response = await transactionAPI.getStats(period);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare pie chart data from daily transactions
  const preparePieData = () => {
    if (!stats || !stats.dailyTransactions) return null;

    const totalCredited = stats.dailyTransactions.reduce((sum: number, item: any) => sum + (item.credited || 0), 0);
    const totalDebited = stats.dailyTransactions.reduce((sum: number, item: any) => sum + (item.debited || 0), 0);

    return {
      labels: ['Credited', 'Debited'],
      datasets: [
        {
          label: 'Transaction Flow',
          data: [totalCredited, totalDebited],
          backgroundColor: [
            'rgba(16, 185, 129, 0.8)',
            'rgba(239, 68, 68, 0.8)',
          ],
          borderColor: [
            'rgba(16, 185, 129, 1)',
            'rgba(239, 68, 68, 1)',
          ],
          borderWidth: 2,
          hoverOffset: 15,
        },
      ],
    };
  };

  const pieOptions = {
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
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value.toLocaleString()} AX Coins (${percentage}%)`;
          }
        }
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#121212' }}>
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2" style={{ borderColor: '#00BFFF' }}></div>
      </div>
    );
  }

  const pieData = preparePieData();

  return (
    <div className="min-h-screen p-6" style={{ background: '#121212' }}>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Reports & Analytics</h1>
          <p className="text-gray-400">Financial reports and platform insights</p>
        </div>
        <button 
          className="px-6 py-3 rounded-lg font-semibold text-white transition-all flex items-center space-x-2"
          style={{
            background: 'rgba(0, 191, 255, 0.2)',
            border: '1px solid rgba(0, 191, 255, 0.5)',
            color: '#00BFFF'
          }}
        >
          <Download size={20} />
          <span>Export Report</span>
        </button>
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

      {stats && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div
              className="rounded-xl overflow-hidden p-6"
              style={{
                background: 'rgba(30, 30, 30, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
              }}
            >
              <p className="text-gray-400 text-sm mb-2">Total Credited</p>
              <p className="text-4xl font-bold text-green-400 mb-1">{stats.totalCredited.toLocaleString()}</p>
              <p className="text-gray-500 text-sm">AX Coins</p>
            </div>

            <div
              className="rounded-xl overflow-hidden p-6"
              style={{
                background: 'rgba(30, 30, 30, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
              }}
            >
              <p className="text-gray-400 text-sm mb-2">Total Debited</p>
              <p className="text-4xl font-bold text-red-400 mb-1">{stats.totalDebited.toLocaleString()}</p>
              <p className="text-gray-500 text-sm">AX Coins</p>
            </div>

            <div
              className="rounded-xl overflow-hidden p-6"
              style={{
                background: 'rgba(30, 30, 30, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
              }}
            >
              <p className="text-gray-400 text-sm mb-2">Net Flow</p>
              <p className={`text-4xl font-bold mb-1 ${stats.netFlow >= 0 ? 'text-cyan-400' : 'text-orange-400'}`}>
                {stats.netFlow.toLocaleString()}
              </p>
              <p className="text-gray-500 text-sm">AX Coins</p>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: 'rgba(30, 30, 30, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
              }}
            >
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-6">Transaction Distribution</h3>
                <div className="flex items-center justify-center" style={{ height: '300px' }}>
                  {pieData && <Pie data={pieData} options={pieOptions} />}
                </div>
              </div>
            </div>

            {/* Bar Chart */}
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: 'rgba(30, 30, 30, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
              }}
            >
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-6">Daily Transaction Flow</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.dailyTransactions}>
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
                    <Legend />
                    <Bar dataKey="credited" fill="#10B981" radius={[8, 8, 0, 0]} name="Credited" />
                    <Bar dataKey="debited" fill="#EF4444" radius={[8, 8, 0, 0]} name="Debited" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;