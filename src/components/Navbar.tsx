import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, User, X } from 'lucide-react';
import { io } from 'socket.io-client';
import { adminNotificationAPI } from '../services/api';

interface Notification {
    _id?: string;
    id?: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    relatedUser?: {
        _id: string;
        username: string;
        email?: string;
    };
}

interface NavbarProps {
    sidebarOpen: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ sidebarOpen }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const socketRef = useRef<any>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const notificationAudioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const userData = JSON.parse(userStr);
                setUser(userData);
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
            auth: { token }
        });

        socketRef.current = socket;

        socket.on('admin_notification', (notification: Notification) => {
            console.log('Received admin notification:', notification);

            // Ensure notification is marked as unread
            const newNotification = { ...notification, isRead: false };

            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Play notification sound
            if (notificationAudioRef.current) {
                notificationAudioRef.current.play().catch(error => {
                    console.log('Could not play notification sound:', error);
                });
            }

            // Show browser notification if permitted
            if (Notification.permission === 'granted') {
                new Notification(notification.title, {
                    body: notification.message,
                    icon: '/logo.png'
                });
            }
        });

        socket.on('connect', () => console.log('Socket.IO connected'));
        socket.on('disconnect', () => console.log('Socket.IO disconnected'));

        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    useEffect(() => {
        fetchNotifications();
        fetchUnreadCount();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await adminNotificationAPI.getAll({ limit: 10 });
            if (response.data.success) {
                setNotifications(response.data.notifications);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const response = await adminNotificationAPI.getCount();
            if (response.data.success) {
                setUnreadCount(response.data.count);
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            await adminNotificationAPI.markAsRead(notificationId);

            setNotifications(prev =>
                prev.map(n => n._id === notificationId || n.id === notificationId ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (socketRef.current) {
            socketRef.current.disconnect();
        }
        navigate('/login');
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'user_registered': return '👤';
            case 'tournament_joined': return '🎮';
            case 'deposit_created': return '💰';
            case 'withdrawal_created': return '💸';
            default: return '🔔';
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <nav
            className="fixed top-0 right-0 h-[88px] z-30 flex items-center px-8"
            style={{
                left: sidebarOpen ? '320px' : '80px',
                background: 'rgba(30, 30, 30, 0.95)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                transition: 'left 0.15s ease-out'
            }}
        >
            <div className="flex justify-between items-center w-full max-w-[1600px] mx-auto">
                <div>
                    <h2 className="text-2xl font-bold text-gray-200">ArenaX Admin</h2>
                </div>

                <div className="flex items-center gap-6">
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative p-3 rounded-lg transition-all duration-300 hover:scale-105"
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}
                        >
                            <Bell size={20} className="text-gray-300" />
                            {unreadCount > 0 && (
                                <span
                                    className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center text-xs font-bold text-white rounded-full px-1.5 animate-pulse"
                                    style={{
                                        background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                                        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
                                    }}
                                >
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {showNotifications && (
                            <div
                                className="absolute top-[calc(100%+10px)] right-0 w-[380px] max-h-[500px] rounded-2xl overflow-hidden animate-slideDown"
                                style={{
                                    background: 'rgba(30, 30, 30, 0.98)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                                    backdropFilter: 'blur(20px)'
                                }}
                            >
                                <div
                                    className="flex justify-between items-center px-5 py-4"
                                    style={{
                                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                        background: 'rgba(255, 255, 255, 0.03)'
                                    }}
                                >
                                    <h3 className="text-lg font-semibold text-gray-200">Notifications</h3>
                                    <button
                                        onClick={() => setShowNotifications(false)}
                                        className="p-1 rounded hover:bg-red-500/20 transition-colors"
                                    >
                                        <X size={18} className="text-gray-400 hover:text-red-400" />
                                    </button>
                                </div>

                                <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
                                    {notifications.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 px-4 text-gray-500">
                                            <Bell size={40} className="mb-4 opacity-50" />
                                            <p className="text-sm">No notifications yet</p>
                                        </div>
                                    ) : (
                                        notifications.map((notification) => (
                                            <div
                                                key={notification._id || notification.id}
                                                onClick={() => !notification.isRead && markAsRead(notification._id || notification.id || '')}
                                                className={`flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors relative ${!notification.isRead ? 'bg-white/8' : ''
                                                    } hover:bg-white/5`}
                                                style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}
                                            >
                                                <div
                                                    className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-xl rounded-lg"
                                                    style={{
                                                        background: 'rgba(255, 255, 255, 0.05)',
                                                        border: '1px solid rgba(255, 255, 255, 0.1)'
                                                    }}
                                                >
                                                    {getNotificationIcon(notification.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-semibold text-gray-200 mb-1">
                                                        {notification.title}
                                                    </h4>
                                                    <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <span className="text-xs text-gray-500">
                                                        {formatTime(notification.createdAt)}
                                                    </span>
                                                </div>
                                                {!notification.isRead && (
                                                    <div
                                                        className="absolute top-5 right-5 w-2 h-2 rounded-full"
                                                        style={{
                                                            background: '#3B82F6',
                                                            boxShadow: '0 0 8px rgba(59, 130, 246, 0.6)'
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div
                        className="flex items-center gap-2 px-4 py-2 rounded-lg"
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                    >
                        <User size={18} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-300">{user?.username || 'Admin'}</span>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105"
                        style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            boxShadow: '0 0 0 rgba(239, 68, 68, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                            e.currentTarget.style.borderColor = '#EF4444';
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                            e.currentTarget.style.boxShadow = '0 0 0 rgba(239, 68, 68, 0.3)';
                        }}
                    >
                        <LogOut size={18} className="text-red-300" />
                        <span className="text-sm font-medium text-red-300">Logout</span>
                    </button>
                </div>
            </div>

            {/* Hidden audio element for notification sound */}
            <audio ref={notificationAudioRef} src="/notification.mp3" preload="auto" />

            <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
        </nav>
    );
};

export default Navbar;
