import React, { useState, useEffect } from 'react';
import { X, TrendingUp, ArrowUpRight, ArrowDownLeft, Download, Send, IdCard, Upload, Printer, Wallet, UserCog, User, Lock, FileText, Plus, Trash2, Loader2, Save } from 'lucide-react';
import { Transaction, User as UserType } from '../types';
import { api } from '../services/api';
import { Button } from './Button';

interface FeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: 'growth' | 'split' | 'history' | 'rules' | 'id_card' | 'balance_mgmt' | 'reports' | 'profile_edit' | null;
  transactions: Transaction[];
  user: UserType;
  stats?: {
      totalDeposited: number;
      totalWithdrawn: number;
      currentBalance: number;
      growth: { label: string; value: number }[];
  };
}

export const FeatureModal: React.FC<FeatureModalProps> = ({ isOpen, onClose, feature, transactions, user, stats }) => {
  const [members, setMembers] = useState<any[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  
  // ID Card State
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Profile Edit State
  const [profileTab, setProfileTab] = useState<'INFO' | 'SECURITY' | 'DOCS'>('INFO');
  const [profileData, setProfileData] = useState<UserType | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Security State
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  
  // Doc State
  const [docName, setDocName] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);

  useEffect(() => {
    if (isOpen) {
        if (feature === 'id_card' || feature === 'balance_mgmt') {
            loadMembers();
        }
        if (feature === 'profile_edit') {
            loadFullProfile();
        }
    }
  }, [isOpen, feature]);

  // When a member is selected for ID card
  useEffect(() => {
      if (selectedMemberId && members.length > 0) {
          const m = members.find(mem => mem.id === selectedMemberId);
          if (m && m.profile_image) {
              setPreviewImage(m.profile_image); 
          } else {
              setPreviewImage(null);
          }
      }
  }, [selectedMemberId, members]);

  const loadMembers = async () => {
      if (!user.token) return;
      setIsLoadingMembers(true);
      try {
          const data = await api.getMembers(user.token);
          setMembers(data);
      } catch (e) {
          console.error("Failed to load members", e);
      } finally {
          setIsLoadingMembers(false);
      }
  };

  const loadFullProfile = async () => {
      if (!user.token) return;
      setIsProfileLoading(true);
      try {
          const data = await api.getFullProfile(user.token);
          setProfileData(data);
      } catch (e) {
          console.error("Profile load failed", e);
      } finally {
          setIsProfileLoading(false);
      }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user.token || !profileData) return;
      setIsSaving(true);
      try {
          await api.updateProfile(user.token, profileData);
          alert("Profile updated successfully!");
      } catch (e: any) {
          alert(e.message || "Update failed");
      } finally {
          setIsSaving(false);
      }
  };

  const handlePinChange = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user.token) return;
      if (newPin !== confirmPin) {
          alert("New PINs do not match");
          return;
      }
      setIsSaving(true);
      try {
          await api.changePin(user.token, oldPin, newPin);
          alert("PIN changed successfully!");
          setOldPin(''); setNewPin(''); setConfirmPin('');
      } catch (e: any) {
          alert(e.message || "Failed to change PIN");
      } finally {
          setIsSaving(false);
      }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'nid' | 'nominee' | 'document') => {
      if (e.target.files && e.target.files[0] && user.token && profileData) {
          const file = e.target.files[0];
          setIsSaving(true);
          try {
              const res = await api.uploadFile(user.token, file, type === 'document' ? 'document' : 'nid');
              
              if (type === 'nid') {
                  setProfileData({ ...profileData, nidImage: res.url });
                  await api.updateProfile(user.token, { nidImage: res.url });
              } else if (type === 'nominee') {
                  setProfileData({ ...profileData, nomineeNidImage: res.url });
                  await api.updateProfile(user.token, { nomineeNidImage: res.url });
              } else if (type === 'document') {
                  // Wait for name input logic
                  return res.url;
              }
          } catch (e) {
              alert("Upload failed");
          } finally {
              setIsSaving(false);
          }
      }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user.token || !docFile || !docName) return;
      setIsSaving(true);
      try {
          const res = await api.uploadFile(user.token, docFile, 'document');
          await api.addDocument(user.token, docName, res.url);
          // Refresh profile to see new doc
          await loadFullProfile();
          setDocName('');
          setDocFile(null);
      } catch (e) {
          alert("Failed to add document");
      } finally {
          setIsSaving(false);
      }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onloadend = () => {
              setPreviewImage(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  // Reused Components
  const ImageUploadBox = ({ label, imageUrl, onChange }: { label: string, imageUrl?: string, onChange: (e: any) => void }) => (
      <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase">{label}</label>
          <div className="border-2 border-dashed border-white/10 rounded-xl h-32 flex flex-col items-center justify-center relative hover:border-emerald-500/50 transition-colors bg-nova-900/30 overflow-hidden">
                {imageUrl ? (
                    <img src={imageUrl} alt="Uploaded" className="w-full h-full object-cover" />
                ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                        <Upload size={20} />
                        <span className="text-xs">Tap to Upload</span>
                    </div>
                )}
                <input type="file" accept="image/*" onChange={onChange} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
      </div>
  );

  const printIDCard = () => {
     const member = members.find(m => m.id === selectedMemberId);
     if (!member) return;

     const printContent = `
        <html>
        <head>
            <title>ID Card - ${member.name}</title>
            <style>
                body { margin: 0; padding: 20px; font-family: 'Helvetica', sans-serif; display: flex; justify-content: center; }
                .card { 
                    width: 350px; height: 220px; 
                    border-radius: 15px; 
                    background: linear-gradient(135deg, #10b981 0%, #047857 100%); 
                    color: white; position: relative; overflow: hidden;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                    border: 1px solid #059669;
                }
                .overlay {
                    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                    background-image: url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E");
                }
                .header { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; position: relative; z-index: 2; }
                .logo { font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
                .org-name { font-size: 10px; opacity: 0.8; }
                
                .content { display: flex; padding: 0 20px; gap: 15px; position: relative; z-index: 2; align-items: center; }
                .photo-box { 
                    width: 80px; height: 80px; background: white; border-radius: 10px; 
                    border: 3px solid rgba(255,255,255,0.3); overflow: hidden;
                }
                .photo-box img { width: 100%; height: 100%; object-fit: cover; }
                .details { flex: 1; }
                .name { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
                .info-row { font-size: 10px; margin-bottom: 3px; display: flex; }
                .label { width: 60px; opacity: 0.7; }
                .val { font-weight: bold; }
                
                .footer { 
                    position: absolute; bottom: 0; left: 0; width: 100%; 
                    background: rgba(0,0,0,0.1); padding: 8px 20px; 
                    font-size: 8px; display: flex; justify-content: space-between; align-items: center;
                }
            </style>
        </head>
        <body>
            <div class="card">
                <div class="overlay"></div>
                <div class="header">
                    <div>
                        <div class="logo">চিরন্তন বন্ধন</div>
                        <div class="org-name">Friends Fund Samity</div>
                    </div>
                    <div style="font-size: 20px;">💳</div>
                </div>
                <div class="content">
                    <div class="photo-box">
                        ${previewImage ? `<img src="${previewImage}" />` : '<div style="width:100%;height:100%;background:#eee;"></div>'}
                    </div>
                    <div class="details">
                        <div class="name">${member.name}</div>
                        <div class="info-row"><span class="label">ID NO:</span><span class="val">${member.id.substring(0, 8).toUpperCase()}</span></div>
                        <div class="info-row"><span class="label">PHONE:</span><span class="val">${member.phoneNumber}</span></div>
                        <div class="info-row"><span class="label">JOINED:</span><span class="val">${new Date(member.joinedDate || Date.now()).toLocaleDateString()}</span></div>
                        <div class="info-row"><span class="label">TYPE:</span><span class="val">MEMBER</span></div>
                    </div>
                </div>
                <div class="footer">
                    <span>Authorized Signature</span>
                    <span>www.friends-fund.com</span>
                </div>
            </div>
            <script>window.onload = function() { window.print(); }</script>
        </body>
        </html>
     `;
     const win = window.open('', '', 'height=400,width=500');
     if (win) {
         win.document.write(printContent);
         win.document.close();
     }
  };

  if (!isOpen || !feature) return null;

  const printPDF = () => {
      // Mask Phone Number
      const maskedPhone = user.phoneNumber.length >= 11 
        ? user.phoneNumber.substring(0, 3) + 'xxxxx' + user.phoneNumber.substring(8)
        : user.phoneNumber;

      const printContent = `
        <html>
          <head>
            <title>Account Statement - চিরন্তন বন্ধন</title>
            <style>
               /* ... existing styles ... */
               body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #333; max-width: 800px; mx-auto; }
              .header-container { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
              .brand h1 { margin: 0; color: #10b981; font-size: 24px; }
              .brand p { margin: 5px 0; color: #666; font-size: 12px; }
              .meta { text-align: right; font-size: 12px; color: #888; }
              
              .user-details { background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #e5e7eb; }
              .user-details table { width: 100%; border: none; }
              .user-details td { padding: 5px 0; font-size: 14px; }
              .label { color: #6b7280; width: 120px; font-weight: bold; }
              .value { color: #111827; }

              .tx-table { width: 100%; border-collapse: collapse; width: 100%; font-size: 12px; }
              .tx-table th { background-color: #f3f4f6; text-align: left; padding: 12px; border-bottom: 1px solid #ddd; color: #4b5563; }
              .tx-table td { padding: 12px; border-bottom: 1px solid #eee; }
              .credit { color: #10b981; font-weight: bold; }
              .debit { color: #ef4444; font-weight: bold; }
              
              .footer { margin-top: 50px; font-size: 10px; text-align: center; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="header-container">
                <div class="brand">
                    <h1>চিরন্তন বন্ধন</h1>
                    <p>Community Savings Fund</p>
                </div>
                <div class="meta">
                    <p>Date: ${new Date().toLocaleDateString()}</p>
                    <p>Time: ${new Date().toLocaleTimeString()}</p>
                </div>
            </div>
            <div class="user-details">
                <table>
                    <tr>
                        <td class="label">Member Name:</td>
                        <td class="value">${user.name}</td>
                        <td class="label">Member ID:</td>
                        <td class="value">${user.id.toUpperCase()}</td>
                    </tr>
                    <tr>
                        <td class="label">Address:</td>
                        <td class="value" colspan="3">${user.address || 'Registered Address'}</td>
                    </tr>
                     <tr>
                        <td class="label">Phone:</td>
                        <td class="value">${maskedPhone}</td>
                    </tr>
                </table>
            </div>
            <h3 style="margin-bottom: 15px; color: #374151;">Transaction History</h3>
            <table class="tx-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${transactions.map(t => `
                  <tr>
                    <td>${t.date}</td>
                    <td>${t.merchant}</td>
                    <td>${t.transaction_type}</td>
                    <td>${t.status}</td>
                    <td class="${t.transaction_type === 'DEPOSIT' ? 'credit' : 'debit'}">
                      ${t.transaction_type === 'DEPOSIT' ? '+' : '-'}৳${t.amount.toLocaleString()}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="footer">
              <p>This statement is computer generated and does not require a signature.</p>
              <p>Friends Fund - চিরন্তন বন্ধন</p>
            </div>
            <script>window.onload = function() { window.print(); }</script>
          </body>
        </html>
      `;
      const win = window.open('', '', 'height=700,width=800');
      if (win) {
          win.document.write(printContent);
          win.document.close();
      }
  };

  const renderContent = () => {
    switch (feature) {
      case 'profile_edit':
        if (isProfileLoading || !profileData) return <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-emerald-500"/></div>;

        return (
            <div className="h-full flex flex-col">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white">Profile Settings</h3>
                  <p className="text-slate-400 text-sm">Manage your account details</p>
                </div>

                <div className="flex p-1 bg-nova-900 rounded-xl mb-6 border border-white/5">
                    {['INFO', 'DOCS', 'SECURITY'].map((tab) => (
                        <button 
                            key={tab}
                            onClick={() => setProfileTab(tab as any)}
                            className={`flex-1 py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${
                                profileTab === tab ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            {tab === 'INFO' && <User size={14} />}
                            {tab === 'DOCS' && <FileText size={14} />}
                            {tab === 'SECURITY' && <Lock size={14} />}
                            {tab === 'DOCS' ? 'DOCUMENTS' : tab}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
                    {profileTab === 'INFO' && (
                        <form onSubmit={handleProfileUpdate} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 uppercase">Full Name</label>
                                    <input value={profileData.name || ''} onChange={e => setProfileData({...profileData, name: e.target.value})} className="w-full bg-nova-900/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-emerald-500 outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 uppercase">Email</label>
                                    <input value={profileData.email || ''} onChange={e => setProfileData({...profileData, email: e.target.value})} className="w-full bg-nova-900/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-emerald-500 outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 uppercase">Father's Name</label>
                                    <input value={profileData.fatherName || ''} onChange={e => setProfileData({...profileData, fatherName: e.target.value})} className="w-full bg-nova-900/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-emerald-500 outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 uppercase">Mother's Name</label>
                                    <input value={profileData.motherName || ''} onChange={e => setProfileData({...profileData, motherName: e.target.value})} className="w-full bg-nova-900/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-emerald-500 outline-none" />
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                    <label className="text-xs text-slate-400 uppercase">Address</label>
                                    <input value={profileData.address || ''} onChange={e => setProfileData({...profileData, address: e.target.value})} className="w-full bg-nova-900/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-emerald-500 outline-none" />
                                </div>
                            </div>
                            
                            <div className="pt-2 border-t border-white/5">
                                <h4 className="text-xs font-bold text-emerald-500 mb-3 uppercase">Nominee Info</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-400 uppercase">Name</label>
                                        <input value={profileData.nomineeName || ''} onChange={e => setProfileData({...profileData, nomineeName: e.target.value})} className="w-full bg-nova-900/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-emerald-500 outline-none" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-400 uppercase">NID</label>
                                        <input value={profileData.nomineeNid || ''} onChange={e => setProfileData({...profileData, nomineeNid: e.target.value})} className="w-full bg-nova-900/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-emerald-500 outline-none" />
                                    </div>
                                </div>
                            </div>

                            <Button type="submit" fullWidth isLoading={isSaving} className="mt-4">
                                <Save size={16} /> Save Changes
                            </Button>
                        </form>
                    )}

                    {profileTab === 'DOCS' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <ImageUploadBox label="My NID Card" imageUrl={profileData.nidImage} onChange={(e) => handleFileUpload(e, 'nid')} />
                                <ImageUploadBox label="Nominee NID" imageUrl={profileData.nomineeNidImage} onChange={(e) => handleFileUpload(e, 'nominee')} />
                            </div>

                            <div className="pt-4 border-t border-white/5">
                                <h4 className="text-xs font-bold text-emerald-500 mb-3 uppercase flex items-center gap-2">
                                    Additional Documents
                                </h4>
                                
                                <form onSubmit={handleAddDocument} className="flex gap-2 mb-4">
                                    <input 
                                        placeholder="Doc Name (e.g. Utility Bill)" 
                                        value={docName}
                                        onChange={e => setDocName(e.target.value)}
                                        className="flex-1 bg-nova-900/50 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-emerald-500 outline-none"
                                    />
                                    <div className="relative overflow-hidden">
                                        <button type="button" className="bg-nova-800 hover:bg-nova-700 text-white p-2.5 rounded-lg border border-white/10">
                                            {docFile ? <FileText size={18} className="text-emerald-400"/> : <Upload size={18} />}
                                        </button>
                                        <input type="file" onChange={e => e.target.files && setDocFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    </div>
                                    <button type="submit" disabled={!docFile || !docName || isSaving} className="bg-emerald-600 hover:bg-emerald-500 text-white p-2.5 rounded-lg disabled:opacity-50">
                                        {isSaving ? <Loader2 size={18} className="animate-spin"/> : <Plus size={18} />}
                                    </button>
                                </form>

                                <div className="space-y-2">
                                    {profileData.documents?.map((doc, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-nova-900/50 rounded-xl border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-nova-800 rounded-lg">
                                                    <FileText size={16} className="text-slate-400" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-white">{doc.name}</div>
                                                    <div className="text-[10px] text-slate-500">Uploaded {new Date(doc.uploadedAt || Date.now()).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                            <a href={doc.url} target="_blank" rel="noreferrer" className="text-emerald-400 hover:text-emerald-300 text-xs font-medium">View</a>
                                        </div>
                                    ))}
                                    {(!profileData.documents || profileData.documents.length === 0) && (
                                        <p className="text-center text-slate-500 text-xs py-2">No extra documents uploaded</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {profileTab === 'SECURITY' && (
                        <form onSubmit={handlePinChange} className="space-y-4 py-4">
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4">
                                <p className="text-amber-400 text-xs">Security Note: Changing your PIN will log you out of other devices.</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-slate-400 uppercase">Current PIN</label>
                                <input type="password" maxLength={4} value={oldPin} onChange={e => setOldPin(e.target.value.replace(/\D/g, ''))} className="w-full bg-nova-900/50 border border-white/10 rounded-lg p-3 text-lg text-white font-mono tracking-widest focus:border-emerald-500 outline-none text-center" placeholder="••••" />
                            </div>
                             <div className="space-y-1">
                                <label className="text-xs text-slate-400 uppercase">New PIN</label>
                                <input type="password" maxLength={4} value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))} className="w-full bg-nova-900/50 border border-white/10 rounded-lg p-3 text-lg text-white font-mono tracking-widest focus:border-emerald-500 outline-none text-center" placeholder="••••" />
                            </div>
                             <div className="space-y-1">
                                <label className="text-xs text-slate-400 uppercase">Confirm New PIN</label>
                                <input type="password" maxLength={4} value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))} className="w-full bg-nova-900/50 border border-white/10 rounded-lg p-3 text-lg text-white font-mono tracking-widest focus:border-emerald-500 outline-none text-center" placeholder="••••" />
                            </div>

                            <Button type="submit" fullWidth isLoading={isSaving} className="mt-4" disabled={newPin.length < 4 || newPin !== confirmPin}>
                                Update PIN
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        );

      case 'balance_mgmt':
          const totalAssets = members.reduce((acc, m) => acc + (m.balance || 0), 0);
          return (
              <div className="space-y-6">
                  <div className="text-center">
                      <h3 className="text-2xl font-bold text-emerald-400">Balance Management</h3>
                      <p className="text-slate-400 text-sm">Fund Overview & User Balances</p>
                  </div>
                  
                  <div className="bg-nova-900/50 p-5 rounded-2xl border border-emerald-500/20 text-center">
                      <span className="text-slate-400 text-xs uppercase tracking-wider">Total Fund Assets</span>
                      <div className="text-3xl font-bold text-white mt-1">৳{totalAssets.toLocaleString()}</div>
                  </div>

                  <div className="space-y-2 max-h-[40vh] overflow-y-auto no-scrollbar">
                      {isLoadingMembers ? (
                          <div className="text-center text-slate-500 py-4">Loading balances...</div>
                      ) : (
                          members.map(m => (
                              <div key={m.id} className="flex items-center justify-between p-3 bg-nova-800 rounded-xl border border-white/5">
                                  <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-nova-700 flex items-center justify-center text-xs font-bold text-emerald-400 overflow-hidden">
                                          {m.profile_image ? (
                                              <img src={m.profile_image} className="w-full h-full object-cover" alt={m.name} />
                                          ) : (
                                              m.name.charAt(0)
                                          )}
                                      </div>
                                      <div>
                                          <div className="text-sm font-medium text-white">{m.name}</div>
                                          <div className="text-[10px] text-slate-500">{m.phoneNumber}</div>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <div className="font-bold text-emerald-400">৳{m.balance.toLocaleString()}</div>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          );
      
      case 'id_card':
          const selectedMember = members.find(m => m.id === selectedMemberId);
          return (
              <div className="space-y-6">
                  <div className="text-center">
                      <h3 className="text-2xl font-bold text-emerald-400">ID Card Generator</h3>
                      <p className="text-slate-400 text-sm">Create Member Identity Cards</p>
                  </div>

                  {/* User Selection */}
                  <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase">Select Member</label>
                      <select 
                        value={selectedMemberId} 
                        onChange={(e) => { setSelectedMemberId(e.target.value); }}
                        className="w-full bg-nova-900 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 outline-none"
                      >
                          <option value="">-- Choose User --</option>
                          {members.map(m => (
                              <option key={m.id} value={m.id}>{m.name} ({m.phoneNumber})</option>
                          ))}
                      </select>
                  </div>

                  {selectedMember && (
                      <div className="space-y-4 animate-fade-in">
                          <div className="space-y-2">
                               <label className="text-xs font-bold text-slate-400 uppercase">Member Photo</label>
                               
                               {!previewImage && (
                                   <div className="border-2 border-dashed border-white/10 rounded-xl p-4 text-center hover:border-emerald-500/50 transition-colors cursor-pointer relative">
                                       <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                       <div className="flex flex-col items-center gap-2 text-slate-400">
                                           <Upload size={20} />
                                           <span className="text-xs">Upload new image</span>
                                       </div>
                                   </div>
                               )}
                               
                               {previewImage && (
                                   <p className="text-xs text-emerald-500 text-center">Using stored profile image</p>
                               )}
                          </div>

                          {/* Card Preview */}
                          <div className="relative w-full aspect-[1.58] rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-2xl border border-emerald-400/30 p-4 flex flex-col justify-between text-white">
                                <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]"></div>
                                <div className="relative z-10 flex justify-between items-start">
                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-widest opacity-90">চিরন্তন বন্ধন</h4>
                                        <p className="text-[8px] opacity-75">Friends Fund Samity</p>
                                    </div>
                                    <IdCard size={20} className="opacity-80" />
                                </div>

                                <div className="relative z-10 flex items-center gap-4 pl-2">
                                    <div className="w-16 h-16 bg-white/20 rounded-lg overflow-hidden border-2 border-white/30 flex items-center justify-center">
                                        {previewImage ? (
                                            <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <UserCog size={24} className="opacity-50" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg leading-tight">{selectedMember.name}</h3>
                                        <p className="text-[10px] opacity-80 mt-1">ID: {selectedMember.id.substring(0,8).toUpperCase()}</p>
                                        <p className="text-[10px] opacity-80">Phone: {selectedMember.phoneNumber}</p>
                                    </div>
                                </div>

                                <div className="relative z-10 text-[8px] text-center opacity-60">
                                    Authorized Member Card
                                </div>
                          </div>

                          <button 
                            onClick={printIDCard}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
                          >
                              <Printer size={18} /> Print Card
                          </button>
                      </div>
                  )}
              </div>
          );

      case 'growth':
        const growthData = stats?.growth || [];
        // Find max value for bar scaling
        const maxVal = Math.max(...growthData.map(d => d.value), 1);

        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-emerald-400">Fund Growth</h3>
              <p className="text-slate-400 text-sm">Last 6 Months Deposits</p>
            </div>
            {/* Real Data Bar Chart */}
            <div className="h-48 flex items-end justify-between gap-2 px-2 mt-4">
              {growthData.map((d, i) => {
                const heightPercentage = Math.max((d.value / maxVal) * 100, 5); // Min 5% height
                return (
                    <div key={i} className="w-full flex flex-col items-center gap-2 group">
                         <div className="text-[9px] text-white opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                             ৳{d.value >= 1000 ? `${(d.value/1000).toFixed(1)}k` : d.value}
                         </div>
                        <div className="relative w-full bg-nova-700 rounded-t-lg overflow-hidden transition-all duration-500 group-hover:bg-emerald-500/20" style={{ height: `${heightPercentage}%` }}>
                            <div className="absolute bottom-0 w-full bg-emerald-500 opacity-50 h-full"></div>
                        </div>
                        <span className="text-[10px] text-slate-500 uppercase">{d.label}</span>
                    </div>
                );
              })}
            </div>
            {growthData.length === 0 && (
                 <p className="text-center text-xs text-slate-500">No deposit history yet.</p>
            )}
            
            <div className="bg-nova-900/50 p-4 rounded-xl border border-white/5">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-400 text-sm">Total Fund Value</span>
                    <span className="text-emerald-400 font-bold">৳{stats?.currentBalance.toLocaleString() || '0'}</span>
                </div>
                {/* 
                  Simple growth metric: compare last month to previous if available.
                  Assuming array is sorted chronologically, last index is latest.
                */}
                <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Latest Month</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <TrendingUp size={14}/> ৳{growthData[growthData.length-1]?.value.toLocaleString() || 0}
                    </span>
                </div>
            </div>
          </div>
        );

      case 'split':
        const deposited = stats?.totalDeposited || 0;
        const withdrawn = stats?.totalWithdrawn || 0;
        const current = stats?.currentBalance || 0;
        // Calculate percentages
        const totalActivity = deposited; // Total money ever entered the system via deposits
        // Note: 'current' balance is basically (deposited - withdrawn).
        // To show a split of "Where is the money?", we can show:
        // 1. Withdrawn (Disbursed)
        // 2. Available (Current Balance)
        // Denominated by Total Deposited.

        const withdrawnPct = totalActivity > 0 ? Math.round((withdrawn / totalActivity) * 100) : 0;
        const availablePct = totalActivity > 0 ? Math.round((current / totalActivity) * 100) : 0;
        
        // Adjust for floating point errors or over-withdrawal scenarios (unlikely in this logic but good for safety)
        // If withdrawn + available > 100%, normalize visually? 
        // For simple split, let's just use these relative to total deposits.

        return (
           <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-emerald-400">Fund Allocation</h3>
              <p className="text-slate-400 text-sm">Funds Utilization Overview</p>
            </div>
            
            <div className="relative w-48 h-48 mx-auto my-8">
                 {/* 
                    CSS Conic Gradient based on real split.
                    If no data, show gray ring.
                 */}
                 {totalActivity > 0 ? (
                    <div 
                        className="w-full h-full rounded-full transition-all duration-1000" 
                        style={{ 
                            background: `conic-gradient(#3b82f6 0% ${withdrawnPct}%, #10b981 ${withdrawnPct}% 100%)` 
                        }}
                    ></div>
                 ) : (
                    <div className="w-full h-full rounded-full border-4 border-nova-700"></div>
                 )}
                
                <div className="absolute inset-4 bg-nova-800 rounded-full flex flex-col items-center justify-center">
                    <span className="text-slate-400 font-medium text-xs text-center">Total Collected</span>
                    <strong className="text-white text-lg">৳{deposited.toLocaleString()}</strong>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-nova-900/50 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-slate-300 text-sm">Disbursed (Withdrawals)</span>
                    </div>
                    <div className="text-right">
                        <span className="block text-white font-bold text-sm">{withdrawnPct}%</span>
                        <span className="text-[10px] text-slate-500">৳{withdrawn.toLocaleString()}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-nova-900/50 rounded-xl border border-white/5">
                     <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <span className="text-slate-300 text-sm">Available Balance</span>
                    </div>
                    <div className="text-right">
                        <span className="block text-white font-bold text-sm">{availablePct}%</span>
                        <span className="text-[10px] text-slate-500">৳{current.toLocaleString()}</span>
                    </div>
                </div>
            </div>
           </div>
        );

      case 'history':
        return (
          <div className="space-y-4 h-[60vh] flex flex-col">
            <div className="text-center shrink-0">
              <h3 className="text-2xl font-bold text-white">Transaction History</h3>
              <p className="text-slate-400 text-sm">All your financial activities</p>
            </div>
            
            <button 
                onClick={printPDF}
                className="mx-auto flex items-center gap-2 text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-4 py-2 rounded-lg text-xs font-medium transition-colors border border-emerald-500/30"
            >
                <Download size={14} /> Download PDF Statement
            </button>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-1">
                {transactions.length === 0 ? (
                     <p className="text-center text-slate-500 py-10">No history found.</p>
                ) : (
                    transactions.map((t) => (
                        <div key={t.id} className="p-4 bg-nova-900/50 border border-white/5 rounded-2xl flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${
                                    t.transaction_type === 'DEPOSIT' ? 'bg-emerald-500/10 text-emerald-400' : 
                                    t.transaction_type === 'TRANSFER' ? 'bg-indigo-500/10 text-indigo-400' :
                                    'bg-rose-500/10 text-rose-400'
                                }`}>
                                    {t.transaction_type === 'DEPOSIT' ? <ArrowDownLeft size={18}/> : 
                                     t.transaction_type === 'TRANSFER' ? <Send size={16} /> :
                                     <ArrowUpRight size={18}/>}
                                </div>
                                <div>
                                    <p className="text-white font-medium text-sm">{t.merchant}</p>
                                    <p className="text-[10px] text-slate-500">{t.date} • {t.status}</p>
                                </div>
                             </div>
                             <span className={`font-bold text-sm ${t.transaction_type === 'DEPOSIT' ? 'text-emerald-400' : 'text-white'}`}>
                                {t.transaction_type === 'DEPOSIT' ? '+' : '-'}৳{t.amount.toLocaleString()}
                             </span>
                        </div>
                    ))
                )}
            </div>
          </div>
        );
      case 'rules':
        return (
           <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white">Samity Rules</h3>
              <p className="text-slate-400 text-sm">Terms & Conditions</p>
            </div>
            <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
                {[
                    "Monthly deposit of ৳2,000 must be paid by the 10th of every month.",
                    "A late fee of ৳50 per day applies after the 10th.",
                    "Loans can be taken up to 80% of your total savings.",
                    "Loan interest rate is 5% flat per month.",
                    "Emergency withdrawals are processed within 24 hours.",
                    "Membership cancellation requires 1 month prior notice.",
                    "Nominee information must be kept up to date."
                ].map((rule, i) => (
                    <div key={i} className="flex gap-3 p-3 bg-nova-900/50 rounded-xl border border-white/5">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                            {i+1}
                        </span>
                        <p>{rule}</p>
                    </div>
                ))}
            </div>
           </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-nova-900/90 backdrop-blur-md transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-nova-800 border border-white/10 rounded-3xl p-6 shadow-2xl animate-slide-up max-h-[85vh] overflow-hidden flex flex-col">
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors z-10"
        >
          <X size={20} />
        </button>
        <div className="mt-2 overflow-y-auto no-scrollbar">
            {renderContent()}
        </div>
      </div>
    </div>
  );
};