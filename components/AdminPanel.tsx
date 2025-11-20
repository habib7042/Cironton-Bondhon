import React, { useEffect, useState } from 'react';
import { Transaction, User } from '../types';
import { Check, X, RefreshCw, ArrowDownLeft, ArrowUpRight, Shield } from 'lucide-react';
import { api } from '../services/api';

interface AdminPanelProps {
  user: User;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ user }) => {
  const [pendingTx, setPendingTx] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadPending = async () => {
    if (!user.token) return;
    setIsLoading(true);
    try {
      const data = await api.getPendingTransactions(user.token);
      // Map API data to proper structure if needed, though types.ts handles it mostly
      setPendingTx(data.map((t: any) => ({
          ...t,
          id: t.id.toString(),
          date: new Date(t.created_at).toLocaleDateString()
      })));
    } catch (error) {
      console.error("Failed to load admin data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleAction = async (id: string, action: 'APPROVE' | 'REJECT') => {
      if (!user.token) return;
      setProcessingId(id);
      try {
          await api.processTransaction(user.token, id, action);
          // Remove from list locally on success to feel snappy
          setPendingTx(prev => prev.filter(t => t.id !== id));
      } catch (error) {
          alert("Action failed");
      } finally {
          setProcessingId(null);
      }
  };

  return (
    <div className="min-h-screen bg-nova-900 p-6 pb-20 animate-fade-in">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/20 rounded-xl">
                    <Shield className="text-emerald-400" size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Admin Console</h2>
                    <p className="text-slate-400 text-sm">Manage fund requests</p>
                </div>
            </div>
            <button 
                onClick={loadPending}
                disabled={isLoading}
                className="p-2 rounded-lg bg-nova-800 hover:bg-nova-700 text-slate-300 transition-colors"
            >
                <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
            </button>
        </div>

        <div className="space-y-4">
            {pendingTx.length === 0 && !isLoading && (
                <div className="text-center py-12 bg-nova-800/30 rounded-3xl border border-dashed border-white/10">
                    <p className="text-slate-500">No pending requests found.</p>
                    <p className="text-xs text-slate-600 mt-1">All clear!</p>
                </div>
            )}

            {pendingTx.map((tx) => (
                <div key={tx.id} className="bg-nova-800 border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full ${tx.transaction_type === 'DEPOSIT' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                             {tx.transaction_type === 'DEPOSIT' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">
                                {tx.userName || 'Unknown User'}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <span className={`font-medium ${tx.transaction_type === 'DEPOSIT' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {tx.transaction_type}
                                </span>
                                <span>•</span>
                                <span>৳{tx.amount.toLocaleString()}</span>
                            </div>
                            <span className="text-xs text-slate-500 mt-1 block">{tx.date}</span>
                        </div>
                    </div>

                    <div className="flex gap-3 sm:w-auto w-full">
                        <button 
                            onClick={() => handleAction(tx.id, 'REJECT')}
                            disabled={processingId === tx.id}
                            className="flex-1 sm:flex-none py-2 px-4 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <X size={18} />
                            <span className="sm:hidden font-medium">Reject</span>
                        </button>
                        <button 
                            onClick={() => handleAction(tx.id, 'APPROVE')}
                            disabled={processingId === tx.id}
                            className="flex-1 sm:flex-none py-2 px-4 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                             {processingId === tx.id ? (
                                 <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                             ) : (
                                <Check size={18} />
                             )}
                             <span className="sm:hidden font-medium">Approve</span>
                        </button>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};
