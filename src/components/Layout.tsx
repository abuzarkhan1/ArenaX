import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen" style={{ background: '#121212' }}>
      {/* Main Content */}
      <div className="flex min-h-screen">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 lg:ml-0">
          {/* Content Area */}
          <div className="relative">
            <Outlet />
          </div>
        </main>
      </div>

      <style>{`
        /* Smooth transitions */
        * {
          transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow, transform;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 150ms;
        }

        /* Prevent layout shift on mobile */
        @media (max-width: 1024px) {
          main {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;