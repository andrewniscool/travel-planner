import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import { TripWorkspaceProvider } from '../../hooks/TripWorkspaceProvider';
import { useLocalStorage } from '../../hooks/useLocalStorage';

const SIDEBAR_WIDTH_ANIMATION_DURATION = 'lg:duration-300';
const SIDEBAR_COLLAPSED_STORAGE_KEY = 'travel-builder:sidebar-collapsed';

const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage(
    SIDEBAR_COLLAPSED_STORAGE_KEY,
    false,
  );

  const handleMenuClick = () => {
    setSidebarOpen(true);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  return (
    <TripWorkspaceProvider>
      <div className="flex h-screen bg-app-bg">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={handleSidebarClose}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:z-auto lg:transition-[width] ${SIDEBAR_WIDTH_ANIMATION_DURATION} lg:ease-in-out flex-shrink-0 ${
            sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
          } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <Sidebar
            isCollapsed={sidebarCollapsed}
            onClose={handleSidebarClose}
            onToggleCollapse={() => setSidebarCollapsed((collapsed) => !collapsed)}
          />
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-auto">
          <TopNav onMenuClick={handleMenuClick} />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </TripWorkspaceProvider>
  );
};

export default AppLayout;
