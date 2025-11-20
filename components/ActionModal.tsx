import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'deposit' | 'withdraw';
  onSubmit: (amount: number) => void;
}

export const ActionModal: React.FC<ActionModalProps> = ({ isOpen, onClose, type, onSubmit }) => {
  const [amount, setAmount] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (val > 0) {
      onSubmit(val);
      setAmount('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-nova-900/90 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-nova-800 border border-white/10 rounded-3xl p-6 shadow-2xl animate-slide-up">
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
        
        <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-white mb-1 capitalize">{type} Money</h3>
            <p className="text-sm text-slate-400">
            {type === 'deposit' 
                ? 'Add funds to your monthly savings.' 
                : 'Request a withdrawal from your savings.'}
            </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-8">
            <label className="block text-xs font-bold text-emerald-500 mb-2 uppercase tracking-wider text-center">Enter Amount (BDT)</label>
            <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-500">৳</span>
                <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-nova-900/50 border border-nova-600 rounded-2xl px-4 pl-10 py-4 text-3xl font-bold text-white text-center focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all placeholder:text-slate-700"
                placeholder="0"
                autoFocus
                min="1"
                />
            </div>
          </div>
          
          <div className="space-y-3">
            <Button type="submit" fullWidth variant="primary">
                Confirm {type}
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
      </div>
    </div>
  );
};