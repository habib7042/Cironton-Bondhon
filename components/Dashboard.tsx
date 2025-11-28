

import React, { useState, useEffect, useRef } from 'react';
import { User, Transaction } from '../types';
import { ArrowUpRight, ArrowDownLeft, PieChart, Search, Bell, ChevronRight, Users, TrendingUp, Clock, ShieldCheck, LayoutDashboard, Loader2, Send, IdCard, Wallet, FileText, UserCog, Camera } from 'lucide-react';
import { AiAssistant } from './AiAssistant';
import { BankCard } from './BankCard';
import { ActionModal } from './ActionModal';
import { AdminPanel } from './AdminPanel';
import { FeatureModal } from './FeatureModal';
import { api } from '../services/api';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user: initialUser, onLogout }) => {
  const [user, setUser] = useState(initialUser);
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalFund, setTotalFund] = useState(0); 
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [modalConfig, setModalConfig] = useState<{isOpen: boolean, type: 'deposit' | 'withdraw' | 'transfer'}>({
    isOpen: false,
    type: 'deposit'
  });
  const [featureModal, setFeatureModal] = useState<'growth' | 'split' | 'history' | 'rules' | 'id_card' | 'balance_mgmt' | 'reports' | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminTabOverride, setAdminTabOverride] = useState<'REQUESTS' | 'MEMBERS'>('REQUESTS');

  // REAL-TIME UPDATE LOGIC
  useEffect(() => {
    fetchData();
    const intervalId = setInterval(() => {
        if (user.token && !showAdminPanel) {
            fetchData(true);
        }
    }, 5000);
    return () => clearInterval(intervalId);
  }, [user.token, showAdminPanel]);

  const fetchData = async (isBackground = false) => {
      if (!user.token) {
          setIsLoading(false);
          return;
      }
      
      if (!isBackground && transactions.length === 0) setIsLoading(true);
      
      try {
          const data = await api.getDashboardData(user.token);
          
          setUser(prev => ({ ...prev, balance: parseFloat(data.balance) }));
          setTotalFund(data.totalGroupBalance || 0);
          
          if (Array.isArray(data.transactions)) {
            const mappedTransactions: Transaction[] = data.transactions.map((t: any) => ({
                id: t.id.toString(),
                merchant: t.transaction_type === 'DEPOSIT' ? 'Deposit Request' : 
                          t.transaction_type === 'TRANSFER' ? (t.recipientPhone ? `Sent to ${t.recipientPhone}` : 'Money Transfer') :
                          'Withdrawal Request',
                amount: parseFloat(t.amount),
                date: new Date(t.created_at).toLocaleDateString(),
                category: t.transaction_type === 'DEPOSIT' ? 'income' : 
                          t.transaction_type === 'TRANSFER' ? 'travel' : 'utilities',
                type: t.transaction_type === 'DEPOSIT' ? 'credit' : 'debit',
                status: t.status,
                transaction_type: t.transaction_type,
                recipientPhone: t.recipientPhone
             }));
             setTransactions(mappedTransactions);
          }
      } catch (e) {
          console.error("Error loading dashboard", e);
      } finally {
          if (!isBackground) setIsLoading(false);
      }
  };

  const handleTransaction = async (amount: number, recipient?: string, pin?: string) => {
    if (!user.token) return;
    try {
        if (modalConfig.type === 'transfer') {
            if (!recipient || !pin) throw new Error("Missing info");
            await api.transferMoney(user.token, recipient, amount, pin);
            alert("Money Sent Successfully!");
        } else {
            const type = modalConfig.type === 'deposit' ? 'DEPOSIT' : 'WITHDRAW';
            await api.createTransaction(user.token, type, amount);
        }
        await fetchData();
    } catch (e: any) {
        throw e;
    }
  };

  const handleAdminGridClick = (action: string) => {
      if (action === 'member_mgmt') {
          setAdminTabOverride('MEMBERS');
          setShowAdminPanel(true);
      } else if (action === 'balance_mgmt') {
          setFeatureModal('balance_mgmt');
      } else if (action === 'id_card') {
          setFeatureModal('id_card');
      } else if (action === 'reports') {
          setFeatureModal('reports'); 
      }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && user.token) {
        const file = e.target.files[0];
        // Basic check
        if (file.size > 4 * 1024 * 1024) {
            alert("File is too large. Max 4MB.");
            return;
        }

        setIsUploading(true);
        try {
            const result = await api.uploadAvatar(user.token, file);
            // Update local user state immediately
            setUser(prev => ({ ...prev, profileImage: result.url }));
            alert("Profile photo updated successfully!");
        } catch (error) {
            alert("Failed to upload photo. Please try again.");
        } finally {
            setIsUploading(false);
        }
    }
  };

  if (showAdminPanel) {
      return (
          <div className="relative">
              <div className="sticky top-0 z-40 bg-nova-900/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex justify-between items-center">
                  <button onClick={() => setShowAdminPanel(false)} className="flex items-center gap-2 text-slate-300 hover:text-white">
                      <LayoutDashboard size={20} />
                      <span className="font-medium">Back to Dashboard</span>
                  </button>
                  <button onClick={onLogout} className="text-xs font-medium text-slate-400 hover:text-white border border-white/10 rounded-lg px-2 py-1">
                    Sign Out
                  </button>
              </div>
              <AdminPanel user={user} initialTab={adminTabOverride} />
          </div>
      )
  }

  if (isLoading) {
      return (
          <div className="min-h-screen bg-nova-900 flex flex-col items-center justify-center">
              <Loader2 size={48} className="text-emerald-500 animate-spin mb-4" />
              <p className="text-slate-400 text-sm">Syncing Fund Data...</p>
          </div>
      );
  }

  const totalMembers = 12; // Keep static or fetch from API if needed

  const contextForAi = `
    User: ${user.name}
    My Contribution: ৳${user.balance.toLocaleString()}
    Group Fund Total: ৳${totalFund.toLocaleString()}
    Total Members: ${totalMembers}
    Recent Activity: ${transactions.map(t => `${t.merchant} (${t.status})`).join(', ')}
  `;

  const userActions = [
    { icon: TrendingUp, label: 'Growth', id: 'growth' },
    { icon: PieChart, label: 'Split', id: 'split' },
    { icon: Search, label: 'History', id: 'history' },
    { icon: ChevronRight, label: 'Rules', id: 'rules' },
  ];

  const adminActions = [
    { icon: UserCog, label: 'Members', id: 'member_mgmt', desc: 'Manage Users' },
    { icon: Wallet, label: 'Balances', id: 'balance_mgmt', desc: 'Fund Overview' },
    { icon: IdCard, label: 'ID Cards', id: 'id_card', desc: 'Generate IDs' },
  ];

  return (
    <div className="min-h-screen bg-nova-900 pb-20 animate-fade-in">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-nova-900/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
            <div 
                onClick={handleAvatarClick}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-emerald-500/20 cursor-pointer overflow-hidden relative group"
            >
                {user.profileImage ? (
                    <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    user.name.charAt(0)
                )}
                
                {/* Overlay for uploading */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {isUploading ? <Loader2 size={16} className="animate-spin text-white"/> : <Camera size={16} className="text-white" />}
                </div>
            </div>
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/png, image/jpeg, image/jpg"
            />
            
            <div>
                <h1 className="text-xs text-emerald-400 font-medium uppercase tracking-wider">চিরন্তন বন্ধন</h1>
                <p className="font-semibold text-white leading-tight">{user.name}</p>
            </div>
        </div>
        <div className="flex items-center gap-4">
            {user.isAdmin && (
                <button 
                    onClick={() => { setAdminTabOverride('REQUESTS'); setShowAdminPanel(true); }}
                    className="text-amber-400 hover:text-amber-300 transition-colors p-2 bg-amber-500/10 rounded-full border border-amber-500/20"
                    title="Admin Panel"
                >
                    <ShieldCheck size={20} />
                </button>
            )}
            <button onClick={onLogout} className="text-xs font-medium text-slate-400 hover:text-white border border-white/10 rounded-lg px-2 py-1">
                Sign Out
            </button>
        </div>
      </header>

      <main className="p-6 max-w-2xl mx-auto space-y-8">
        
        {/* Card Section */}
        <section className="animate-slide-up">
            <div className="mb-6">
                <BankCard user={user} totalFund={totalFund} />
            </div>

            {!user.isAdmin && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-nova-800/50 rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center text-center">
                        <span className="text-xs text-slate-400 mb-1">Total Group Fund</span>
                        <span className="text-lg font-bold text-emerald-400">৳{totalFund.toLocaleString()}</span>
                    </div>
                    <div className="bg-nova-800/50 rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center text-center">
                        <span className="text-xs text-slate-400 mb-1">Active Members</span>
                        <div className="flex items-center gap-1 text-lg font-bold text-white">
                            <Users size={16} className="text-emerald-500" />
                            <span>{totalMembers}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-3 gap-3">
                <button 
                    onClick={() => setModalConfig({isOpen: true, type: 'deposit'})}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-3 px-2 flex flex-col items-center justify-center gap-1 transition-all shadow-lg shadow-emerald-900/20 active:scale-[0.98]"
                >
                    <ArrowDownLeft size={20} />
                    <span className="text-xs font-semibold">Deposit</span>
                </button>
                 <button 
                    onClick={() => setModalConfig({isOpen: true, type: 'transfer'})}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 px-2 flex flex-col items-center justify-center gap-1 transition-all shadow-lg shadow-indigo-900/20 active:scale-[0.98]"
                >
                    <Send size={20} />
                    <span className="text-xs font-semibold">Send</span>
                </button>
                <button 
                    onClick={() => setModalConfig({isOpen: true, type: 'withdraw'})}
                    className="bg-nova-800 hover:bg-nova-700 border border-white/10 text-white rounded-xl py-3 px-2 flex flex-col items-center justify-center gap-1 transition-all active:scale-[0.98]"
                >
                    <ArrowUpRight size={20} />
                    <span className="text-xs font-semibold">Withdraw</span>
                </button>
            </div>
        </section>

        {/* Feature Grid - Conditional Rendering based on Role */}
        <section className="grid grid-cols-3 sm:grid-cols-4 gap-4">
            {user.isAdmin ? (
                adminActions.map((action, i) => (
                    <button 
                        key={i} 
                        onClick={() => handleAdminGridClick(action.id)}
                        className="flex flex-col items-center gap-3 group"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-nova-800 border border-nova-700 group-hover:border-emerald-500/30 group-hover:bg-nova-700 transition-all flex items-center justify-center text-emerald-400 shadow-lg">
                            <action.icon size={24} />
                        </div>
                        <div className="text-center">
                            <span className="text-xs font-medium text-white block">{action.label}</span>
                            <span className="text-[10px] text-slate-500">{action.desc}</span>
                        </div>
                    </button>
                ))
            ) : (
                userActions.map((action, i) => (
                    <button 
                        key={i} 
                        onClick={() => setFeatureModal(action.id as any)}
                        className="flex flex-col items-center gap-3 group"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-nova-800 border border-nova-700 group-hover:border-emerald-500/30 group-hover:bg-nova-700 transition-all flex items-center justify-center text-slate-300 group-hover:text-emerald-400 shadow-lg">
                            <action.icon size={24} />
                        </div>
                        <span className="text-xs font-medium text-slate-400 group-hover:text-white transition-colors">{action.label}</span>
                    </button>
                ))
            )}
        </section>

        {/* Transactions - LIVE UPDATING */}
        <section>
            <div className="flex justify-between items-end mb-4">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                    Requests & History 
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                </h3>
            </div>
            
            <div className="bg-nova-800/30 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-sm min-h-[200px]">
                {transactions.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">No transactions found</div>
                ) : (
                    transactions.map((t, i) => (
                        <div key={t.id} className={`p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer ${i !== transactions.length - 1 ? 'border-b border-white/5' : ''}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg relative ${
                                    t.transaction_type === 'DEPOSIT' ? 'bg-emerald-500/20 text-emerald-400' : 
                                    t.transaction_type === 'TRANSFER' ? 'bg-indigo-500/20 text-indigo-400' :
                                    'bg-rose-500/20 text-rose-400'
                                }`}>
                                    {t.transaction_type === 'DEPOSIT' ? <ArrowDownLeft size={18} /> : 
                                     t.transaction_type === 'TRANSFER' ? <Send size={16} /> :
                                     <ArrowUpRight size={18} />}
                                    {t.status === 'PENDING' && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                                            <Clock size={10} className="text-nova-900" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-medium text-white flex items-center gap-2">
                                        {t.merchant}
                                        {t.status === 'PENDING' && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">Pending</span>}
                                        {t.status === 'REJECTED' && <span className="text-[10px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded">Rejected</span>}
                                    </h4>
                                    <p className="text-xs text-slate-500">{t.date}</p>
                                </div>
                            </div>
                            <span className={`font-semibold ${
                                t.status === 'REJECTED' ? 'text-slate-500 line-through decoration-rose-500' :
                                t.transaction_type === 'DEPOSIT' ? 'text-emerald-400' : 'text-white'
                            }`}>
                                {t.transaction_type === 'DEPOSIT' ? '+' : '-'}৳{t.amount.toLocaleString()}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </section>
      </main>

      <AiAssistant mode="FINANCIAL_ADVISOR" contextData={contextForAi} />
      
      <ActionModal 
        isOpen={modalConfig.isOpen} 
        type={modalConfig.type} 
        onClose={() => setModalConfig(prev => ({...prev, isOpen: false}))}
        onSubmit={handleTransaction}
      />

      <FeatureModal 
        isOpen={!!featureModal}
        feature={featureModal}
        onClose={() => setFeatureModal(null)}
        transactions={transactions}
        user={user}
      />
    </div>
  );
};