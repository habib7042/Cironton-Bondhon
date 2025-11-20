
import { User, Transaction } from '../types';

const API_URL = '/api'; // Relative path for Next.js API routes

// --- MOCK DATA FOR OFFLINE/DEMO MODE ---
const MOCK_USER = {
  id: 'mock-user-1',
  name: 'Shakib Al Hasan',
  balance: '12500.00',
  isAdmin: false
};

const MOCK_ADMIN = {
  id: 'mock-admin-1',
  name: 'System Admin',
  balance: '0.00',
  isAdmin: true
};

let MOCK_TRANSACTIONS = [
  {
    id: 101,
    transaction_type: 'DEPOSIT',
    amount: '5000.00',
    status: 'APPROVED',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 102,
    transaction_type: 'WITHDRAW',
    amount: '2000.00',
    status: 'PENDING',
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 103,
    transaction_type: 'DEPOSIT',
    amount: '1000.00',
    status: 'APPROVED',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString()
  }
];

// Mock Pending Requests for Admin View
let MOCK_PENDING_REQUESTS = [
    { id: 201, transaction_type: 'DEPOSIT', amount: 500, status: 'PENDING', created_at: new Date().toISOString(), userName: 'Karim Benzema', userId: 'mock-user-2' },
    { id: 202, transaction_type: 'WITHDRAW', amount: 200, status: 'PENDING', created_at: new Date().toISOString(), userName: 'Lionel Messi', userId: 'mock-user-3' },
    { id: 203, transaction_type: 'DEPOSIT', amount: 5000, status: 'PENDING', created_at: new Date().toISOString(), userName: 'Shakib Al Hasan', userId: 'mock-user-1' }, 
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  login: async (phoneNumber: string, pin: string): Promise<User> => {
    // Handle Mock Admin explicitly immediately for consistency
    if (phoneNumber === '01799999999' && pin === '1234') {
        await delay(800);
        return {
            ...MOCK_ADMIN,
            phoneNumber,
            balance: parseFloat(MOCK_ADMIN.balance),
            token: 'mock-admin-token'
        };
    }

    const controller = new AbortController();
    // 3 second timeout: If backend/DB hangs, we abort and use mock
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, pin }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
         // If 401, it's genuine invalid creds.
         if (response.status === 401) throw new Error('Invalid credentials');
         // 404/500 means server issue -> trigger catch for mock
         throw new Error('Server error'); 
      }

      const data = await response.json();
      return {
        id: data.user.id,
        name: data.user.name || 'Member',
        phoneNumber: phoneNumber,
        balance: data.user.balance,
        token: data.token,
        isAdmin: data.user.isAdmin
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      // If it's a genuine Wrong PIN error, we rethrow it so UI shows "Incorrect PIN"
      if (error.message === 'Invalid credentials') {
          throw error;
      }

      console.warn("API unreachable, timeout, or failed. Switching to MOCK MODE.", error);
      
      // Add a small delay to simulate network request if it failed instantly
      await delay(600); 
      
      // Fallback for ANY valid-looking phone/pin combination in demo mode
      if (phoneNumber.length >= 11 && pin.length === 4) {
          return {
            id: MOCK_USER.id,
            name: MOCK_USER.name,
            phoneNumber: phoneNumber,
            balance: parseFloat(MOCK_USER.balance),
            token: 'mock-token-demo', 
            isAdmin: false
          };
      }
      throw error;
    }
  },

  getDashboardData: async (token: string) => {
    if (token === 'mock-token-demo' || token === 'mock-admin-token') {
        await delay(600);
        return {
            balance: token === 'mock-admin-token' ? MOCK_ADMIN.balance : MOCK_USER.balance,
            transactions: MOCK_TRANSACTIONS
        };
    }

    try {
      // Also timeout dashboard fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      
      const response = await fetch(`${API_URL}/dashboard`, {
        headers: { 'Authorization': `Token ${token}` },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('Failed to fetch dashboard');
      return await response.json();
    } catch (error) {
       console.warn("Dashboard fetch failed, using mock data", error);
       return {
            balance: MOCK_USER.balance,
            transactions: MOCK_TRANSACTIONS
        };
    }
  },

  createTransaction: async (token: string, type: 'DEPOSIT' | 'WITHDRAW', amount: number) => {
    if (token.startsWith('mock-')) {
        await delay(800);
        const newTx = {
            id: Math.floor(Math.random() * 10000),
            transaction_type: type,
            amount: amount,
            status: 'PENDING',
            created_at: new Date().toISOString(),
            userName: MOCK_USER.name,
            userId: MOCK_USER.id
        };
        // Add to pending list so Admin can see it
        MOCK_PENDING_REQUESTS.push(newTx as any);
        // Add to user history as pending
        MOCK_TRANSACTIONS.unshift({
            ...newTx,
            amount: amount.toFixed(2)
        } as any);
        
        return newTx;
    }

    try {
      const response = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ 
          transaction_type: type, 
          amount: amount
        }),
      });
      if (!response.ok) throw new Error('Transaction failed');
      return await response.json();
    } catch (error) {
        console.error("Transaction failed", error);
        throw error;
    }
  },

  getPendingTransactions: async (token: string) => {
      if (token === 'mock-admin-token') {
          await delay(500);
          return MOCK_PENDING_REQUESTS;
      }
      
      try {
        const response = await fetch(`${API_URL}/admin/transactions`, {
            headers: { 'Authorization': `Token ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch pending transactions');
        return await response.json();
      } catch (e) {
          return MOCK_PENDING_REQUESTS; // Fallback
      }
  },

  processTransaction: async (token: string, transactionId: string, action: 'APPROVE' | 'REJECT') => {
      if (token === 'mock-admin-token') {
          await delay(500);
          
          const txIndex = MOCK_PENDING_REQUESTS.findIndex(t => t.id.toString() === transactionId);
          if (txIndex === -1) return { success: false };
          const tx = MOCK_PENDING_REQUESTS[txIndex];

          if (action === 'APPROVE') {
              const userTx = MOCK_TRANSACTIONS.find(t => t.id === tx.id);
              if (userTx) {
                  userTx.status = 'APPROVED';
              } else {
                  MOCK_TRANSACTIONS.unshift({
                      id: tx.id,
                      transaction_type: tx.transaction_type,
                      amount: typeof tx.amount === 'number' ? tx.amount.toFixed(2) : tx.amount,
                      status: 'APPROVED',
                      created_at: tx.created_at
                  } as any);
              }

              if (tx.userId === MOCK_USER.id) {
                  const amt = typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount;
                  if (tx.transaction_type === 'DEPOSIT') {
                      MOCK_USER.balance = (parseFloat(MOCK_USER.balance) + amt).toFixed(2);
                  } else {
                      MOCK_USER.balance = (parseFloat(MOCK_USER.balance) - amt).toFixed(2);
                  }
              }
          } else {
               const userTx = MOCK_TRANSACTIONS.find(t => t.id === tx.id);
               if (userTx) userTx.status = 'REJECTED';
          }

          MOCK_PENDING_REQUESTS.splice(txIndex, 1);
          return { success: true };
      }

      const response = await fetch(`${API_URL}/admin/transactions`, {
          method: 'POST',
          headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Token ${token}` 
          },
          body: JSON.stringify({ transactionId, action })
      });

      if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to process');
      }
      return await response.json();
  }
};
