import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if user has already dismissed it in this session
      if (!sessionStorage.getItem('pwa_prompt_dismissed')) {
          setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
    setIsVisible(false);
  };

  const handleDismiss = () => {
      setIsVisible(false);
      sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[60] animate-slide-up sm:left-auto sm:right-6 sm:w-80">
      <div className="bg-nova-800 border border-emerald-500/30 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
        
        <div className="flex justify-between items-start">
            <div>
                <h3 className="text-white font-bold text-sm">Install App</h3>
                <p className="text-slate-400 text-xs mt-1">Add "চিরন্তন বন্ধন" to your home screen for quick access.</p>
            </div>
            <button onClick={handleDismiss} className="text-slate-500 hover:text-white p-1">
                <X size={16} />
            </button>
        </div>

        <button 
            onClick={handleInstall}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
        >
            <Download size={16} /> Install Now
        </button>
      </div>
    </div>
  );
};