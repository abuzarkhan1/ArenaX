import React, { useEffect, useState } from 'react';
import { Users as UsersIcon, Search, Eye, Ban, CheckCircle, Plus, X } from 'lucide-react';
import { userAPI } from '../services/api';
import { User } from '../types';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCoinModal, setShowCoinModal] = useState(false);
  const [coinData, setCoinData] = useState({
    amount: '',
    type: 'credit' as 'credit' | 'debit',
    description: '',
    paymentMethod: 'Admin',
    paymentReference: ''
  });

  useEffect(() => {
    fetchUsers();
  }, [userTypeFilter]);

  const fetchUsers = async () => {
    try {
      const params: any = {};
      if (userTypeFilter !== 'all') params.userType = userTypeFilter;
      if (search) params.search = search;

      const response = await userAPI.getAll(params);
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (userId: string, status: string) => {
    try {
      await userAPI.updateStatus(userId, status);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const handleCoinAdjustment = async () => {
    if (!selectedUser || !coinData.amount || !coinData.description) {
      alert('Please fill all required fields');
      return;
    }

    try {
      await userAPI.adjustCoins(selectedUser._id, {
        amount: parseInt(coinData.amount),
        type: coinData.type,
        description: coinData.description,
        paymentMethod: coinData.paymentMethod,
        paymentReference: coinData.paymentReference || undefined
      });

      setCoinData({
        amount: '',
        type: 'credit',
        description: '',
        paymentMethod: 'Admin',
        paymentReference: ''
      });
      setShowCoinModal(false);
      fetchUsers();
      alert('Coins adjusted successfully');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error adjusting coins');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      active: { bg: 'rgba(16, 185, 129, 0.2)', text: '#10B981' },
      suspended: { bg: 'rgba(251, 191, 36, 0.2)', text: '#FBBF24' },
      banned: { bg: 'rgba(239, 68, 68, 0.2)', text: '#EF4444' },
    };

    const badge = badges[status] || badges.active;
    return (
      <span 
        className="px-3 py-1 rounded-full text-xs font-bold"
        style={{
          background: badge.bg,
          color: badge.text,
          border: `1px solid ${badge.text}40`,
        }}
      >
        {status.toUpperCase()}
      </span>
    );
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
        <h1 className="text-4xl font-bold text-white mb-2">User Management</h1>
        <p className="text-gray-400">Manage users and their coin balances</p>
      </div>

      {/* Search and Filter Card */}
      <div
        className="rounded-xl p-6 mb-8"
        style={{
          background: 'rgba(30, 30, 30, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchUsers()}
              className="w-full pl-10 pr-4 py-3 rounded-lg text-white placeholder-gray-500 focus:outline-none transition-all"
              style={{
                background: 'rgba(20, 20, 20, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            />
          </div>

          <select
            value={userTypeFilter}
            onChange={(e) => setUserTypeFilter(e.target.value)}
            className="px-4 py-3 rounded-lg text-white focus:outline-none transition-all"
            style={{
              background: 'rgba(20, 20, 20, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <option value="all">All Users</option>
            <option value="player">Players</option>
            <option value="organizer">Organizers</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: 'rgba(30, 30, 30, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <th className="text-left py-4 px-6 text-gray-400 font-semibold text-sm">User</th>
                <th className="text-left py-4 px-6 text-gray-400 font-semibold text-sm">Type</th>
                <th className="text-left py-4 px-6 text-gray-400 font-semibold text-sm">Coin Balance</th>
                <th className="text-left py-4 px-6 text-gray-400 font-semibold text-sm">Total Earned</th>
                <th className="text-left py-4 px-6 text-gray-400 font-semibold text-sm">Total Spent</th>
                <th className="text-left py-4 px-6 text-gray-400 font-semibold text-sm">Status</th>
                <th className="text-left py-4 px-6 text-gray-400 font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user._id}
                  className="hover:bg-opacity-50 transition-all"
                  style={{ 
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    background: 'transparent'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td className="py-4 px-6">
                    <div>
                      <p className="text-white font-semibold">{user.username}</p>
                      <p className="text-gray-400 text-sm">{user.email}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span 
                      className="px-3 py-1 rounded-lg text-xs font-semibold"
                      style={{
                        background: user.role === 'player' 
                          ? 'rgba(0, 191, 255, 0.2)' 
                          : 'rgba(138, 43, 226, 0.2)',
                        color: user.role === 'player' ? '#00BFFF' : '#8A2BE2',
                      }}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-cyan-400 font-bold">{user.coinBalance.toLocaleString()} AX</p>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-green-400 font-semibold">{user.totalCoinsEarned.toLocaleString()}</p>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-red-400 font-semibold">{user.totalCoinsSpent.toLocaleString()}</p>
                  </td>
                  <td className="py-4 px-6">
                    {getStatusBadge(user.accountStatus)}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowModal(true);
                        }}
                        className="p-2 rounded-lg transition-all hover:opacity-80"
                        style={{
                          background: 'rgba(0, 191, 255, 0.2)',
                          color: '#00BFFF',
                        }}
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowCoinModal(true);
                        }}
                        className="p-2 rounded-lg transition-all hover:opacity-80"
                        style={{
                          background: 'rgba(16, 185, 129, 0.2)',
                          color: '#10B981',
                        }}
                        title="Adjust Coins"
                      >
                        <Plus size={18} />
                      </button>
                      {user.accountStatus === 'active' ? (
                        <button
                          onClick={() => handleStatusUpdate(user._id, 'suspended')}
                          className="p-2 rounded-lg transition-all hover:opacity-80"
                          style={{
                            background: 'rgba(251, 191, 36, 0.2)',
                            color: '#FBBF24',
                          }}
                          title="Suspend"
                        >
                          <Ban size={18} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusUpdate(user._id, 'active')}
                          className="p-2 rounded-lg transition-all hover:opacity-80"
                          style={{
                            background: 'rgba(16, 185, 129, 0.2)',
                            color: '#10B981',
                          }}
                          title="Activate"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {showModal && selectedUser && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)'
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            style={{
              background: 'rgba(30, 30, 30, 0.98)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="sticky top-0 p-6 flex items-center justify-between"
              style={{
                background: 'rgba(30, 30, 30, 0.98)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <h3 className="text-2xl font-bold text-white">User Details</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)'
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div 
                  className="p-4 rounded-lg"
                  style={{
                    background: 'rgba(20, 20, 20, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <p className="text-gray-400 text-sm mb-1">Username</p>
                  <p className="text-white font-semibold">{selectedUser.username}</p>
                </div>
                <div 
                  className="p-4 rounded-lg"
                  style={{
                    background: 'rgba(20, 20, 20, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <p className="text-gray-400 text-sm mb-1">Email</p>
                  <p className="text-white font-semibold">{selectedUser.email}</p>
                </div>
                <div 
                  className="p-4 rounded-lg"
                  style={{
                    background: 'rgba(20, 20, 20, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <p className="text-gray-400 text-sm mb-1">Full Name</p>
                  <p className="text-white font-semibold">{selectedUser.fullName}</p>
                </div>
                <div 
                  className="p-4 rounded-lg"
                  style={{
                    background: 'rgba(20, 20, 20, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <p className="text-gray-400 text-sm mb-1">Phone</p>
                  <p className="text-white font-semibold">{selectedUser.phoneNumber || 'N/A'}</p>
                </div>
                <div 
                  className="p-4 rounded-lg"
                  style={{
                    background: 'rgba(20, 20, 20, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <p className="text-gray-400 text-sm mb-1">User Type</p>
                  <p className="text-white font-semibold capitalize">{selectedUser.userType}</p>
                </div>
                <div 
                  className="p-4 rounded-lg"
                  style={{
                    background: 'rgba(20, 20, 20, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <p className="text-gray-400 text-sm mb-1">Status</p>
                  <div className="mt-2">{getStatusBadge(selectedUser.accountStatus)}</div>
                </div>
              </div>

              <div 
                className="rounded-lg p-6"
                style={{
                  background: 'rgba(0, 191, 255, 0.1)',
                  border: '1px solid rgba(0, 191, 255, 0.2)',
                }}
              >
                <h4 className="text-white font-bold text-lg mb-4">Coin Information</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg" style={{ background: 'rgba(20, 20, 20, 0.6)' }}>
                    <p className="text-gray-400 text-sm mb-2">Current Balance</p>
                    <p className="text-cyan-400 font-bold text-xl">{selectedUser.coinBalance.toLocaleString()}</p>
                  </div>
                  <div className="text-center p-4 rounded-lg" style={{ background: 'rgba(20, 20, 20, 0.6)' }}>
                    <p className="text-gray-400 text-sm mb-2">Total Earned</p>
                    <p className="text-green-400 font-bold text-xl">{selectedUser.totalCoinsEarned.toLocaleString()}</p>
                  </div>
                  <div className="text-center p-4 rounded-lg" style={{ background: 'rgba(20, 20, 20, 0.6)' }}>
                    <p className="text-gray-400 text-sm mb-2">Total Spent</p>
                    <p className="text-red-400 font-bold text-xl">{selectedUser.totalCoinsSpent.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div 
                className="rounded-lg p-6"
                style={{
                  background: 'rgba(138, 43, 226, 0.1)',
                  border: '1px solid rgba(138, 43, 226, 0.2)',
                }}
              >
                <h4 className="text-white font-bold text-lg mb-4">Game Statistics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg" style={{ background: 'rgba(20, 20, 20, 0.6)' }}>
                    <p className="text-gray-400 text-sm mb-1">Tournaments Joined</p>
                    <p className="text-white font-bold text-lg">{selectedUser.gameStats.totalKills}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Coin Adjustment Modal */}
      {showCoinModal && selectedUser && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)'
          }}
          onClick={() => {
            setShowCoinModal(false);
            setCoinData({
              amount: '',
              type: 'credit',
              description: '',
              paymentMethod: 'Admin',
              paymentReference: ''
            });
          }}
        >
          <div
            className="rounded-xl max-w-md w-full"
            style={{
              background: 'rgba(30, 30, 30, 0.98)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="p-6"
              style={{
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <h3 className="text-2xl font-bold text-white mb-2">Adjust Coins</h3>
              <p className="text-gray-400 text-sm">
                {selectedUser.username} - Current Balance: <span className="text-cyan-400 font-semibold">{selectedUser.coinBalance} AX</span>
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-2">Transaction Type</label>
                <select
                  value={coinData.type}
                  onChange={(e) => setCoinData({ ...coinData, type: e.target.value as 'credit' | 'debit' })}
                  className="w-full px-4 py-3 rounded-lg text-white focus:outline-none transition-all"
                  style={{
                    background: 'rgba(20, 20, 20, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <option value="credit">Credit (Add Coins)</option>
                  <option value="debit">Debit (Remove Coins)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-2">Amount</label>
                <input
                  type="number"
                  value={coinData.amount}
                  onChange={(e) => setCoinData({ ...coinData, amount: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg text-white focus:outline-none transition-all"
                  style={{
                    background: 'rgba(20, 20, 20, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-2">Description</label>
                <textarea
                  value={coinData.description}
                  onChange={(e) => setCoinData({ ...coinData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg text-white focus:outline-none transition-all"
                  style={{
                    background: 'rgba(20, 20, 20, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                  rows={3}
                  placeholder="Enter reason for adjustment"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-2">Payment Method</label>
                <select
                  value={coinData.paymentMethod}
                  onChange={(e) => setCoinData({ ...coinData, paymentMethod: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg text-white focus:outline-none transition-all"
                  style={{
                    background: 'rgba(20, 20, 20, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <option value="Admin">Admin</option>
                  <option value="JazzCash">JazzCash</option>
                  <option value="Easypaisa">Easypaisa</option>
                  <option value="PayPal">PayPal</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-2">Payment Reference (Optional)</label>
                <input
                  type="text"
                  value={coinData.paymentReference}
                  onChange={(e) => setCoinData({ ...coinData, paymentReference: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg text-white focus:outline-none transition-all"
                  style={{
                    background: 'rgba(20, 20, 20, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                  placeholder="Transaction ID or reference"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleCoinAdjustment}
                  className="flex-1 py-3 text-white rounded-lg font-semibold transition-all hover:opacity-90"
                  style={{
                    background: '#00BFFF',
                    boxShadow: '0 4px 12px rgba(0, 191, 255, 0.3)'
                  }}
                >
                  Confirm
                </button>
                <button
                  onClick={() => {
                    setShowCoinModal(false);
                    setCoinData({
                      amount: '',
                      type: 'credit',
                      description: '',
                      paymentMethod: 'Admin',
                      paymentReference: ''
                    });
                  }}
                  className="flex-1 py-3 text-white rounded-lg font-semibold transition-all hover:opacity-90"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;