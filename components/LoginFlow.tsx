
import React, { useState, useEffect } from 'react';
import { ArrowRight, Smartphone, AlertCircle, Bird, Users } from 'lucide-react';
import { AuthStep, User as UserType } from '../types';
import { Button } from './Button';
import { NumPad } from './NumPad';
import { AiAssistant } from './AiAssistant';
import { api } from '../services/api';

interface LoginFlowProps {
  onSuccess: (user: UserType) => void;
}

export const LoginFlow: React.FC<LoginFlowProps> = ({ onSuccess }) => {
  const [step, setStep] = useState<AuthStep>(AuthStep.PHONE);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Safety timeout to prevent infinite loading spinner in UI
  useEffect(() => {
      if (isLoading) {
          const timeout = setTimeout(() => {
              setIsLoading(false);
              setError("Connection timed out. Please try again.");
              setPin('');
          }, 5000); // 5s max wait time before forced reset
          return () => clearTimeout(timeout);
      }
  }, [isLoading]);

  const handlePhoneSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (phoneNumber.length < 11) {
      setError('Please enter a valid 11-digit number');
      return;
    }
    setError('');
    setStep(AuthStep.PIN);
  };

  const handlePinEntry = (val: string) => {
    if (pin.length >= 4) return;

    const newPin = pin + val;
    setPin(newPin);
    
    if (newPin.length === 4) {
      verifyPin(newPin);
    }
  };

  const handleDeletePin = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const verifyPin = async (code: string) => {
    setIsLoading(true);
    setError('');
    
    try {
        const user = await api.login(phoneNumber, code);
        setStep(AuthStep.SUCCESS);
        setTimeout(() => {
            onSuccess(user);
        }, 1000);
    } catch (err: any) {
        console.error("Login error caught in UI:", err);
        setError(err.message === 'Invalid credentials' ? 'Incorrect PIN' : 'Login failed. Check connection.');
        setPin('');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-nova-900">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] bg-emerald-600/20 rounded-full blur-[120px]"></div>
         <div className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] bg-teal-600/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 mb-4 shadow-xl shadow-emerald-500/30 ring-4 ring-emerald-900/50">
            <Users size={36} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">চিরন্তন বন্ধন</h1>
          <p className="text-slate-400">Your Community Savings Hub</p>
        </div>

        {step === AuthStep.PHONE && (
          <div className="animate-slide-up bg-nova-800/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            <form onSubmit={handlePhoneSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2 ml-1">Mobile Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Smartphone className="text-slate-500" size={20} />
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setPhoneNumber(val);
                        setError('');
                    }}
                    className={`w-full bg-nova-900/50 border ${error ? 'border-rose-500 focus:border-rose-500' : 'border-nova-600 focus:border-nova-accent'} rounded-xl py-3.5 pl-11 pr-4 text-lg text-white placeholder-slate-600 focus:outline-none focus:border-nova-accent focus:ring-1 focus:ring-nova-accent transition-all`}
                    placeholder="01712-345678"
                    autoFocus
                  />
                </div>
                {error && (
                    <div className="flex items-center gap-2 mt-2 text-rose-400 text-sm animate-fade-in">
                        <AlertCircle size={14} />
                        <span>{error}</span>
                    </div>
                )}
              </div>

              <Button 
                type="submit" 
                fullWidth 
                isLoading={isLoading}
                disabled={phoneNumber.length < 11}
              >
                <span className="flex items-center gap-2">
                  Access Fund <ArrowRight size={18} />
                </span>
              </Button>
            </form>
          </div>
        )}

        {step === AuthStep.PIN && (
            <div className="animate-slide-up flex flex-col items-center">
                <div className="mb-8 text-center">
                    <p className="text-slate-400 text-sm mb-1">Welcome Member</p>
                    <h2 className="text-xl font-semibold text-white">Enter PIN (Password)</h2>
                </div>
                
                <div className={`flex gap-4 mb-8 ${error ? 'animate-shake' : ''}`}>
                    {[0, 1, 2, 3].map((idx) => (
                        <div 
                            key={idx}
                            className={`w-4 h-4 rounded-full transition-all duration-300 ${
                                idx < pin.length 
                                    ? 'bg-emerald-400 scale-110 shadow-[0_0_15px_rgba(52,211,153,0.6)]' 
                                    : 'bg-nova-700'
                            }`}
                        />
                    ))}
                </div>

                {error && (
                     <div className="flex items-center gap-2 mb-6 text-rose-400 text-sm animate-fade-in bg-rose-500/10 px-4 py-2 rounded-lg">
                        <AlertCircle size={14} />
                        <span>{error}</span>
                    </div>
                )}

                {isLoading ? (
                   <div className="my-8 flex flex-col items-center">
                       <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                       <p className="text-slate-400 text-sm">Verifying...</p>
                   </div>
                ) : (
                    <NumPad 
                        onPress={handlePinEntry} 
                        onDelete={handleDeletePin} 
                        disabled={isLoading}
                    />
                )}
                
                <button 
                    onClick={() => {
                        setStep(AuthStep.PHONE);
                        setPin('');
                        setError('');
                        setIsLoading(false); 
                    }}
                    className="mt-8 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                    Change Account
                </button>
            </div>
        )}

         {step === AuthStep.SUCCESS && (
            <div className="absolute inset-0 flex items-center justify-center z-50 animate-fade-in bg-nova-900">
                <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
                        <Bird className="text-emerald-500 animate-bounce" size={48} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Access Granted</h2>
                    <p className="text-slate-400 mt-2">Syncing with server...</p>
                </div>
            </div>
         )}
      </div>

      <AiAssistant mode="LOGIN_HELP" />
    </div>
  );
};
