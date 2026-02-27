
import React from 'react';
import { APP_NAME, Icons } from '../constants';
import { User, UserRole } from '../types';

import logo from '../logo.png';

interface LayoutProps {
  user: User | null;
  onLogout: () => void;
  children: React.ReactNode;
  activeTab?: 'dashboard' | 'users' | 'logs' | 'tasks';
  onTabChange?: (tab: 'dashboard' | 'users' | 'logs' | 'tasks') => void;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, children, activeTab, onTabChange }) => {
  return (
    <div className="min-h-screen flex flex-col bg-bg text-primary">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-bg z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <img src={logo} alt={APP_NAME} className="h-10 w-auto" />

            {user && (
              <nav className="flex items-center space-x-1">
                <button
                  onClick={() => onTabChange?.('dashboard')}
                  className={`px-3 md:px-4 py-2 text-[10px] md:text-sm font-semibold rounded-md transition-colors ${activeTab === 'dashboard' ? 'text-accent bg-muted' : 'text-primary hover:bg-muted'
                    }`}
                >
                  Dashboard
                </button>

                {user.role === UserRole.ADMIN && (
                  <button
                    onClick={() => onTabChange?.('users')}
                    className={`px-3 md:px-4 py-2 text-[10px] md:text-sm font-semibold rounded-md transition-colors ${activeTab === 'users' ? 'text-accent bg-muted' : 'text-primary hover:bg-muted'
                      }`}
                  >
                    Users
                  </button>
                )}
                <button
                  onClick={() => onTabChange?.('tasks')}
                  className={`px-3 md:px-4 py-2 text-[10px] md:text-sm font-semibold rounded-md transition-colors ${activeTab === 'tasks' ? 'text-accent bg-muted' : 'text-primary hover:bg-muted'
                    }`}
                >
                  Tasks
                </button>
              </nav>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold leading-none">{user.name}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">{user.role}</p>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 hover:bg-muted rounded-full transition-colors text-gray-400 hover:text-accent"
                  title="Logout"
                >
                  <Icons.LogOut />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center text-[10px] uppercase tracking-widest text-gray-600">
          <span>Myntmore Internal Ops</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
