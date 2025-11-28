
import React, { useState, useEffect } from 'react';
import { LoginFlow } from './components/LoginFlow';
import { Dashboard } from './components/Dashboard';
import { InstallPrompt } from './components/InstallPrompt';
import { User } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for persisted user session on mount
    const storedUser = localStorage.getItem('friends_fund_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user", e);
        localStorage.removeItem('friends_fund_user');
      }
    }
    setIsLoading(false);
  }, []);

  const handleLoginSuccess = (loggedInUser: User) => {
    localStorage.setItem('friends_fund_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('friends_fund_user');
    setUser(null);
  };

  if (isLoading) {
      return (
        <div className="min-h-screen bg-nova-900 flex items-center justify-center">
             <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
  }

  return (
    <div className="font-sans antialiased text-slate-900 dark:text-slate-50">
      {user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <LoginFlow onSuccess={handleLoginSuccess} />
      )}
      <InstallPrompt />
    </div>
  );
};

export default App;