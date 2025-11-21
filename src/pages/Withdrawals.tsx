import React, { useEffect, useState } from 'react';
import { 
  DollarSign, Search, Clock, User, CreditCard, CheckCircle2,
  XCircle, AlertCircle, Check, X, ChevronLeft, ChevronRight,
  TrendingUp, TrendingDown, Users, Eye
} from 'lucide-react';
import { withdrawalAPI } from '../services/api';

// Type definitions
interface UserInfo {
  _id: string;
  username: string;
  email: string;
  phoneNumber?: string;
  coinBalance: number;
}

interface ProcessedBy {
  _id: string;
  username: string;
}

interface Withdrawal {
  _id: string;
  userId: UserInfo;
  amount: number;
  paymentMethod: string;
  accountNumber: string;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  adminNote?: string;
  transactionId?: string;
  processedBy?: ProcessedBy;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  total: number;
  page: number;
  pages: number;
}

const Withdrawals: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [adminNote, setAdminNote] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [processing, setProcessing] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, pages: 1 });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchWithdrawals();
  }, [statusFilter, currentPage]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const params: any = { page: currentPage, limit: 10 };
      if (statusFilter !== 'all') params.status = statusFilter;
      
      const response = await withdrawalAPI.getAll(params);
      
      setWithdrawals(response.data.withdrawals || []);
      setPagination(response.data.pagination || { total: 0, page: 1, pages: 1 });
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedWithdrawal) return;
    
    if (actionType === 'reject' && !adminNote.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    try {
      setProcessing(true);
      const status = actionType === 'approve' ? 'completed' : 'rejected';
      
      await withdrawalAPI.updateStatus(
        selectedWithdrawal._id, 
        status, 
        adminNote.trim(),
        transactionId.trim()
      );
      
      setShowActionModal(false);
      setAdminNote('');
      setTransactionId('');
      setSelectedWithdrawal(null);
      
      fetchWithdrawals();
    } catch (error: any) {
      console.error('Error updating withdrawal:', error);
      alert(error.response?.data?.message || 'Failed to update withdrawal status');
    } finally {
      setProcessing(false);
    }
  };

  const openActionModal = (withdrawal: Withdrawal, type: 'approve' | 'reject') => {
    setSelectedWithdrawal(withdrawal);
    setActionType(type);
    setShowActionModal(true);
    setAdminNote('');
    setTransactionId('');
  };

  const openDetailsModal = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setShowDetailsModal(true);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': 
        return { bg: 'rgba(245, 158, 11, 0.2)', text: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.4)' };
      case 'approved': 
        return { bg: 'rgba(16, 185, 129, 0.2)', text: '#10B981', border: '1px solid rgba(16, 185, 129, 0.4)' };
      case 'completed': 
        return { bg: 'rgba(16, 185, 129, 0.2)', text: '#10B981', border: '1px solid rgba(16, 185, 129, 0.4)' };
      case 'rejected': 
        return { bg: 'rgba(239, 68, 68, 0.2)', text: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.4)' };
      default: 
        return { bg: 'rgba(156, 163, 175, 0.2)', text: '#9CA3AF', border: '1px solid rgba(156, 163, 175, 0.4)' };
    }
  };

  const getUserData = (withdrawal: Withdrawal) => {
    if (typeof withdrawal.userId === 'object' && withdrawal.userId !== null) {
      return {
        username: withdrawal.userId.username || 'Unknown User',
        email: withdrawal.userId.email || 'No email',
        phoneNumber: withdrawal.userId.phoneNumber || 'N/A',
        coinBalance: withdrawal.userId.coinBalance || 0
      };
    }
    return {
      username: 'Unknown User',
      email: 'No email',
      phoneNumber: 'N/A',
      coinBalance: 0
    };
  };

  const filteredWithdrawals = withdrawals.filter(w => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const userData = getUserData(w);
    return (
      userData.username.toLowerCase().includes(query) ||
      userData.email.toLowerCase().includes(query) ||
      w.accountNumber.toLowerCase().includes(query) ||
      w.paymentMethod.toLowerCase().includes(query)
    );
  });

  // Calculate stats
  const stats = {
    total: pagination.total,
    pending: withdrawals.filter(w => w.status === 'pending').length,
    completed: withdrawals.filter(w => w.status === 'completed').length,
    rejected: withdrawals.filter(w => w.status === 'rejected').length,
    totalAmount: withdrawals.reduce((sum, w) => sum + w.amount, 0)
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
        <div className="p-3 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
          <Icon size={24} style={{ color }} />
        </div>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );

  if (loading && !withdrawals.length) {
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
        <h1 className="text-4xl font-bold text-white mb-2">Withdrawal Management</h1>
        <p className="text-gray-400">Review and process player withdrawal requests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard
          title="Total Requests"
          value={stats.total}
          icon={Users}
          color="#00BFFF"
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          icon={Clock}
          color="#F59E0B"
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          icon={CheckCircle2}
          color="#10B981"
        />
        <StatCard
          title="Rejected"
          value={stats.rejected}
          icon={XCircle}
          color="#EF4444"
        />
        <StatCard
          title="Total Amount"
          value={`${stats.totalAmount} AX`}
          icon={DollarSign}
          color="#8B5CF6"
        />
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by username, email, account number, or payment method..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-lg text-white placeholder-gray-500 focus:outline-none"
            style={{
              background: 'rgba(30, 30, 30, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'approved', 'completed', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
              className="px-4 py-2 rounded-lg font-medium transition-all capitalize"
              style={{
                background: statusFilter === status 
                  ? 'rgba(0, 191, 255, 0.2)'
                  : 'rgba(30, 30, 30, 0.95)',
                border: statusFilter === status 
                  ? '1px solid rgba(0, 191, 255, 0.5)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                color: statusFilter === status ? '#00BFFF' : '#888888'
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Withdrawals Table */}
      <div
        className="rounded-xl overflow-hidden mb-8"
        style={{
          background: 'rgba(30, 30, 30, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div className="p-6">
          <h3 className="text-2xl font-bold text-white mb-6">Withdrawal Requests</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">User</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">Amount</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">Payment Method</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">Account</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">Status</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">Date</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWithdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <DollarSign size={48} className="mx-auto mb-4 text-gray-600" />
                      <p className="text-gray-400 text-lg">No withdrawal requests found</p>
                    </td>
                  </tr>
                ) : (
                  filteredWithdrawals.map((withdrawal) => {
                    const statusStyle = getStatusColor(withdrawal.status);
                    const userData = getUserData(withdrawal);

                    return (
                      <tr
                        key={withdrawal._id}
                        style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}
                      >
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-white font-semibold">{userData.username}</p>
                            <p className="text-gray-400 text-sm">{userData.email}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-white font-bold text-lg">{withdrawal.amount.toLocaleString()} AX</p>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center text-white">
                            <CreditCard size={16} className="mr-2 text-gray-400" />
                            {withdrawal.paymentMethod}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-white font-mono text-sm">{withdrawal.accountNumber}</p>
                        </td>
                        <td className="py-4 px-4">
                          <span 
                            className="px-3 py-1 rounded-lg text-xs font-semibold uppercase inline-flex items-center"
                            style={statusStyle}
                          >
                            {withdrawal.status === 'pending' && <Clock size={12} className="mr-1" />}
                            {withdrawal.status === 'completed' && <CheckCircle2 size={12} className="mr-1" />}
                            {withdrawal.status === 'rejected' && <XCircle size={12} className="mr-1" />}
                            {withdrawal.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-gray-400 text-sm">{new Date(withdrawal.createdAt).toLocaleDateString()}</p>
                          <p className="text-gray-500 text-xs">{new Date(withdrawal.createdAt).toLocaleTimeString()}</p>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openDetailsModal(withdrawal)}
                              className="p-2 rounded-lg transition-all hover:scale-105"
                              style={{
                                background: 'rgba(0, 191, 255, 0.2)',
                                border: '1px solid rgba(0, 191, 255, 0.4)',
                                color: '#00BFFF'
                              }}
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            
                            {withdrawal.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => openActionModal(withdrawal, 'approve')}
                                  className="p-2 rounded-lg transition-all hover:scale-105"
                                  style={{
                                    background: 'rgba(16, 185, 129, 0.2)',
                                    border: '1px solid rgba(16, 185, 129, 0.4)',
                                    color: '#10B981'
                                  }}
                                  title="Approve"
                                >
                                  <Check size={16} />
                                </button>
                                <button
                                  onClick={() => openActionModal(withdrawal, 'reject')}
                                  className="p-2 rounded-lg transition-all hover:scale-105"
                                  style={{
                                    background: 'rgba(239, 68, 68, 0.2)',
                                    border: '1px solid rgba(239, 68, 68, 0.4)',
                                    color: '#EF4444'
                                  }}
                                  title="Reject"
                                >
                                  <X size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            style={{
              background: 'rgba(30, 30, 30, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#888888'
            }}
          >
            <ChevronLeft size={20} />
          </button>

          <span className="text-gray-400 px-4">
            Page {currentPage} of {pagination.pages}
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= pagination.pages}
            className="p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            style={{
              background: 'rgba(30, 30, 30, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#888888'
            }}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedWithdrawal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)'
          }}
          onClick={() => setShowDetailsModal(false)}
        >
          <div
            className="max-w-2xl w-full rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(30, 30, 30, 0.98)',
              border: '1px solid rgba(0, 191, 255, 0.5)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div className="h-1" style={{ background: 'linear-gradient(90deg, #00BFFF 0%, #8B5CF6 100%)' }} />
            <div className="p-6 space-y-6">
              <h3 className="text-2xl font-bold text-white">Withdrawal Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg" style={{ background: 'rgba(18, 18, 18, 0.8)' }}>
                  <p className="text-xs text-gray-400 mb-1">User</p>
                  <p className="text-white font-semibold">{getUserData(selectedWithdrawal).username}</p>
                  <p className="text-gray-400 text-sm">{getUserData(selectedWithdrawal).email}</p>
                </div>
                
                <div className="p-4 rounded-lg" style={{ background: 'rgba(18, 18, 18, 0.8)' }}>
                  <p className="text-xs text-gray-400 mb-1">Amount</p>
                  <p className="text-white font-bold text-xl">{selectedWithdrawal.amount} AX</p>
                </div>
                
                <div className="p-4 rounded-lg" style={{ background: 'rgba(18, 18, 18, 0.8)' }}>
                  <p className="text-xs text-gray-400 mb-1">Payment Method</p>
                  <p className="text-white font-semibold">{selectedWithdrawal.paymentMethod}</p>
                </div>
                
                <div className="p-4 rounded-lg" style={{ background: 'rgba(18, 18, 18, 0.8)' }}>
                  <p className="text-xs text-gray-400 mb-1">Account Number</p>
                  <p className="text-white font-mono">{selectedWithdrawal.accountNumber}</p>
                </div>
                
                <div className="p-4 rounded-lg" style={{ background: 'rgba(18, 18, 18, 0.8)' }}>
                  <p className="text-xs text-gray-400 mb-1">Phone Number</p>
                  <p className="text-white font-semibold">{getUserData(selectedWithdrawal).phoneNumber}</p>
                </div>
                
                <div className="p-4 rounded-lg" style={{ background: 'rgba(18, 18, 18, 0.8)' }}>
                  <p className="text-xs text-gray-400 mb-1">Current Balance</p>
                  <p className="text-white font-semibold">{getUserData(selectedWithdrawal).coinBalance} AX</p>
                </div>
              </div>

              {selectedWithdrawal.transactionId && (
                <div className="p-4 rounded-lg" style={{ background: 'rgba(0, 191, 255, 0.1)', border: '1px solid rgba(0, 191, 255, 0.3)' }}>
                  <p className="text-xs mb-1 font-semibold" style={{ color: '#00BFFF' }}>Transaction ID</p>
                  <p className="text-white font-mono">{selectedWithdrawal.transactionId}</p>
                </div>
              )}

              {selectedWithdrawal.adminNote && (
                <div className="p-4 rounded-lg" style={{ background: 'rgba(138, 43, 226, 0.1)', border: '1px solid rgba(138, 43, 226, 0.3)' }}>
                  <p className="text-xs mb-1 font-semibold" style={{ color: '#8B5CF6' }}>Admin Note</p>
                  <p className="text-gray-300">{selectedWithdrawal.adminNote}</p>
                </div>
              )}

              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-full px-6 py-3 rounded-lg font-semibold transition-all"
                style={{
                  background: 'rgba(0, 191, 255, 0.2)',
                  border: '1px solid rgba(0, 191, 255, 0.5)',
                  color: '#00BFFF'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && selectedWithdrawal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)'
          }}
          onClick={() => setShowActionModal(false)}
        >
          <div
            className="max-w-lg w-full rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(30, 30, 30, 0.98)',
              border: `2px solid ${actionType === 'approve' ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div 
              className="h-1"
              style={{
                background: actionType === 'approve' 
                  ? 'linear-gradient(90deg, #10B981 0%, #34D399 100%)'
                  : 'linear-gradient(90deg, #EF4444 0%, #F87171 100%)'
              }}
            />
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                {actionType === 'approve' ? (
                  <div className="p-3 rounded-lg" style={{ background: 'rgba(16, 185, 129, 0.2)' }}>
                    <CheckCircle2 size={32} className="text-green-400" />
                  </div>
                ) : (
                  <div className="p-3 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.2)' }}>
                    <AlertCircle size={32} className="text-red-400" />
                  </div>
                )}
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    {actionType === 'approve' ? 'Approve & Send Payment' : 'Reject Withdrawal'}
                  </h3>
                  <p className="text-gray-400">
                    {getUserData(selectedWithdrawal).username} - {selectedWithdrawal.amount} AX Coins
                  </p>
                </div>
              </div>

              {/* Admin Note */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Admin Note {actionType === 'reject' && <span className="text-red-400">*</span>}
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder={actionType === 'approve' 
                    ? 'Add any notes (optional)'
                    : 'Explain the reason for rejection (required)'
                  }
                  rows={4}
                  className="w-full p-4 rounded-lg text-white placeholder-gray-500 focus:outline-none resize-none"
                  style={{
                    background: 'rgba(18, 18, 18, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                />
              </div>

              {/* Transaction ID (for approve) */}
              {actionType === 'approve' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Transaction ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter transaction ID if available"
                    className="w-full p-4 rounded-lg text-white placeholder-gray-500 focus:outline-none"
                    style={{
                      background: 'rgba(18, 18, 18, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowActionModal(false)}
                  className="flex-1 px-6 py-3 rounded-lg font-semibold transition-all"
                  style={{
                    background: 'rgba(18, 18, 18, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#888888'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAction}
                  disabled={processing || (actionType === 'reject' && !adminNote.trim())}
                  className="flex-1 px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: actionType === 'approve'
                      ? 'rgba(16, 185, 129, 0.3)'
                      : 'rgba(239, 68, 68, 0.3)',
                    border: actionType === 'approve'
                      ? '1px solid rgba(16, 185, 129, 0.5)'
                      : '1px solid rgba(239, 68, 68, 0.5)',
                    color: actionType === 'approve' ? '#34D399' : '#F87171'
                  }}
                >
                  {processing ? 'Processing...' : `Confirm ${actionType === 'approve' ? 'Approval' : 'Rejection'}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Withdrawals;