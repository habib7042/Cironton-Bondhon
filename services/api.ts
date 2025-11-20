
import { User, Transaction, MemberFormData } from '../types';

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

const MOCK_MEMBERS_LIST = [
    {
        id: 'mock-user-1',
        name: 'Shakib Al Hasan',
        phoneNumber: '01712345678',
        balance: 12500.00,
        fatherName: 'Masroor Reza',
        motherName: 'Shirin Reza',
        nid: '1987567890123',
        dob: '1987-03-24',
        address: 'Magura, Bangladesh',
        nomineeName: 'Umme Ahmed Shishir',
        nomineeNid: '1990123456789'
    },
    {
        id: 'mock-user-2',
        name: 'Tamim Iqbal',
        phoneNumber: '01700000001',
        balance: 8500.00,
        fatherName: 'Iqbal Khan',
        motherName: 'Nusrat Iqbal',
        nid: '1989123456789',
        dob: '1989-03-20',
        address: 'Chittagong, Bangladesh',
        nomineeName: 'Ayesha Siddiqa',
        nomineeNid: '1992123456789'
    }
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  login: async (phoneNumber: string, pin: string): Promise<User> => {
    // 1. FAST PATH: Explicitly handle Demo Accounts immediately to bypass network/DB cold starts
    if (pin === '1234') {
        if (phoneNumber === '01799999999') {
            await delay(500);
            return { ...MOCK_ADMIN, phoneNumber, balance: parseFloat(MOCK_ADMIN.balance), token: 'mock-admin-token' };
        }
        if (phoneNumber === '01712345678') {
            await delay(500);
            return { 
                id: MOCK_USER.id, 
                name: MOCK_USER.name, 
                phoneNumber, 
                balance: parseFloat(MOCK_USER.balance), 
                token: 'mock-token-demo', 
                isAdmin: false 
            };
        }
    }

    // 2. NETWORK PATH: Try real login with strict 2.5s timeout
    try {
      const fetchPromise = fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, pin }),
      });

      const timeoutPromise = new Promise<Response>((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), 2500)
      );

      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) {
         // If 401, it's legitimate Invalid Credentials
         if (response.status === 401) throw new Error('Invalid credentials');
         // Any other error (404, 500) triggers fallback
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
      
      // If it's a wrong PIN, rethrow so UI shows "Incorrect PIN"
      if (error.message === 'Invalid credentials') {
          throw error;
      }

      console.warn("API unreachable or timeout. Switching to MOCK MODE.", error);
      
      // Fallback: If it looks like a valid number/pin, let them in as Demo User
      if (phoneNumber.length >= 11 && pin.length === 4) {
          await delay(300); // Small UX delay
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
    if (token.startsWith('mock-')) {
        await delay(600);
        return {
            balance: token === 'mock-admin-token' ? MOCK_ADMIN.balance : MOCK_USER.balance,
            transactions: MOCK_TRANSACTIONS
        };
    }

    try {
      const fetchPromise = fetch(`${API_URL}/dashboard`, {
        headers: { 'Authorization': `Token ${token}` },
      });
      const timeoutPromise = new Promise<Response>((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), 3000)
      );
      
      const response = await Promise.race([fetchPromise, timeoutPromise]);

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

  // Add a specific method to check recipient name
  checkRecipient: async (token: string, phoneNumber: string) => {
      await delay(600);
      
      if (token.startsWith('mock-')) {
          const member = MOCK_MEMBERS_LIST.find(m => m.phoneNumber === phoneNumber);
          if (member) return { name: member.name };
          
          // Simulate finding random names for other numbers in demo
          if (phoneNumber === '01700000000') return { name: 'Demo Receiver' };
          
          throw new Error("Recipient not found");
      }

      // For real API, you would call an endpoint here
      // For now, fallback to error or mock
      throw new Error("Recipient lookup failed");
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
        MOCK_PENDING_REQUESTS.push(newTx as any);
        MOCK_TRANSACTIONS.unshift({ ...newTx, amount: amount.toFixed(2) } as any);
        return newTx;
    }

    try {
      const response = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ transaction_type: type, amount }),
      });
      if (!response.ok) throw new Error('Transaction failed');
      return await response.json();
    } catch (error) {
        console.error("Transaction failed", error);
        throw error;
    }
  },

  transferMoney: async (token: string, recipientPhone: string, amount: number, pin: string) => {
    await delay(1000); // Simulate network

    // Mock PIN Verification (In real app, this goes to backend)
    if (pin !== '1234') {
        throw new Error('Incorrect PIN');
    }

    if (token.startsWith('mock-')) {
        // Check balance
        const currentBalance = parseFloat(MOCK_USER.balance);
        if (currentBalance < amount) {
            throw new Error('Insufficient balance');
        }

        // Deduct balance mock immediately so Dashboard updates
        const newBalance = (currentBalance - amount).toFixed(2);
        MOCK_USER.balance = newBalance;
        
        const newTx = {
            id: Math.floor(Math.random() * 10000),
            transaction_type: 'TRANSFER',
            amount: amount.toFixed(2),
            status: 'APPROVED',
            created_at: new Date().toISOString(),
            userName: MOCK_USER.name,
            userId: MOCK_USER.id,
            recipientPhone: recipientPhone
        };
        
        MOCK_TRANSACTIONS.unshift(newTx as any);
        return newTx;
    }
    
    // Real backend implementation would go here
    throw new Error("Transfer service unavailable (Mock Mode Only)");
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
        if (!response.ok) throw new Error('Failed to fetch');
        return await response.json();
      } catch (e) {
          return MOCK_PENDING_REQUESTS; 
      }
  },

  processTransaction: async (token: string, transactionId: string, action: 'APPROVE' | 'REJECT') => {
      if (token === 'mock-admin-token') {
          await delay(500);
          const txIndex = MOCK_PENDING_REQUESTS.findIndex(t => t.id.toString() === transactionId);
          if (txIndex === -1) return { success: false };
          const tx = MOCK_PENDING_REQUESTS[txIndex];

          const userTx = MOCK_TRANSACTIONS.find(t => t.id === tx.id);

          if (action === 'APPROVE') {
              if (userTx) userTx.status = 'APPROVED';
              
              // Mock Balance Update
              if (tx.userId === MOCK_USER.id) {
                  const amt = typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount;
                  if (tx.transaction_type === 'DEPOSIT') {
                      MOCK_USER.balance = (parseFloat(MOCK_USER.balance) + amt).toFixed(2);
                  } else {
                      MOCK_USER.balance = (parseFloat(MOCK_USER.balance) - amt).toFixed(2);
                  }
              }
          } else {
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
      if (!response.ok) throw new Error('Failed to process');
      return await response.json();
  },

  addMember: async (token: string, data: MemberFormData) => {
    if (token === 'mock-admin-token') {
        await delay(1000);
        console.log("Mock Member Added:", data);
        // Add to mock list dynamically
        MOCK_MEMBERS_LIST.push({
            id: `mock-user-${Math.random()}`,
            balance: 0,
            ...data
        });
        return { success: true };
    }

    const response = await fetch(`${API_URL}/admin/members`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to add member');
    }
    return await response.json();
  },

  getMembers: async (token: string) => {
    if (token === 'mock-admin-token') {
        await delay(600);
        return MOCK_MEMBERS_LIST;
    }
    try {
        const response = await fetch(`${API_URL}/admin/members`, {
            headers: { 'Authorization': `Token ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch members');
        return await response.json();
    } catch (e) {
        console.warn("Using mock members data due to fetch error");
        return MOCK_MEMBERS_LIST;
    }
  },

  getAdminStatement: async (token: string) => {
    if (token === 'mock-admin-token') {
        await delay(800);
        // Generate a mix of transactions for the report
        return [
            ...MOCK_TRANSACTIONS.map(t => ({...t, userName: MOCK_USER.name, phoneNumber: '01712345678'})),
            ...MOCK_PENDING_REQUESTS.map(t => ({...t, userName: t.userName})),
            // Add some historical mock data
            { id: 901, transaction_type: 'DEPOSIT', amount: 5000, status: 'APPROVED', created_at: new Date('2023-01-15').toISOString(), userName: 'Tamim Iqbal', phoneNumber: '01700000001' },
            { id: 902, transaction_type: 'WITHDRAW', amount: 1000, status: 'APPROVED', created_at: new Date('2023-02-10').toISOString(), userName: 'Tamim Iqbal', phoneNumber: '01700000001' },
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    try {
        const response = await fetch(`${API_URL}/admin/statement`, {
            headers: { 'Authorization': `Token ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch statement');
        return await response.json();
    } catch (e) {
        console.error(e);
        throw new Error("Failed to generate statement");
    }
  }
};
