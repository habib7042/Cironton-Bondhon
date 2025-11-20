import React, { useState, useEffect } from 'react';
import { X, ArrowDownLeft, ShieldCheck, Send, Smartphone, User as UserIcon, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { NumPad } from './NumPad';
import { api } from '../services/api';

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'deposit' | 'withdraw' | 'transfer';
  onSubmit: (amount: number, recipient?: string, pin?: string) => Promise<void>;
}

export const ActionModal: React.FC<ActionModalProps> = ({ isOpen, onClose, type, onSubmit }) => {
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [pin, setPin] = useState('');
  const [step, setStep] = useState<'INPUT' | 'CONFIRM'>('INPUT');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
        setAmount('');
        setRecipient('');
        setRecipientName('');
        setPin('');
        setError('');
        setStep('INPUT');
        setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    
    if (!val || val <= 0) return;

    if (type === 'transfer') {
        if (recipient.length < 11) {
            setError("Enter valid 11-digit recipient number");
            return;
        }

        // Fetch Recipient Name
        setIsLoading(true);
        setError('');
        try {
            // In a real app, we would pass the current user token here. 
            // For this demo, we'll use a placeholder mock token or handle inside API.
            const result = await api.checkRecipient('mock-token-demo', recipient);
            setRecipientName(result.name);
            setStep('CONFIRM');
        } catch (err) {
            setError("Recipient account not found");
        } finally {
            setIsLoading(false);
        }
        return;
    }

    if (type === 'deposit') {
        setError('');
        setStep('CONFIRM');
    } else {
        // Withdrawals submit immediately without pin in this simplified flow
        handleSubmit();
    }
  };

  const handlePinEntry = (val: string) => {
    if (pin.length >= 4) return;
    setPin(prev => prev + val);
  };

  const handleDeletePin = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleSubmit = async () => {
    const val = parseFloat(amount);
    if (val <= 0) return;

    if (type === 'transfer' && pin.length !== 4) {
        setError("Please enter your 4-digit PIN");
        return;
    }

    setIsLoading(true);
    setError('');

    try {
        await onSubmit(val, recipient, pin);
        onClose();
    } catch (err: any) {
        setError(err.message || "Transaction failed");
        if (err.message === 'Incorrect PIN') {
            setPin('');
        }
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-nova-900/90 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-nova-800 border border-white/10 rounded-3xl p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto no-scrollbar">
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors z-10"
        >
          <X size={20} />
        </button>
        
        {step === 'INPUT' ? (
            <>
                <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-white mb-1 capitalize">
                        {type === 'transfer' ? 'Send Money' : `${type} Money`}
                    </h3>
                    <p className="text-sm text-slate-400">
                    {type === 'deposit' && 'Add funds to your monthly savings.'}
                    {type === 'withdraw' && 'Request a withdrawal.'}
                    {type === 'transfer' && 'Transfer securely to another member.'}
                    </p>
                </div>

                <form onSubmit={handleNext}>
                <div className="space-y-6">
                    {/* Recipient Field for Transfer */}
                    {type === 'transfer' && (
                        <div>
                             <label className="block text-xs font-bold text-emerald-500 mb-2 uppercase tracking-wider text-center">Recipient Number</label>
                             <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Smartphone className="text-slate-500" size={18} />
                                </div>
                                <input
                                    type="tel"
                                    value={recipient}
                                    onChange={(e) => {
                                        setRecipient(e.target.value.replace(/\D/g, ''));
                                        setError('');
                                    }}
                                    className="w-full bg-nova-900/50 border border-nova-600 rounded-xl pl-10 pr-4 py-3 text-lg text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all placeholder:text-slate-600"
                                    placeholder="017XXXXXXXX"
                                    autoFocus
                                />
                             </div>
                        </div>
                    )}

                    {/* Amount Field */}
                    <div>
                        <label className="block text-xs font-bold text-emerald-500 mb-2 uppercase tracking-wider text-center">Enter Amount</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-500">৳</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-nova-900/50 border border-nova-600 rounded-2xl px-4 pl-10 py-4 text-3xl font-bold text-white text-center focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all placeholder:text-slate-700"
                                placeholder="0"
                                min="1"
                            />
                        </div>
                    </div>
                </div>
                
                {error && (
                     <div className="text-center mt-4 text-rose-400 text-sm animate-fade-in bg-rose-500/10 py-2 rounded-lg">
                        {error}
                     </div>
                )}
                
                <div className="mt-8 space-y-3">
                    <Button type="submit" fullWidth variant="primary" isLoading={isLoading}>
                        Continue
                    </Button>
                    <button 
                        type="button"
                        onClick={onClose}
                        className="w-full py-3 text-slate-400 hover:text-white text-sm font-medium transition-colors"
                    >
                        Cancel
                    </button>
                </div>
                </form>
            </>
        ) : (
            <div className="animate-fade-in text-center pt-2">
                {/* Confirmation Header */}
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                    {type === 'transfer' ? <Send size={32} /> : <ArrowDownLeft size={32} />}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Confirm Transaction</h3>
                
                {/* Summary Box */}
                <div className="bg-nova-900/50 rounded-2xl p-4 mb-6 border border-white/5 mx-2 text-left">
                    {type === 'transfer' && (
                         <div className="mb-3 pb-3 border-b border-white/10 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-sm">To Account</span>
                                <span className="text-white font-mono font-medium">{recipient}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-sm">Receiver Name</span>
                                <span className="text-emerald-400 font-medium flex items-center gap-1">
                                    <UserIcon size={12} /> {recipientName}
                                </span>
                            </div>
                        </div>
                    )}
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-slate-400 text-sm">Amount</span>
                        <span className="text-lg font-bold text-white">৳{parseFloat(amount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-emerald-500 font-bold text-sm uppercase tracking-wider">Total</span>
                        <span className="text-xl font-bold text-emerald-400">৳{parseFloat(amount).toLocaleString()}</span>
                    </div>
                </div>

                {/* PIN Entry Section for Transfer */}
                {type === 'transfer' && (
                    <div className="mb-6">
                         <p className="text-sm text-slate-400 mb-3">Enter PIN to Confirm</p>
                         <div className="flex justify-center gap-4 mb-4">
                            {[0, 1, 2, 3].map((idx) => (
                                <div 
                                    key={idx}
                                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                        idx < pin.length ? 'bg-emerald-400' : 'bg-nova-700'
                                    }`}
                                />
                            ))}
                        </div>
                        {/* Minimal NumPad for Confirmation */}
                        <div className="transform scale-90 origin-top">
                            <NumPad onPress={handlePinEntry} onDelete={handleDeletePin} disabled={isLoading} />
                        </div>
                    </div>
                )}

                {error && (
                     <div className="text-center mb-4 text-rose-400 text-sm animate-fade-in">
                        {error}
                     </div>
                )}

                <div className="space-y-3">
                    <Button onClick={handleSubmit} fullWidth variant="primary" isLoading={isLoading} disabled={type === 'transfer' && pin.length < 4}>
                        <ShieldCheck size={18} /> Confirm {type === 'transfer' ? 'Send' : 'Deposit'}
                    </Button>
                    <button 
                        onClick={() => {
                            setStep('INPUT');
                            setPin('');
                            setError('');
                        }}
                        className="w-full py-3 text-slate-400 hover:text-white text-sm font-medium transition-colors"
                    >
                        Back to Edit
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};