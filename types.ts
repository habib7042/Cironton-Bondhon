export interface User {
  id: string;
  name: string;
  phoneNumber: string;
  balance: number;
  token?: string; // Auth token from Backend
  isAdmin?: boolean; // New Admin Flag
}

export interface Transaction {
  id: string;
  merchant?: string; // Keeping for compatibility, but backend uses 'type'
  amount: number;
  date: string;
  category: 'food' | 'travel' | 'shopping' | 'utilities' | 'income';
  type: 'debit' | 'credit';
  status?: 'PENDING' | 'APPROVED' | 'REJECTED'; // New field from Backend
  transaction_type?: 'DEPOSIT' | 'WITHDRAW'; // New field from Backend
  userName?: string; // For Admin view to see who requested
  userId?: string;
}

export interface AiMessage {
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}

export enum AuthStep {
  PHONE = 'PHONE',
  PIN = 'PIN',
  AUTHENTICATING = 'AUTHENTICATING',
  SUCCESS = 'SUCCESS'
}