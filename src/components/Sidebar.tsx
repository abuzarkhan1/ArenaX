import React from 'react';
import { NavLink } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Trophy,
  Coins,
  TrendingUp,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  MessageSquare,
  ArrowDownCircle,
  ArrowUpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const { logout, admin } = useAuth();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/users', icon: Users, label: 'Users' },
    { path: '/tournaments', icon: Trophy, label: 'Tournaments' },
    { path: '/messages', icon: MessageSquare, label: 'Messages' },
    { path: '/deposits', icon: ArrowDownCircle, label: 'Deposits' },
    { path: '/withdrawals', icon: ArrowUpCircle, label: 'Withdrawals' },
    { path: '/wallet', icon: Coins, label: 'Wallet' },
    { path: '/reports', icon: TrendingUp, label: 'Reports' },
    { path: '/notifications', icon: Bell, label: 'Notifications' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-5 left-5 z-50 p-3 rounded-xl"
        style={{
          background: 'rgba(30, 30, 30, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <X className="text-white" size={24} />
          ) : (
            <Menu className="text-white" size={24} />
          )}
        </AnimatePresence>
      </button>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-80 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{
          background: 'rgba(30, 30, 30, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-6 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
            <div className="flex items-center justify-center mb-2">
              <h1 className="text-4xl font-black tracking-tight" style={{ color: '#00BFFF' }}>
                ArenaX
              </h1>
            </div>
            <p className="text-sm font-medium text-gray-400 text-center">Admin Panel</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                    isActive ? 'active-link' : 'inactive-link'
                  }`
                }
                style={({ isActive }) => ({
                  background: isActive ? 'rgba(0, 191, 255, 0.15)' : 'transparent',
                  border: isActive ? '1px solid rgba(0, 191, 255, 0.3)' : '1px solid transparent',
                })}
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      size={20}
                      className={isActive ? 'text-cyan-400' : 'text-gray-400'}
                    />
                    <span
                      className={`font-medium text-sm ${
                        isActive ? 'text-white' : 'text-gray-400'
                      }`}
                    >
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
            <div
              className="p-4 rounded-xl mb-3"
              style={{
                background: 'rgba(0, 191, 255, 0.1)',
                border: '1px solid rgba(0, 191, 255, 0.2)'
              }}
            >
              <p className="text-xs text-gray-400 mb-1">Logged in as</p>
              <p className="text-white font-bold">{admin?.username}</p>
              <p className="text-xs text-cyan-400 mt-1">{admin?.role}</p>
            </div>

            <button
              onClick={logout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl transition-all"
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#EF4444'
              }}
            >
              <LogOut size={18} />
              <span className="font-medium text-sm">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      <style>{`
        .inactive-link:hover {
          background: rgba(255, 255, 255, 0.05) !important;
        }

        /* Custom Scrollbar */
        nav::-webkit-scrollbar {
          width: 6px;
        }

        nav::-webkit-scrollbar-track {
          background: transparent;
        }

        nav::-webkit-scrollbar-thumb {
          background: rgba(0, 191, 255, 0.3);
          border-radius: 3px;
        }

        nav::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 191, 255, 0.5);
        }
      `}</style>
    </>
  );
};

export default Sidebar;