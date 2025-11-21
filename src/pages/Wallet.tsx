import React, { useEffect, useState } from 'react';
import { 
  Coins, TrendingUp, TrendingDown, Users, ChevronLeft, ChevronRight, 
  ChevronsLeft, ChevronsRight, Download, Filter, X, Search 
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { transactionAPI } from '../services/api';

const Wallet: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [trends, setTrends] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [limit] = useState(10);

  // Filter states
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    transactionType: '',
    category: '',
    userSearch: '',
    minAmount: '',
    maxAmount: '',
    paymentMethod: '',
    status: ''
  });

  useEffect(() => {
    fetchData();
  }, [currentPage, filters]);

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Build query params
      const params: any = { page: currentPage, limit };
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof typeof filters]) {
          params[key] = filters[key as keyof typeof filters];
        }
      });

      const [overviewRes, transactionsRes] = await Promise.all([
        transactionAPI.getWalletOverview(),
        transactionAPI.getAll(params)
      ]);
      
      setOverview(overviewRes.data.overview);
      setTransactions(transactionsRes.data.transactions || []);
      setTotalTransactions(transactionsRes.data.total || 0);
      setTotalPages(transactionsRes.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrends = async () => {
    try {
      const response = await transactionAPI.getTrends(30);
      setTrends(response.data.trends);
    } catch (error) {
      console.error('Error fetching trends:', error);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      
      // Build query params with current filters
      const params: any = {};
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof typeof filters]) {
          params[key] = filters[key as keyof typeof filters];
        }
      });

      const response = await transactionAPI.exportTransactions(params);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transactions_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting transactions:', error);
      alert('Failed to export transactions');
    } finally {
      setExporting(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      transactionType: '',
      category: '',
      userSearch: '',
      minAmount: '',
      maxAmount: '',
      paymentMethod: '',
      status: ''
    });
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      document.getElementById('transactions-table')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return { bg: 'rgba(16, 185, 129, 0.2)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.4)' };
      case 'pending': return { bg: 'rgba(245, 158, 11, 0.2)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.4)' };
      case 'failed': return { bg: 'rgba(239, 68, 68, 0.2)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.4)' };
      case 'reversed': return { bg: 'rgba(156, 163, 175, 0.2)', color: '#9CA3AF', border: '1px solid rgba(156, 163, 175, 0.4)' };
      default: return { bg: 'rgba(16, 185, 129, 0.2)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.4)' };
    }
  };

  const COLORS = ['#00BFFF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div
      className="rounded-xl p-6"
      style={{
        background: 'rgba(30, 30, 30, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-400 font-medium text-sm">{title}</p>
        <div className="p-3 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
          <Icon size={24} style={{ color }} />
        </div>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );

  if (loading && !transactions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#121212' }}>
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2" style={{ borderColor: '#00BFFF' }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ background: '#121212' }}>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Coin Wallet Management</h1>
          <p className="text-gray-400">Monitor coin economy and transactions</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-6 py-3 rounded-lg font-semibold text-white transition-all flex items-center space-x-2 hover:scale-105"
            style={{
              background: showFilters ? 'rgba(0, 191, 255, 0.2)' : 'rgba(139, 92, 246, 0.2)',
              border: showFilters ? '1px solid rgba(0, 191, 255, 0.5)' : '1px solid rgba(139, 92, 246, 0.5)',
              color: showFilters ? '#00BFFF' : '#8B5CF6'
            }}
          >
            <Filter size={20} />
            <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
          </button>
          
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-6 py-3 rounded-lg font-semibold text-white transition-all flex items-center space-x-2 hover:scale-105"
            style={{
              background: '#10B981',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}
          >
            <Download size={20} />
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div
          className="rounded-xl p-6 mb-8"
          style={{
            background: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Filters</h3>
            <button
              onClick={clearFilters}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#EF4444',
                border: '1px solid rgba(239, 68, 68, 0.4)'
              }}
            >
              Clear All
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-4 py-2 rounded-lg text-white"
                style={{
                  background: 'rgba(20, 20, 20, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              />
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm mb-2">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-4 py-2 rounded-lg text-white"
                style={{
                  background: 'rgba(20, 20, 20, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              />
            </div>
            
            {/* Transaction Type */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">Type</label>
              <select
                value={filters.transactionType}
                onChange={(e) => handleFilterChange('transactionType', e.target.value)}
                className="w-full px-4 py-2 rounded-lg text-white"
                style={{
                  background: 'rgba(20, 20, 20, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <option value="">All Types</option>
                <option value="credit">Credit</option>
                <option value="debit">Debit</option>
              </select>
            </div>
            
            {/* Category */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-4 py-2 rounded-lg text-white"
                style={{
                  background: 'rgba(20, 20, 20, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <option value="">All Categories</option>
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdrawal</option>
                <option value="tournament_entry">Tournament Entry</option>
                <option value="tournament_prize">Tournament Prize</option>
                <option value="refund">Refund</option>
                <option value="bonus">Bonus</option>
              </select>
            </div>
            
            {/* User Search */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">Search User</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={filters.userSearch}
                  onChange={(e) => handleFilterChange('userSearch', e.target.value)}
                  placeholder="Username or email"
                  className="w-full pl-10 pr-4 py-2 rounded-lg text-white"
                  style={{
                    background: 'rgba(20, 20, 20, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                />
              </div>
            </div>
            
            {/* Amount Range */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">Min Amount</label>
              <input
                type="number"
                value={filters.minAmount}
                onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                placeholder="0"
                className="w-full px-4 py-2 rounded-lg text-white"
                style={{
                  background: 'rgba(20, 20, 20, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              />
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm mb-2">Max Amount</label>
              <input
                type="number"
                value={filters.maxAmount}
                onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                placeholder="10000"
                className="w-full px-4 py-2 rounded-lg text-white"
                style={{
                  background: 'rgba(20, 20, 20, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              />
            </div>
            
            {/* Status */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-4 py-2 rounded-lg text-white"
                style={{
                  background: 'rgba(20, 20, 20, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <option value="">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="reversed">Reversed</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Distributed"
            value={overview.totalCoinsDistributed.toLocaleString()}
            icon={TrendingUp}
            color="#00FF7F"
          />
          <StatCard
            title="Total Spent"
            value={overview.totalCoinsSpent.toLocaleString()}
            icon={TrendingDown}
            color="#EF4444"
          />
          <StatCard
            title="In Circulation"
            value={overview.totalCoinsInCirculation.toLocaleString()}
            icon={Coins}
            color="#00BFFF"
          />
          <StatCard
            title="Total Users"
            value={overview.totalUsers.toLocaleString()}
            icon={Users}
            color="#8A2BE2"
          />
        </div>
      )}

      {/* Transaction Trends Charts */}
      {trends && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Trends Line Chart */}
          <div
            className="rounded-xl p-6"
            style={{
              background: 'rgba(30, 30, 30, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
            }}
          >
            <h3 className="text-xl font-bold text-white mb-6">Transaction Trends (30 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends.daily}>
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
                <Legend />
                <Line type="monotone" dataKey="credit" stroke="#10B981" strokeWidth={2} name="Credit" />
                <Line type="monotone" dataKey="debit" stroke="#EF4444" strokeWidth={2} name="Debit" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category Breakdown Pie Chart */}
          <div
            className="rounded-xl p-6"
            style={{
              background: 'rgba(30, 30, 30, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
            }}
          >
            <h3 className="text-xl font-bold text-white mb-6">Category Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={trends.categoryBreakdown}
                  dataKey="total"
                  nameKey="_id"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {trends.categoryBreakdown.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(30, 30, 30, 0.95)',
                    border: '1px solid rgba(0, 191, 255, 0.3)',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div
        id="transactions-table"
        className="rounded-xl overflow-hidden"
        style={{
          background: 'rgba(30, 30, 30, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-white">Transactions</h3>
            <div className="text-gray-400 text-sm">
              Showing {transactions.length > 0 ? ((currentPage - 1) * limit + 1) : 0} - {Math.min(currentPage * limit, totalTransactions)} of {totalTransactions}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">User</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">Type</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">Amount</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">Category</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">Status</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">Payment Method</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">Description</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto" style={{ borderColor: '#00BFFF' }}></div>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <p className="text-gray-400 text-lg">No transactions found</p>
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr
                      key={transaction._id}
                      style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}
                    >
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-white font-semibold">{transaction.userId?.username || 'N/A'}</p>
                          <p className="text-gray-400 text-sm">{transaction.userId?.email || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span 
                          className="px-3 py-1 rounded-full text-xs font-bold"
                          style={{
                            background: transaction.transactionType === 'credit' 
                              ? 'rgba(16, 185, 129, 0.2)' 
                              : 'rgba(239, 68, 68, 0.2)',
                            color: transaction.transactionType === 'credit' ? '#10B981' : '#EF4444',
                            border: transaction.transactionType === 'credit' 
                              ? '1px solid rgba(16, 185, 129, 0.4)' 
                              : '1px solid rgba(239, 68, 68, 0.4)'
                          }}
                        >
                          {transaction.transactionType.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <p 
                          className="font-bold text-lg"
                          style={{
                            color: transaction.transactionType === 'credit' ? '#10B981' : '#EF4444'
                          }}
                        >
                          {transaction.transactionType === 'credit' ? '+' : '-'}{transaction.amount.toLocaleString()} AX
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <span 
                          className="px-3 py-1 rounded-lg text-xs font-semibold"
                          style={{
                            background: 'rgba(0, 191, 255, 0.2)',
                            color: '#00BFFF',
                            border: '1px solid rgba(0, 191, 255, 0.4)'
                          }}
                        >
                          {transaction.category.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span 
                          className="px-3 py-1 rounded-lg text-xs font-semibold"
                          style={getStatusColor(transaction.status || 'completed')}
                        >
                          {(transaction.status || 'completed').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-white font-semibold">{transaction.paymentMethod || 'N/A'}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-gray-300">{transaction.description}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-gray-400 text-sm">{new Date(transaction.createdAt).toLocaleDateString()}</p>
                        <p className="text-gray-500 text-xs">{new Date(transaction.createdAt).toLocaleTimeString()}</p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-gray-400 text-sm">
              Page {currentPage} of {totalPages}
            </div>
            
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1 || loading}
                className="p-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: 'rgba(30, 30, 30, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#888888'
                }}
              >
                <ChevronsLeft size={20} />
              </button>

              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="p-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: 'rgba(30, 30, 30, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#888888'
                }}
              >
                <ChevronLeft size={20} />
              </button>

              <div className="flex items-center gap-2">
                {getPageNumbers().map((page, index) => (
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} className="text-gray-400 px-2">...</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page as number)}
                      disabled={loading}
                      className="px-4 py-2 rounded-lg transition-all min-w-[40px]"
                      style={{
                        background: currentPage === page
                          ? 'rgba(0, 191, 255, 0.2)'
                          : 'rgba(30, 30, 30, 0.95)',
                        border: currentPage === page
                          ? '1px solid rgba(0, 191, 255, 0.5)'
                          : '1px solid rgba(255, 255, 255, 0.1)',
                        color: currentPage === page ? '#00BFFF' : '#888888'
                      }}
                    >
                      {page}
                    </button>
                  )
                ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || loading}
                className="p-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: 'rgba(30, 30, 30, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#888888'
                }}
              >
                <ChevronRight size={20} />
              </button>

              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage >= totalPages || loading}
                className="p-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: 'rgba(30, 30, 30, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#888888'
                }}
              >
                <ChevronsRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;