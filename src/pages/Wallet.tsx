import React, { useEffect, useState } from 'react';
import { Coins, TrendingUp, TrendingDown, Users, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { transactionAPI } from '../services/api';

const Wallet: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [limit] = useState(6); // Items per page
  const [hasNextPage, setHasNextPage] = useState(false);

  useEffect(() => {
    fetchData();
  }, [currentPage]); // Re-fetch when page changes

  const fetchData = async () => {
    try {
      setLoading(true);
      const [overviewRes, transactionsRes] = await Promise.all([
        transactionAPI.getWalletOverview(),
        transactionAPI.getAll({ 
          page: currentPage, 
          limit: limit 
        })
      ]);
      
      setOverview(overviewRes.data.overview);
      
      // Handle different API response structures
      const transactionsData = transactionsRes.data.transactions || transactionsRes.data || [];
      setTransactions(transactionsData);
      
      // Calculate pagination from response or estimate if not provided
      const totalFromAPI = transactionsRes.data.total || transactionsRes.data.totalTransactions;
      const totalPagesFromAPI = transactionsRes.data.totalPages;
      
      // Check if there are more pages
      const hasMore = transactionsData.length === limit;
      setHasNextPage(hasMore);
      
      if (totalFromAPI) {
        setTotalTransactions(totalFromAPI);
        setTotalPages(Math.ceil(totalFromAPI / limit));
      } else if (totalPagesFromAPI) {
        setTotalPages(totalPagesFromAPI);
        setTotalTransactions(totalPagesFromAPI * limit);
      } else {
        // If no pagination metadata, dynamically calculate based on results
        if (hasMore) {
          // There might be more pages
          setTotalPages(currentPage + 1);
        } else {
          // This is the last page
          setTotalPages(currentPage);
        }
        setTotalTransactions((currentPage - 1) * limit + transactionsData.length);
      }
      
      console.log('Pagination Debug:', {
        currentPage,
        limit,
        totalTransactions: totalFromAPI,
        totalPages: totalPagesFromAPI,
        receivedTransactions: transactionsData.length,
        hasNextPage: hasMore,
        calculatedTotalPages: totalPagesFromAPI || (hasMore ? currentPage + 1 : currentPage)
      });
      
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top of transactions table
      document.getElementById('transactions-table')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
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
        <div 
          className="p-3 rounded-lg"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
          }}
        >
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
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Coin Wallet Management</h1>
        <p className="text-gray-400">Monitor coin economy and transactions</p>
      </div>

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
            <h3 className="text-2xl font-bold text-white">Recent Transactions</h3>
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
                  <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">Payment Method</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">Description</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">Processed By</th>
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
                  transactions.map((transaction, index) => (
                    <tr
                      key={transaction._id}
                      style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}
                    >
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-white font-semibold">{transaction.userId.username}</p>
                          <p className="text-gray-400 text-sm">{transaction.userId.email}</p>
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
                        <p className="text-white font-semibold">{transaction.paymentMethod || 'N/A'}</p>
                        {transaction.paymentReference && (
                          <p className="text-gray-400 text-xs mt-1">Ref: {transaction.paymentReference}</p>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-gray-300">{transaction.description}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-white font-semibold">{transaction.processedBy?.username || 'System'}</p>
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
              {/* First Page */}
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1 || loading}
                className="p-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: 'rgba(30, 30, 30, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#888888'
                }}
                title="First Page"
              >
                <ChevronsLeft size={20} />
              </button>

              {/* Previous Page */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="p-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: 'rgba(30, 30, 30, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#888888'
                }}
                title="Previous Page"
              >
                <ChevronLeft size={20} />
              </button>

              {/* Page Numbers */}
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

              {/* Next Page */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || loading || !hasNextPage}
                className="p-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: 'rgba(30, 30, 30, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#888888'
                }}
                title="Next Page"
              >
                <ChevronRight size={20} />
              </button>

              {/* Last Page */}
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage >= totalPages || loading}
                className="p-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: 'rgba(30, 30, 30, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#888888'
                }}
                title="Last Page"
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