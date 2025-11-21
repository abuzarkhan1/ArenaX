import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="min-h-screen" style={{ background: '#121212' }}>
            <div className="flex min-h-screen">
                {/* Sidebar */}
                <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

                {/* Navbar */}
                <Navbar sidebarOpen={sidebarOpen} />

                {/* Main Content */}
                <main
                    className="flex-1 transition-all duration-150"
                    style={{
                        marginLeft: sidebarOpen ? '320px' : '80px',
                        marginTop: '88px',
                        minHeight: 'calc(100vh - 88px)'
                    }}
                >
                    <Outlet />
                </main>
            </div>

            <style>{`
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
