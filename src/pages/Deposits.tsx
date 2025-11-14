import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react';
import api from '../services/api';

interface Deposit {
  _id: string;
  userId: {
    _id: string;
    username: string;
    email: string;
    coinBalance: number;
  };
  amount: number;
  paymentMethod: string;
  accountNumber: string;
  screenshot: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  adminNote: string;
  transactionId: string;
  processedBy?: {
    username: string;
  };
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const Deposits: React.FC = () => {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [actionStatus, setActionStatus] = useState<'approved' | 'rejected'>('approved');
  const [adminNote, setAdminNote] = useState('');
  const [transactionId, setTransactionId] = useState('');

  useEffect(() => {
    fetchDeposits();
  }, [page, filterStatus]);

  const fetchDeposits = async () => {
    try {
      setLoading(true);
      const statusParam = filterStatus !== 'all' ? `&status=${filterStatus}` : '';
      const response = await api.get(`/deposits/all?page=${page}&limit=20${statusParam}`);
      
      if (response.data.success) {
        setDeposits(response.data.deposits);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching deposits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (deposit: Deposit) => {
    setSelectedDeposit(deposit);
    setActionStatus('approved');
    setAdminNote('');
    setTransactionId('');
    setShowModal(true);
  };

  const handleViewScreenshot = (deposit: Deposit) => {
    setSelectedDeposit(deposit);
    setShowImageModal(true);
  };

  const handleProcessDeposit = async () => {
    if (!selectedDeposit) return;

    if (actionStatus === 'rejected' && !adminNote.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setProcessingId(selectedDeposit._id);
      
      const response = await api.patch(`/deposits/${selectedDeposit._id}`, {
        status: actionStatus,
        adminNote: adminNote.trim(),
        transactionId: transactionId.trim()
      });

      if (response.data.success) {
        setDeposits(deposits.map(dep => 
          dep._id === selectedDeposit._id ? response.data.deposit : dep
        ));
        
        setShowModal(false);
        setSelectedDeposit(null);
        alert(`Deposit ${actionStatus} successfully! The user has been notified via email.`);
        fetchDeposits();
      }
    } catch (error: any) {
      console.error('Error processing deposit:', error);
      alert(error.response?.data?.message || 'Failed to process deposit');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return { bg: 'rgba(251, 191, 36, 0.15)', text: '#FCD34D', border: 'rgba(251, 191, 36, 0.3)' };
      case 'approved':
      case 'completed':
        return { bg: 'rgba(0, 255, 127, 0.15)', text: '#00FF7F', border: 'rgba(0, 255, 127, 0.3)' };
      case 'rejected':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.3)' };
      default:
        return { bg: 'rgba(156, 163, 175, 0.15)', text: '#9CA3AF', border: 'rgba(156, 163, 175, 0.3)' };
    }
  };

  const filteredDeposits = deposits.filter(deposit =>
    deposit.userId.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deposit.userId.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deposit.accountNumber.includes(searchTerm)
  );

  const stats = {
    total: deposits.length,
    pending: deposits.filter(d => d.status === 'pending').length,
    approved: deposits.filter(d => d.status === 'approved' || d.status === 'completed').length,
    rejected: deposits.filter(d => d.status === 'rejected').length,
    totalAmount: deposits.reduce((sum, d) => sum + d.amount, 0)
  };

  return (
    <div className="min-h-screen p-6" style={{ background: '#121212' }}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Deposit Management</h1>
            <p className="text-gray-400">Review and process player deposit requests</p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: 'rgba(0, 191, 255, 0.15)', border: '1px solid rgba(0, 191, 255, 0.3)' }}>
            <DollarSign size={32} className="text-cyan-400" />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total Deposits', value: stats.total, color: '#00BFFF' },
          { label: 'Pending', value: stats.pending, color: '#FCD34D' },
          { label: 'Approved', value: stats.approved, color: '#00FF7F' },
          { label: 'Rejected', value: stats.rejected, color: '#EF4444' },
          { label: 'Total Amount', value: `${stats.totalAmount} Coins`, color: '#8A2BE2' }
        ].map((stat, index) => (
          <div
            key={stat.label}
            className="p-4 rounded-xl"
            style={{
              background: 'rgba(30, 30, 30, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
            }}
          >
            <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
            <p className="text-sm" style={{ color: stat.color }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by username, email, or account number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl text-white placeholder-gray-500 focus:outline-none"
            style={{
              background: 'rgba(30, 30, 30, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          />
        </div>
        
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setFilterStatus(status);
                setPage(1);
              }}
              className="px-6 py-3 rounded-xl font-medium transition-all"
              style={{
                background: filterStatus === status ? 'rgba(0, 191, 255, 0.15)' : 'rgba(30, 30, 30, 0.95)',
                border: filterStatus === status ? '1px solid rgba(0, 191, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                color: filterStatus === status ? '#00BFFF' : '#888888'
              }}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Deposits Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: 'rgba(30, 30, 30, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
        }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: '#00BFFF' }}></div>
          </div>
        ) : filteredDeposits.length === 0 ? (
          <div className="text-center py-20">
            <DollarSign size={64} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg">No deposits found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <th className="text-left p-4 text-sm font-semibold text-gray-400">User</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-400">Amount</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-400">Payment Method</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-400">Account</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-400">Status</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-400">Date</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeposits.map((deposit) => {
                    const statusStyle = getStatusColor(deposit.status);
                    return (
                      <tr
                        key={deposit._id}
                        style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-white">{deposit.userId.username}</p>
                            <p className="text-sm text-gray-400">{deposit.userId.email}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-cyan-400">{deposit.amount} Coins</p>
                        </td>
                        <td className="p-4">
                          <p className="text-white">{deposit.paymentMethod}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-gray-300 font-mono text-sm">{deposit.accountNumber}</p>
                        </td>
                        <td className="p-4">
                          <span
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
                            style={{
                              background: statusStyle.bg,
                              color: statusStyle.text,
                              border: `1px solid ${statusStyle.border}`
                            }}
                          >
                            {deposit.status === 'pending' && <Clock size={14} />}
                            {(deposit.status === 'approved' || deposit.status === 'completed') && <CheckCircle size={14} />}
                            {deposit.status === 'rejected' && <XCircle size={14} />}
                            {deposit.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <p className="text-gray-400 text-sm">
                            {new Date(deposit.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {new Date(deposit.createdAt).toLocaleTimeString()}
                          </p>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewScreenshot(deposit)}
                              className="p-2 rounded-lg transition-all"
                              style={{
                                background: 'rgba(0, 191, 255, 0.15)',
                                color: '#00BFFF',
                                border: '1px solid rgba(0, 191, 255, 0.3)'
                              }}
                              title="View Screenshot"
                            >
                              <ImageIcon size={18} />
                            </button>
                            {deposit.status === 'pending' && (
                              <button
                                onClick={() => handleViewDetails(deposit)}
                                className="p-2 rounded-lg transition-all"
                                style={{
                                  background: 'rgba(0, 255, 127, 0.15)',
                                  color: '#00FF7F',
                                  border: '1px solid rgba(0, 255, 127, 0.3)'
                                }}
                                title="Process Deposit"
                              >
                                <Eye size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <p className="text-gray-400">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  style={{
                    background: 'rgba(30, 30, 30, 0.95)',
                    color: '#888888',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  style={{
                    background: 'rgba(30, 30, 30, 0.95)',
                    color: '#888888',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Process Deposit Modal */}
      <AnimatePresence>
        {showModal && selectedDeposit && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              style={{
                background: 'rgba(30, 30, 30, 0.98)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)'
              }}
            >
              <h2 className="text-2xl font-bold text-white mb-6">Process Deposit Request</h2>

              {/* User Info */}
              <div className="grid grid-cols-2 gap-4 mb-6 p-4 rounded-xl" style={{ background: 'rgba(0, 191, 255, 0.05)', border: '1px solid rgba(0, 191, 255, 0.2)' }}>
                <div>
                  <p className="text-gray-400 text-sm mb-1">User</p>
                  <p className="text-white font-medium">{selectedDeposit.userId.username}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Email</p>
                  <p className="text-white font-medium">{selectedDeposit.userId.email}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Amount</p>
                  <p className="text-cyan-400 font-bold text-lg">{selectedDeposit.amount} Coins</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Current Balance</p>
                  <p className="text-white font-medium">{selectedDeposit.userId.coinBalance} Coins</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Payment Method</p>
                  <p className="text-white font-medium">{selectedDeposit.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Account Number</p>
                  <p className="text-white font-medium font-mono">{selectedDeposit.accountNumber}</p>
                </div>
              </div>

              {/* Screenshot Preview */}
              <div className="mb-6">
                <p className="text-gray-400 text-sm mb-2">Payment Screenshot</p>
                <div className="rounded-xl overflow-hidden p-4" style={{ background: 'rgba(0, 191, 255, 0.05)', border: '1px solid rgba(0, 191, 255, 0.2)' }}>
                  {selectedDeposit.screenshot ? (
                    <img
                      src={selectedDeposit.screenshot}
                      alt="Payment Screenshot"
                      className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => handleViewScreenshot(selectedDeposit)}
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkltYWdlIExvYWQgRXJyb3I8L3RleHQ+PC9zdmc+';
                      }}
                    />
                  ) : (
                    <div className="text-center text-gray-500 py-8">No screenshot available</div>
                  )}
                </div>
              </div>

              {/* Action Selection */}
              <div className="mb-6">
                <p className="text-gray-400 text-sm mb-3">Action</p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setActionStatus('approved')}
                    className="flex-1 p-4 rounded-xl border-2 transition-all"
                    style={{
                      background: actionStatus === 'approved' ? 'rgba(0, 255, 127, 0.15)' : 'rgba(30, 30, 30, 0.5)',
                      borderColor: actionStatus === 'approved' ? '#00FF7F' : 'rgba(255, 255, 255, 0.1)',
                      color: actionStatus === 'approved' ? '#00FF7F' : '#888888'
                    }}
                  >
                    <CheckCircle size={24} className="mx-auto mb-2" />
                    <p className="font-medium">Approve</p>
                  </button>
                  <button
                    onClick={() => setActionStatus('rejected')}
                    className="flex-1 p-4 rounded-xl border-2 transition-all"
                    style={{
                      background: actionStatus === 'rejected' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(30, 30, 30, 0.5)',
                      borderColor: actionStatus === 'rejected' ? '#EF4444' : 'rgba(255, 255, 255, 0.1)',
                      color: actionStatus === 'rejected' ? '#EF4444' : '#888888'
                    }}
                  >
                    <XCircle size={24} className="mx-auto mb-2" />
                    <p className="font-medium">Reject</p>
                  </button>
                </div>
              </div>

              {/* Admin Note */}
              <div className="mb-6">
                <label className="block text-gray-400 text-sm mb-2">
                  Admin Note {actionStatus === 'rejected' && <span className="text-red-400">(Required for rejection)</span>}
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder={actionStatus === 'rejected' ? 'Please provide a reason for rejection...' : 'Add a note for the user (optional)...'}
                  rows={4}
                  className="w-full p-3 rounded-xl text-white placeholder-gray-500 focus:outline-none resize-none"
                  style={{
                    background: 'rgba(0, 191, 255, 0.05)',
                    border: '1px solid rgba(0, 191, 255, 0.2)'
                  }}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl font-medium transition-all"
                  style={{
                    background: 'rgba(30, 30, 30, 0.8)',
                    color: '#888888',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessDeposit}
                  disabled={processingId === selectedDeposit._id || (actionStatus === 'rejected' && !adminNote.trim())}
                  className="flex-1 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: actionStatus === 'approved' ? 'rgba(0, 255, 127, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: actionStatus === 'approved' ? '#00FF7F' : '#EF4444',
                    border: `1px solid ${actionStatus === 'approved' ? 'rgba(0, 255, 127, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                  }}
                >
                  {processingId === selectedDeposit._id ? 'Processing...' : `Confirm ${actionStatus === 'approved' ? 'Approval' : 'Rejection'}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Modal */}
      <AnimatePresence>
        {showImageModal && selectedDeposit && (
          <div
            className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowImageModal(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="max-w-4xl w-full"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Payment Screenshot</h3>
                <button
                  onClick={() => setShowImageModal(false)}
                  className="p-2 rounded-lg transition-colors"
                  style={{
                    background: 'rgba(30, 30, 30, 0.8)',
                    color: '#888888'
                  }}
                >
                  <XCircle size={24} />
                </button>
              </div>
              {selectedDeposit.screenshot ? (
                <img
                  src={selectedDeposit.screenshot}
                  alt="Payment Screenshot"
                  className="w-full rounded-2xl"
                  onError={(e) => {
                    console.error('Full image failed to load');
                  }}
                />
              ) : (
                <div className="text-center text-gray-500 py-20">No screenshot available</div>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Deposits;