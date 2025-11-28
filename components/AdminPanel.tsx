
import React, { useEffect, useState } from 'react';
import { Transaction, User, MemberFormData } from '../types';
import { Check, X, RefreshCw, ArrowDownLeft, ArrowUpRight, Shield, UserPlus, Save, LayoutList, ChevronDown, ChevronUp, User as UserIcon, Smartphone, Calendar, MapPin, FileText, Loader2, DollarSign } from 'lucide-react';
import { api } from '../services/api';
import { Button } from './Button';

interface AdminPanelProps {
  user: User;
  initialTab?: 'REQUESTS' | 'MEMBERS';
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ user, initialTab = 'REQUESTS' }) => {
  const [activeTab, setActiveTab] = useState<'REQUESTS' | 'MEMBERS'>(initialTab);
  
  // Request State
  const [pendingTx, setPendingTx] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Member State
  const [members, setMembers] = useState<any[]>([]);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const [formData, setFormData] = useState<MemberFormData>({
      name: '', fatherName: '', motherName: '', nid: '', dob: '', 
      phoneNumber: '', email: '', address: '', nomineeName: '', nomineeNid: ''
  });
  
  // Deposit State
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);

  const loadPending = async () => {
    if (!user.token) return;
    setIsLoading(true);
    try {
      const data = await api.getPendingTransactions(user.token);
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

  const loadMembers = async () => {
    if (!user.token) return;
    setIsLoading(true);
    try {
        const data = await api.getMembers(user.token);
        setMembers(data);
    } catch (error) {
        console.error("Failed to load members", error);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'REQUESTS') loadPending();
    if (activeTab === 'MEMBERS') loadMembers();
  }, [activeTab]);

  const handleAction = async (id: string, action: 'APPROVE' | 'REJECT') => {
      if (!user.token) return;
      setProcessingId(id);
      try {
          await api.processTransaction(user.token, id, action);
          setPendingTx(prev => prev.filter(t => t.id !== id));
      } catch (error) {
          alert("Action failed");
      } finally {
          setProcessingId(null);
      }
  };

  const handleMemberSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user.token) return;
      setFormLoading(true);
      try {
          await api.addMember(user.token, formData);
          alert('Member added successfully! Default PIN: 1234');
          setIsAddingMember(false);
          setFormData({
            name: '', fatherName: '', motherName: '', nid: '', dob: '', 
            phoneNumber: '', email: '', address: '', nomineeName: '', nomineeNid: ''
          });
          loadMembers(); // Reload list
      } catch (error: any) {
          alert(error.message || "Failed to add member");
      } finally {
          setFormLoading(false);
      }
  };

  const handleAdminDeposit = async (memberId: string) => {
      if (!user.token || !depositAmount) return;
      const amount = parseFloat(depositAmount);
      if (isNaN(amount) || amount <= 0) return;

      setIsDepositing(true);
      try {
          await api.adminDeposit(user.token, memberId, amount);
          alert(`Successfully deposited ৳${amount}`);
          setDepositAmount('');
          loadMembers(); // Refresh balance
      } catch (e) {
          alert("Deposit failed");
      } finally {
          setIsDepositing(false);
      }
  };

  const handleDownloadStatement = async () => {
      if (!user.token) return;
      setIsGeneratingPdf(true);
      
      try {
          const allTransactions = await api.getAdminStatement(user.token);
          
          const printContent = `
            <html>
              <head>
                <title>Full Statement - চিরন্তন বন্ধন</title>
                <style>
                  body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #333; max-width: 1000px; mx-auto; }
                  .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #10b981; padding-bottom: 20px; }
                  h1 { margin: 0; color: #10b981; }
                  p { color: #666; margin: 5px 0; }
                  table { width: 100%; border-collapse: collapse; font-size: 12px; }
                  th { background-color: #f3f4f6; text-align: left; padding: 12px; border-bottom: 2px solid #ddd; color: #374151; font-weight: bold; }
                  td { padding: 10px 12px; border-bottom: 1px solid #eee; }
                  .credit { color: #10b981; font-weight: bold; }
                  .debit { color: #ef4444; font-weight: bold; }
                  .status-approved { color: #10b981; }
                  .status-pending { color: #f59e0b; }
                  .status-rejected { color: #ef4444; text-decoration: line-through; }
                  .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #999; }
                </style>
              </head>
              <body>
                <div class="header">
                    <h1>চিরন্তন বন্ধন (Friends Fund)</h1>
                    <h2>Global Transaction Statement</h2>
                    <p>Generated on: ${new Date().toLocaleString()}</p>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Member Name</th>
                      <th>Phone</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${allTransactions.map((t: any) => `
                      <tr>
                        <td>${new Date(t.created_at).toLocaleDateString()} ${new Date(t.created_at).toLocaleTimeString()}</td>
                        <td>${t.userName || 'Unknown'}</td>
                        <td>${t.phoneNumber || '-'}</td>
                        <td>${t.transaction_type}</td>
                        <td class="${t.transaction_type === 'DEPOSIT' ? 'credit' : 'debit'}">
                          ${t.transaction_type === 'DEPOSIT' ? '+' : '-'}৳${parseFloat(t.amount).toLocaleString()}
                        </td>
                        <td class="status-${t.status.toLowerCase()}">${t.status}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
                <div class="footer">
                  <p>Confidential Document - For Admin Use Only</p>
                </div>
                <script>
                   window.onload = function() { window.print(); }
                </script>
              </body>
            </html>
          `;

          const win = window.open('', '', 'height=700,width=900');
          if (win) {
              win.document.write(printContent);
              win.document.close();
          }

      } catch (error) {
          console.error(error);
          alert("Failed to generate statement");
      } finally {
          setIsGeneratingPdf(false);
      }
  };

  const InputField = ({ label, value, field, type = "text", required = true }: any) => (
      <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-400 uppercase">{label} {required && <span className="text-rose-400">*</span>}</label>
          <input 
              type={type} 
              value={value}
              required={required}
              onChange={(e) => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
              className="bg-nova-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors"
          />
      </div>
  );

  return (
    <div className="min-h-screen bg-nova-900 p-6 pb-20 animate-fade-in">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/20 rounded-xl">
                    <Shield className="text-emerald-400" size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Admin Console</h2>
                    <p className="text-slate-400 text-sm">Manage fund & members</p>
                </div>
            </div>
            
            <button 
                onClick={handleDownloadStatement}
                disabled={isGeneratingPdf}
                className="bg-nova-800 hover:bg-nova-700 text-white border border-white/10 px-4 py-2 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm font-medium disabled:opacity-50"
            >
                {isGeneratingPdf ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                Download Full Statement
            </button>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-nova-800 rounded-xl mb-6">
            <button 
                onClick={() => setActiveTab('REQUESTS')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'REQUESTS' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
            >
                <RefreshCw size={16} className={isLoading && activeTab === 'REQUESTS' ? 'animate-spin' : ''} />
                Fund Requests
            </button>
            <button 
                onClick={() => setActiveTab('MEMBERS')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'MEMBERS' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
            >
                <LayoutList size={16} />
                Manage Members
            </button>
        </div>

        {/* Content: Requests */}
        {activeTab === 'REQUESTS' && (
            <div className="space-y-4 animate-fade-in">
                {pendingTx.length === 0 && !isLoading && (
                    <div className="text-center py-12 bg-nova-800/30 rounded-3xl border border-dashed border-white/10">
                        <p className="text-slate-500">No pending requests found.</p>
                    </div>
                )}

                {pendingTx.map((tx) => (
                    <div key={tx.id} className="bg-nova-800 border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-full ${tx.transaction_type === 'DEPOSIT' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                {tx.transaction_type === 'DEPOSIT' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg">{tx.userName || 'Unknown User'}</h3>
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
                            <button onClick={() => handleAction(tx.id, 'REJECT')} disabled={processingId === tx.id} className="flex-1 sm:flex-none py-2 px-4 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                <X size={18} /> <span className="sm:hidden">Reject</span>
                            </button>
                            <button onClick={() => handleAction(tx.id, 'APPROVE')} disabled={processingId === tx.id} className="flex-1 sm:flex-none py-2 px-4 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                {processingId === tx.id ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span> : <Check size={18} />} <span className="sm:hidden">Approve</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* Content: Members */}
        {activeTab === 'MEMBERS' && (
            <div className="animate-fade-in">
                {!isAddingMember ? (
                    <div className="space-y-6">
                         <button 
                            onClick={() => setIsAddingMember(true)}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
                        >
                            <UserPlus size={20} />
                            Add New Member
                        </button>

                        <div className="space-y-3">
                            {members.map((m) => (
                                <div key={m.id} className="bg-nova-800 border border-white/10 rounded-2xl overflow-hidden">
                                    <div 
                                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                                        onClick={() => {
                                            setExpandedMemberId(expandedMemberId === m.id ? null : m.id);
                                            setDepositAmount(''); // Reset input when switching
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-nova-700 border border-white/10 flex items-center justify-center text-emerald-400 font-bold">
                                                {m.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="text-white font-semibold">{m.name}</h4>
                                                <p className="text-xs text-slate-400">{m.phoneNumber}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-emerald-400">৳{m.balance.toLocaleString()}</span>
                                            {expandedMemberId === m.id ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
                                        </div>
                                    </div>

                                    {expandedMemberId === m.id && (
                                        <div className="px-4 pb-4 pt-2 bg-nova-900/30 border-t border-white/5 text-sm space-y-3 animate-fade-in">
                                            
                                            {/* Admin Deposit Section */}
                                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mb-4">
                                                <h5 className="text-emerald-400 font-bold text-xs uppercase mb-2 flex items-center gap-1">
                                                    <DollarSign size={12} /> Deposit Subscription
                                                </h5>
                                                <div className="flex gap-2">
                                                    <div className="relative flex-1">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">৳</span>
                                                        <input 
                                                            type="number" 
                                                            placeholder="Amount" 
                                                            className="w-full bg-nova-900 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-white focus:border-emerald-500 outline-none text-sm"
                                                            value={depositAmount}
                                                            onChange={(e) => setDepositAmount(e.target.value)}
                                                        />
                                                    </div>
                                                    <button 
                                                        onClick={() => handleAdminDeposit(m.id)}
                                                        disabled={isDepositing || !depositAmount}
                                                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-50"
                                                    >
                                                        {isDepositing ? <Loader2 size={14} className="animate-spin" /> : 'Confirm'}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <span className="block text-[10px] uppercase text-slate-500 tracking-wider">Father's Name</span>
                                                    <span className="text-slate-300">{m.fatherName || 'N/A'}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-[10px] uppercase text-slate-500 tracking-wider">Mother's Name</span>
                                                    <span className="text-slate-300">{m.motherName || 'N/A'}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-[10px] uppercase text-slate-500 tracking-wider">NID</span>
                                                    <span className="text-slate-300 font-mono">{m.nid || 'N/A'}</span>
                                                </div>
                                                <div>
                                                     <span className="block text-[10px] uppercase text-slate-500 tracking-wider">DOB</span>
                                                     <span className="text-slate-300 flex items-center gap-1">
                                                        <Calendar size={12} /> {m.dob || 'N/A'}
                                                     </span>
                                                </div>
                                            </div>
                                            <div>
                                                <span className="block text-[10px] uppercase text-slate-500 tracking-wider">Address</span>
                                                <span className="text-slate-300 flex items-start gap-1">
                                                    <MapPin size={12} className="mt-0.5" /> {m.address || 'N/A'}
                                                </span>
                                            </div>
                                            <div className="pt-2 border-t border-white/5">
                                                 <span className="block text-[10px] uppercase text-slate-500 tracking-wider mb-1">Nominee Info</span>
                                                 <div className="flex justify-between">
                                                     <span className="text-slate-300">{m.nomineeName || 'N/A'}</span>
                                                     <span className="text-slate-400 font-mono text-xs">{m.nomineeNid || ''}</span>
                                                 </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-nova-800 border border-white/10 rounded-3xl p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <UserPlus size={20} className="text-emerald-400" />
                                New Member Registration
                            </h3>
                            <button onClick={() => setIsAddingMember(false)} className="text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleMemberSubmit} className="space-y-6">
                            {/* Personal Info */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-semibold text-emerald-500 uppercase tracking-wider">Personal Information</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <InputField label="Full Name" field="name" value={formData.name} />
                                    <InputField label="Date of Birth" field="dob" value={formData.dob} type="date" />
                                    <InputField label="Father's Name" field="fatherName" value={formData.fatherName} />
                                    <InputField label="Mother's Name" field="motherName" value={formData.motherName} />
                                    <InputField label="NID Number" field="nid" value={formData.nid} />
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-4 border-t border-white/5 pt-4">
                                <h4 className="text-sm font-semibold text-emerald-500 uppercase tracking-wider">Contact Details</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <InputField label="Phone Number (Login ID)" field="phoneNumber" value={formData.phoneNumber} type="tel" />
                                    <InputField label="Email (Optional)" field="email" value={formData.email} type="email" required={false} />
                                    <div className="sm:col-span-2">
                                        <InputField label="Full Address" field="address" value={formData.address} />
                                    </div>
                                </div>
                            </div>

                            {/* Nominee Info */}
                            <div className="space-y-4 border-t border-white/5 pt-4">
                                <h4 className="text-sm font-semibold text-emerald-500 uppercase tracking-wider">Nominee Information</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <InputField label="Nominee Name" field="nomineeName" value={formData.nomineeName} />
                                    <InputField label="Nominee NID" field="nomineeNid" value={formData.nomineeNid} />
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button type="submit" fullWidth isLoading={formLoading}>
                                    <Save size={18} /> Register Member
                                </Button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};
