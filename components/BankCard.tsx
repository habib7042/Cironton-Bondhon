import React, { useState } from 'react';
import { Wallet, Copy, Eye, EyeOff, Users } from 'lucide-react';
import { User } from '../types';

interface BankCardProps {
  user: User;
}

export const BankCard: React.FC<BankCardProps> = ({ user }) => {
  const [showBalance, setShowBalance] = useState(true);
  
  // Mock Member ID
  const memberId = "MEM-829-1034";
  const joined = "01/24";
  
  return (
    <div className="w-full aspect-[1.586] rounded-3xl relative overflow-hidden transition-all duration-500 hover:scale-[1.01] shadow-2xl shadow-emerald-900/50 group perspective-1000">
      {/* Card Background & Texture */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900"></div>
      
      {/* Decorative Patterns */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 -mt-10 -ml-10 w-64 h-64 bg-emerald-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 -mb-10 -mr-10 w-48 h-48 bg-teal-300 rounded-full blur-3xl"></div>
        <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hex-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M10 0 L20 5 L20 15 L10 20 L0 15 L0 5 Z" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hex-pattern)" />
        </svg>
      </div>

      {/* Glass Overlay */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-[0.5px]"></div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-6 sm:p-8 text-white z-10">
        {/* Header: App Name & Type */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <Users size={18} className="text-emerald-100" />
            </div>
            <div>
                <h3 className="font-bold tracking-wide text-lg leading-none">চিরন্তন বন্ধন</h3>
                <span className="text-[10px] uppercase tracking-widest opacity-80">Savings Member</span>
            </div>
          </div>
          <Wallet size={24} className="opacity-60" />
        </div>

        {/* Middle: Balance */}
        <div className="flex flex-col justify-center flex-1 mt-4">
             <span className="text-xs text-emerald-100/80 font-medium mb-1 uppercase tracking-wider">Your Total Contribution</span>
             <div className="flex items-center gap-3">
                <span className={`text-3xl sm:text-4xl font-bold tracking-tight ${showBalance ? '' : 'blur-md select-none'}`}>
                   {showBalance ? `৳${user.balance.toLocaleString()}` : '৳ •••••••'}
                </span>
                <button 
                  onClick={() => setShowBalance(!showBalance)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  {showBalance ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
             </div>
        </div>

        {/* Footer: ID & Details */}
        <div className="flex justify-between items-end">
            <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-widest opacity-60">Member Name</span>
                <span className="font-medium tracking-wide text-sm sm:text-base">{user.name}</span>
            </div>
            
            <div className="flex flex-col items-end">
                <span className="text-[9px] uppercase tracking-widest opacity-60">Member ID</span>
                <span className="font-mono font-medium tracking-wider text-sm">{memberId}</span>
            </div>
        </div>
      </div>
    </div>
  );
};