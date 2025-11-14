import React, { useEffect, useState } from 'react';
import { Bell, Plus, Send, Trash2, X, AlertTriangle, Link as LinkIcon } from 'lucide-react';
import { notificationAPI } from '../services/api';

// Delete Modal Component
const DeleteModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)'
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-w-md w-full rounded-xl overflow-hidden"
        style={{
          background: 'rgba(30, 30, 30, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div className="p-6 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="p-2 rounded-lg"
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                }}
              >
                <AlertTriangle size={24} style={{ color: '#EF4444' }} />
              </div>
              <h3 className="text-xl font-bold text-white">Confirm Delete</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-all"
              style={{
                background: 'rgba(156, 163, 175, 0.2)',
                border: '1px solid rgba(156, 163, 175, 0.3)',
                color: '#9CA3AF'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div 
            className="p-4 rounded-xl"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}
          >
            <p className="text-white font-bold text-lg mb-2">{title}</p>
            <p className="text-gray-300 text-sm leading-relaxed">{message}</p>
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              onClick={onConfirm}
              className="flex-1 py-3 rounded-xl font-bold text-white transition-all"
              style={{
                background: '#EF4444',
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)'
              }}
            >
              Delete
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold text-white transition-all"
              style={{
                background: 'rgba(30, 30, 30, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<{ id: string; title: string } | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'announcement',
    targetAudience: 'all',
    isScheduled: false,
    scheduledFor: '',
    link: '' // NEW: Link field
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationAPI.getAll();
      setNotifications(response.data.notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      // Only send link if it's not empty
      const dataToSend = {
        ...formData,
        link: formData.link.trim() || undefined
      };
      
      await notificationAPI.create(dataToSend);
      setShowModal(false);
      setFormData({
        title: '',
        message: '',
        type: 'announcement',
        targetAudience: 'all',
        isScheduled: false,
        scheduledFor: '',
        link: ''
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  const handleSend = async (id: string) => {
    try {
      await notificationAPI.send(id);
      fetchNotifications();
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const handleDeleteClick = (id: string, title: string) => {
    setNotificationToDelete({ id, title });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (notificationToDelete) {
      try {
        await notificationAPI.delete(notificationToDelete.id);
        fetchNotifications();
      } catch (error) {
        console.error('Error deleting notification:', error);
      } finally {
        setShowDeleteModal(false);
        setNotificationToDelete(null);
      }
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setNotificationToDelete(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return {
          bg: 'rgba(16, 185, 129, 0.2)',
          text: '#10B981',
          border: 'rgba(16, 185, 129, 0.3)'
        };
      case 'scheduled':
        return {
          bg: 'rgba(251, 191, 36, 0.2)',
          text: '#FBBF24',
          border: 'rgba(251, 191, 36, 0.3)'
        };
      default:
        return {
          bg: 'rgba(156, 163, 175, 0.2)',
          text: '#9CA3AF',
          border: 'rgba(156, 163, 175, 0.3)'
        };
    }
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Notifications</h1>
          <p className="text-gray-400">Broadcast messages to users</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 rounded-xl font-bold text-white transition-all flex items-center space-x-2"
          style={{
            background: '#00BFFF',
            boxShadow: '0 4px 12px rgba(0, 191, 255, 0.3)'
          }}
        >
          <Plus size={20} />
          <span>Create Notification</span>
        </button>
      </div>

      {/* Notifications List */}
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
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell size={48} className="mx-auto mb-4" style={{ color: '#888888' }} />
              <p className="text-gray-400 text-lg">No notifications</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => {
              const statusColors = getStatusColor(notification.status);
              return (
                <div
                  key={notification._id}
                  className="rounded-xl p-5 flex items-start justify-between"
                  style={{
                    background: 'rgba(20, 20, 20, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div 
                        className="p-2 rounded-lg"
                        style={{
                          background: '#00BFFF',
                          boxShadow: '0 0 15px rgba(0, 191, 255, 0.3)'
                        }}
                      >
                        <Bell size={16} className="text-white" />
                      </div>
                      <h4 className="text-white font-bold text-lg">{notification.title}</h4>
                      <span 
                        className="px-3 py-1 rounded-lg text-xs font-bold"
                        style={{
                          backgroundColor: statusColors.bg,
                          color: statusColors.text,
                          border: `1px solid ${statusColors.border}`
                        }}
                      >
                        {notification.status}
                      </span>
                      {/* NEW: Show link indicator */}
                      {notification.link && (
                        <span 
                          className="px-3 py-1 rounded-lg text-xs font-bold flex items-center space-x-1"
                          style={{
                            backgroundColor: 'rgba(59, 130, 246, 0.2)',
                            color: '#3B82F6',
                            border: '1px solid rgba(59, 130, 246, 0.3)'
                          }}
                        >
                          <LinkIcon size={12} />
                          <span>Has Link</span>
                        </span>
                      )}
                    </div>
                    <p className="text-gray-300 text-sm mb-3 leading-relaxed">{notification.message}</p>
                    {/* NEW: Show link if exists */}
                    {notification.link && (
                      <div 
                        className="mb-3 p-2 rounded-lg"
                        style={{
                          background: 'rgba(59, 130, 246, 0.1)',
                          border: '1px solid rgba(59, 130, 246, 0.2)'
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <LinkIcon size={14} className="text-blue-400 flex-shrink-0" />
                          <a 
                            href={notification.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 text-xs hover:underline truncate"
                          >
                            {notification.link}
                          </a>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center space-x-6 text-xs font-medium">
                      <span className="text-blue-400">Type: {notification.type}</span>
                      <span className="text-purple-400">Audience: {notification.targetAudience}</span>
                      <span className="text-gray-400">{new Date(notification.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {notification.status === 'draft' && (
                      <button
                        onClick={() => handleSend(notification._id)}
                        className="p-2 rounded-lg transition-all"
                        style={{
                          background: 'rgba(16, 185, 129, 0.2)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          color: '#10B981'
                        }}
                        title="Send"
                      >
                        <Send size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteClick(notification._id, notification.title)}
                      className="p-2 rounded-lg transition-all"
                      style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#EF4444'
                      }}
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>
      </div>

      {/* Create Notification Modal */}
      {showModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div
            className="max-w-md w-full rounded-xl overflow-hidden"
            style={{
              background: 'rgba(30, 30, 30, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
              <h3 className="text-xl font-bold text-white">Create Notification</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg transition-all"
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#EF4444'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-gray-300 text-sm font-bold mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg text-white focus:outline-none transition-all"
                  style={{
                    background: 'rgba(20, 20, 20, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)'
                  }}
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-bold mb-2">Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg text-white focus:outline-none transition-all resize-none"
                  style={{
                    background: 'rgba(20, 20, 20, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)'
                  }}
                  rows={4}
                />
              </div>

              {/* NEW: Link field */}
              <div>
                <label className="block text-gray-300 text-sm font-bold mb-2 flex items-center space-x-2">
                  <LinkIcon size={16} />
                  <span>Link (Optional)</span>
                </label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="https://example.com or app://tournament/123"
                  className="w-full px-4 py-3 rounded-lg text-white focus:outline-none transition-all"
                  style={{
                    background: 'rgba(20, 20, 20, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)'
                  }}
                />
                <p className="text-gray-500 text-xs mt-1">
                  Add a URL or deep link where users will be directed when they tap this notification
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-bold mb-2">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg text-white focus:outline-none transition-all"
                    style={{
                      background: 'rgba(20, 20, 20, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <option value="announcement">Announcement</option>
                    <option value="tournament">Tournament</option>
                    <option value="reward">Reward</option>
                    <option value="system">System</option>
                    <option value="warning">Warning</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-bold mb-2">Audience</label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg text-white focus:outline-none transition-all"
                    style={{
                      background: 'rgba(20, 20, 20, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <option value="all">All Users</option>
                    <option value="players">Players Only</option>
                    <option value="organizers">Organizers Only</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleCreate}
                  className="flex-1 py-3 rounded-xl font-bold text-white transition-all"
                  style={{
                    background: '#00BFFF',
                    boxShadow: '0 4px 12px rgba(0, 191, 255, 0.3)'
                  }}
                >
                  Create
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-white transition-all"
                  style={{
                    background: 'rgba(30, 30, 30, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={notificationToDelete?.title || ''}
        message="Are you sure you want to delete this notification? This action cannot be undone."
      />

      <style>{`
        select option {
          background: #1E1E1E;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default Notifications;