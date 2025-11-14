import React, { useEffect, useState } from 'react';
import { 
  DollarSign, 
  Search, 
  Clock, 
  User,
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Check,
  X,
  ChevronLeft,
  ChevronRight
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
      const params: any = { page: currentPage, limit: 2 };
      if (statusFilter !== 'all') params.status = statusFilter;
      
      const response = await withdrawalAPI.getAll(params);
      
      setWithdrawals(response.data.withdrawals || []);
      setPagination(response.data.pagination || { total: 0, page: 1, pages: 1 });
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      alert('Failed to fetch withdrawals');
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
      
      alert(`Withdrawal ${actionType === 'approve' ? 'approved' : 'rejected'} successfully!`);
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

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': 
        return { bg: 'rgba(251, 191, 36, 0.1)', text: '#FCD34D', border: 'rgba(251, 191, 36, 0.3)' };
      case 'approved': 
        return { bg: 'rgba(16, 185, 129, 0.1)', text: '#34D399', border: 'rgba(16, 185, 129, 0.3)' };
      case 'completed': 
        return { bg: 'rgba(16, 185, 129, 0.1)', text: '#10B981', border: 'rgba(16, 185, 129, 0.3)' };
      case 'rejected': 
        return { bg: 'rgba(239, 68, 68, 0.1)', text: '#F87171', border: 'rgba(239, 68, 68, 0.3)' };
      default: 
        return { bg: 'rgba(156, 163, 175, 0.1)', text: '#9CA3AF', border: 'rgba(156, 163, 175, 0.3)' };
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

  const getProcessedByName = (withdrawal: Withdrawal) => {
    if (withdrawal.processedBy && typeof withdrawal.processedBy === 'object') {
      return withdrawal.processedBy.username || 'Unknown Admin';
    }
    return 'Unknown Admin';
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

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxButtons = 7;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(pagination.pages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    // First page button
    if (startPage > 1) {
      buttons.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="px-4 py-2 rounded-lg font-medium transition-all"
          style={{
            background: 'rgba(30, 30, 30, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#888888'
          }}
        >
          1
        </button>
      );
      if (startPage > 2) {
        buttons.push(
          <span key="ellipsis1" className="px-2 text-gray-500">...</span>
        );
      }
    }

    // Page buttons
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className="px-4 py-2 rounded-lg font-medium transition-all"
          style={{
            background: currentPage === i ? '#00BFFF' : 'rgba(30, 30, 30, 0.95)',
            border: currentPage === i ? '1px solid #00BFFF' : '1px solid rgba(255, 255, 255, 0.1)',
            color: currentPage === i ? 'white' : '#888888'
          }}
        >
          {i}
        </button>
      );
    }

    // Last page button
    if (endPage < pagination.pages) {
      if (endPage < pagination.pages - 1) {
        buttons.push(
          <span key="ellipsis2" className="px-2 text-gray-500">...</span>
        );
      }
      buttons.push(
        <button
          key={pagination.pages}
          onClick={() => handlePageChange(pagination.pages)}
          className="px-4 py-2 rounded-lg font-medium transition-all"
          style={{
            background: 'rgba(30, 30, 30, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#888888'
          }}
        >
          {pagination.pages}
        </button>
      );
    }

    return buttons;
  };

  if (loading) {
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
        <p className="text-gray-400">Review and process player withdrawal requests • Total: {pagination.total} | Page {currentPage} of {pagination.pages}</p>
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
              onClick={() => handleStatusFilterChange(status)}
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

      {/* Withdrawals List */}
      <div className="space-y-4">
        {filteredWithdrawals.length === 0 ? (
          <div 
            className="text-center py-20 rounded-xl"
            style={{
              background: 'rgba(30, 30, 30, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <DollarSign size={64} className="mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400 text-lg">No withdrawal requests found</p>
          </div>
        ) : (
          filteredWithdrawals.map((withdrawal) => {
            const statusStyle = getStatusColor(withdrawal.status);
            const isPending = withdrawal.status === 'pending';
            const userData = getUserData(withdrawal);

            return (
              <div
                key={withdrawal._id}
                className="rounded-xl overflow-hidden"
                style={{
                  background: 'rgba(30, 30, 30, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: isPending 
                    ? '2px solid rgba(251, 191, 36, 0.5)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
                }}
              >
                {isPending && (
                  <div 
                    className="h-1"
                    style={{
                      background: 'linear-gradient(90deg, #FCD34D 0%, #F59E0B 100%)',
                    }}
                  />
                )}

                <div className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Section - Main Info */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between flex-wrap gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <User size={20} style={{ color: '#00BFFF' }} />
                            <h3 className="text-xl font-bold text-white">{userData.username}</h3>
                            <span 
                              className="px-3 py-1 rounded-full text-xs font-bold uppercase"
                              style={{
                                background: statusStyle.bg,
                                color: statusStyle.text,
                                border: `1px solid ${statusStyle.border}`
                              }}
                            >
                              {withdrawal.status === 'pending' && <Clock size={12} className="inline mr-1" />}
                              {withdrawal.status === 'completed' && <CheckCircle2 size={12} className="inline mr-1" />}
                              {withdrawal.status === 'approved' && <Check size={12} className="inline mr-1" />}
                              {withdrawal.status === 'rejected' && <XCircle size={12} className="inline mr-1" />}
                              {withdrawal.status}
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm">{userData.email}</p>
                          <p className="text-gray-500 text-xs mt-1">
                            Requested: {new Date(withdrawal.createdAt).toLocaleString()}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm text-gray-400 mb-1">Amount</p>
                          <p className="text-3xl font-black" style={{ color: '#00BFFF' }}>{withdrawal.amount}</p>
                          <p className="text-sm text-gray-500">AX Coins</p>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div 
                          className="p-4 rounded-lg"
                          style={{
                            background: 'rgba(18, 18, 18, 0.8)',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                          }}
                        >
                          <p className="text-xs text-gray-400 mb-1">Payment Method</p>
                          <div className="flex items-center text-white font-semibold">
                            <CreditCard size={16} className="mr-2" />
                            {withdrawal.paymentMethod}
                          </div>
                        </div>

                        <div 
                          className="p-4 rounded-lg"
                          style={{
                            background: 'rgba(18, 18, 18, 0.8)',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                          }}
                        >
                          <p className="text-xs text-gray-400 mb-1">Account Number</p>
                          <p className="text-white font-semibold font-mono">{withdrawal.accountNumber}</p>
                        </div>

                        <div 
                          className="p-4 rounded-lg"
                          style={{
                            background: 'rgba(18, 18, 18, 0.8)',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                          }}
                        >
                          <p className="text-xs text-gray-400 mb-1">Current Balance</p>
                          <p className="text-white font-semibold">{userData.coinBalance} AX Coins</p>
                        </div>

                        <div 
                          className="p-4 rounded-lg"
                          style={{
                            background: 'rgba(18, 18, 18, 0.8)',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                          }}
                        >
                          <p className="text-xs text-gray-400 mb-1">Phone Number</p>
                          <p className="text-white font-semibold">{userData.phoneNumber}</p>
                        </div>
                      </div>

                      {/* Transaction ID */}
                      {withdrawal.transactionId && (
                        <div 
                          className="p-4 rounded-lg"
                          style={{
                            background: 'rgba(0, 191, 255, 0.1)',
                            border: '1px solid rgba(0, 191, 255, 0.3)'
                          }}
                        >
                          <p className="text-xs mb-1 font-semibold" style={{ color: '#00BFFF' }}>Transaction ID</p>
                          <p className="text-white text-sm font-mono">{withdrawal.transactionId}</p>
                        </div>
                      )}

                      {/* Admin Note */}
                      {withdrawal.adminNote && (
                        <div 
                          className="p-4 rounded-lg"
                          style={{
                            background: 'rgba(138, 43, 226, 0.1)',
                            border: '1px solid rgba(138, 43, 226, 0.3)'
                          }}
                        >
                          <p className="text-xs mb-1 font-semibold" style={{ color: '#8A2BE2' }}>Admin Note</p>
                          <p className="text-gray-300 text-sm">{withdrawal.adminNote}</p>
                        </div>
                      )}

                      {/* Processed Info */}
                      {withdrawal.processedBy && withdrawal.processedAt && (
                        <div className="text-xs text-gray-500">
                          Processed by: <span className="text-gray-400 font-semibold">{getProcessedByName(withdrawal)}</span>
                          {' on '}{new Date(withdrawal.processedAt).toLocaleString()}
                        </div>
                      )}
                    </div>

                    {/* Right Section - Actions */}
                    {withdrawal.status === 'pending' && (
                      <div className="lg:w-64 space-y-3">
                        <button
                          onClick={() => openActionModal(withdrawal, 'approve')}
                          className="w-full px-6 py-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                          style={{
                            background: 'rgba(16, 185, 129, 0.2)',
                            border: '1px solid rgba(16, 185, 129, 0.5)',
                            color: '#34D399'
                          }}
                        >
                          <Check size={20} />
                          Approve & Send Money
                        </button>

                        <button
                          onClick={() => openActionModal(withdrawal, 'reject')}
                          className="w-full px-6 py-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                          style={{
                            background: 'rgba(239, 68, 68, 0.2)',
                            border: '1px solid rgba(239, 68, 68, 0.5)',
                            color: '#F87171'
                          }}
                        >
                          <X size={20} />
                          Reject Request
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Enhanced Pagination */}
      {pagination.pages > 1 && (
        <div className="mt-8 space-y-4">
          {/* Pagination Info */}
          <div className="text-center text-gray-400 text-sm">
            Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, pagination.total)} of {pagination.total} withdrawals
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-center items-center gap-2 flex-wrap">
            {/* Previous Button */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              style={{
                background: currentPage === 1 ? 'rgba(30, 30, 30, 0.95)' : '#00BFFF',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: currentPage === 1 ? '#888888' : 'white'
              }}
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            {/* Page Numbers */}
            {renderPaginationButtons()}

            {/* Next Button */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === pagination.pages}
              className="px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              style={{
                background: currentPage === pagination.pages ? 'rgba(30, 30, 30, 0.95)' : '#00BFFF',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: currentPage === pagination.pages ? '#888888' : 'white'
              }}
            >
              Next
              <ChevronRight size={16} />
            </button>
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
                    ? 'Add any notes (optional - e.g., "Payment sent via Easypaisa")'
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
                  {processing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full border-2 border-transparent animate-spin"
                        style={{
                          borderTopColor: 'currentColor'
                        }}
                      />
                      Processing...
                    </span>
                  ) : (
                    `Confirm ${actionType === 'approve' ? 'Payment Sent' : 'Rejection'}`
                  )}
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