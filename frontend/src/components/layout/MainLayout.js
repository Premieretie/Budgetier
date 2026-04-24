import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useCosmeticStore } from '../../hooks/useCosmeticStore';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { getTheme } = useCosmeticStore();
  const theme = getTheme();

  return (
    <div
      className={`min-h-screen ${theme.pageBg} dark:bg-gray-900 transition-colors duration-500`}
      style={{
        '--theme-primary':       theme.primary,
        '--theme-primary-light': theme.primaryLight,
        '--theme-primary-text':  theme.primaryText,
        '--theme-accent':        theme.accent,
        '--theme-hull':          theme.hullFill,
        '--theme-sail':          theme.sailFill,
        '--theme-mast':          theme.mastFill,
        '--theme-water':         theme.waterFill,
        ...theme.pageBgStyle,
      }}
    >
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="lg:pl-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
