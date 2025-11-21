import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Trophy,
  Coins,
  TrendingUp,
  Bell,
  Settings,
  MessageSquare,
  ArrowDownCircle,
  ArrowUpCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

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
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 ${isOpen ? 'w-80' : 'w-20'}`}
        style={{
          background: 'rgba(30, 30, 30, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.5)',
          transition: 'width 0.15s ease-out',
          willChange: 'width'
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header with Logo and Toggle */}
          <div
            className="relative border-b"
            style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
          >
            {/* Toggle Button - Top Right when OPENED */}
            {isOpen && (
              <button
                onClick={toggleSidebar}
                className="absolute top-4 right-4 p-2 rounded-lg hover:scale-110"
                style={{
                  background: 'rgba(0, 191, 255, 0.15)',
                  border: '1px solid rgba(0, 191, 255, 0.3)',
                  transition: 'transform 0.15s ease-in-out'
                }}
              >
                <ChevronLeft className="text-cyan-400" size={20} />
              </button>
            )}

            {/* Logo Section */}
            <div className={`${isOpen ? 'pt-6 pb-4 px-6' : 'pt-6 pb-4 px-4'}`}>
              <div className="flex items-center justify-center mb-2">
                <h1
                  className={`font-black tracking-tight ${isOpen ? 'text-4xl' : 'text-2xl'}`}
                  style={{
                    color: '#00BFFF',
                    transition: 'font-size 0.15s ease-out'
                  }}
                >
                  {isOpen ? 'ArenaX' : 'AX'}
                </h1>
              </div>
              {isOpen && (
                <p className="text-sm font-medium text-gray-400 text-center">
                  Admin Panel
                </p>
              )}
            </div>

            {/* Toggle Button - Under title when CLOSED */}
            {!isOpen && (
              <div className="pb-4 px-4">
                <button
                  onClick={toggleSidebar}
                  className="w-full p-2 rounded-lg hover:scale-110 flex items-center justify-center"
                  style={{
                    background: 'rgba(0, 191, 255, 0.15)',
                    border: '1px solid rgba(0, 191, 255, 0.3)',
                    transition: 'transform 0.15s ease-in-out'
                  }}
                >
                  <ChevronRight className="text-cyan-400" size={20} />
                </button>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <div
                key={item.path}
                className="relative"
                onMouseEnter={() => !isOpen && setHoveredItem(item.path)}
                onMouseLeave={() => !isOpen && setHoveredItem(null)}
              >
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center ${isOpen ? 'space-x-3 px-4' : 'justify-center px-2'} py-3 rounded-xl ${isActive ? 'active-link' : 'inactive-link'
                    }`
                  }
                  style={({ isActive }) => ({
                    background: isActive ? 'rgba(0, 191, 255, 0.15)' : 'transparent',
                    border: isActive ? '1px solid rgba(0, 191, 255, 0.3)' : '1px solid transparent',
                    transition: 'background 0.15s ease-out, border 0.15s ease-out'
                  })}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        size={20}
                        className={isActive ? 'text-cyan-400' : 'text-gray-400'}
                      />
                      {isOpen && (
                        <span
                          className={`font-medium text-sm whitespace-nowrap ${isActive ? 'text-white' : 'text-gray-400'
                            }`}
                        >
                          {item.label}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>

                {/* Tooltip for collapsed state */}
                {!isOpen && hoveredItem === item.path && (
                  <div
                    className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 rounded-lg whitespace-nowrap z-50 pointer-events-none animate-fade-in"
                    style={{
                      background: 'rgba(30, 30, 30, 0.95)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(0, 191, 255, 0.3)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
                    }}
                  >
                    <span className="text-sm font-medium text-white">{item.label}</span>
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </aside>

      <style>{`
        .inactive-link:hover {
          background: rgba(255, 255, 255, 0.05) !important;
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateX(-4px) translateY(-50%);
          }
          to {
            opacity: 1;
            transform: translateX(0) translateY(-50%);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.15s ease-out;
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

        /* Performance optimization */
        aside {
          contain: layout style paint;
          transform: translateZ(0);
          backface-visibility: hidden;
        }

        /* Disable transitions during resize */
        .resizing * {
          transition: none !important;
        }
      `}</style>
    </>
  );
};

export default Sidebar;