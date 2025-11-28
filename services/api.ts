import { User, Transaction, MemberFormData } from '../types';

const API_URL = '/api'; // Relative path for Next.js API routes

export const api = {
  login: async (phoneNumber: string, pin: string): Promise<User> => {
    try {
      const fetchPromise = fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, pin }),
      });

      // Strict 5s timeout for login
      const timeoutPromise = new Promise<Response>((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), 5000)
      );

      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) {
         if (response.status === 401) throw new Error('Invalid credentials');
         throw new Error('Server error'); 
      }

      const data = await response.json();
      return {
        id: data.user.id,
        name: data.user.name || 'Member',
        phoneNumber: phoneNumber,
        balance: data.user.balance,
        token: data.token,
        isAdmin: data.user.isAdmin,
        profileImage: data.user.profileImage
      };
    } catch (error: any) {
      if (error.message === 'Invalid credentials') {
          throw error;
      }
      console.error("Login failed", error);
      throw new Error("Connection failed. Please check your internet.");
    }
  },

  getDashboardData: async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/dashboard`, {
        headers: { 'Authorization': `Token ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch dashboard');
      return await response.json();
    } catch (error) {
       console.error("Dashboard fetch failed", error);
       throw error;
    }
  },

  checkRecipient: async (token: string, phoneNumber: string) => {
    try {
      const response = await fetch(`${API_URL}/user/lookup`, {
          method: 'POST',
          headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Token ${token}`
          },
          body: JSON.stringify({ phoneNumber })
      });
      
      if (!response.ok) throw new Error('Recipient not found');
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  createTransaction: async (token: string, type: 'DEPOSIT' | 'WITHDRAW', amount: number) => {
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
    // Note: In a real production app, verify PIN securely via API.
    // For this version, we trust the client-side PIN entry flow in ActionModal before calling this.
    try {
        const response = await fetch(`${API_URL}/transactions`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`
            },
            body: JSON.stringify({ 
                transaction_type: 'TRANSFER', 
                amount,
                recipientPhone
            }),
        });
        if (!response.ok) throw new Error('Transfer failed');
        return await response.json();
    } catch (error) {
        throw error;
    }
  },

  getPendingTransactions: async (token: string) => {
      try {
        const response = await fetch(`${API_URL}/admin/transactions`, {
            headers: { 'Authorization': `Token ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch');
        return await response.json();
      } catch (e) {
          throw e;
      }
  },

  processTransaction: async (token: string, transactionId: string, action: 'APPROVE' | 'REJECT') => {
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
    try {
        const response = await fetch(`${API_URL}/admin/members`, {
            headers: { 'Authorization': `Token ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch members');
        return await response.json();
    } catch (e) {
        throw e;
    }
  },

  getAdminStatement: async (token: string) => {
    const response = await fetch(`${API_URL}/admin/statement`, {
        headers: { 'Authorization': `Token ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch statement');
    return await response.json();
  },

  uploadAvatar: async (token: string, file: File) => {
    // Legacy endpoint specifically for avatar, can use generic uploadFile instead
    const response = await fetch(`/api/user/avatar?filename=${file.name}`, {
      method: 'POST',
      headers: { 'Authorization': `Token ${token}` },
      body: file,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return await response.json();
  },

  uploadFile: async (token: string, file: File, type: 'avatar' | 'nid' | 'document') => {
    const response = await fetch(`/api/upload?filename=${file.name}&type=${type}`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` },
        body: file,
    });

    if (!response.ok) throw new Error('Upload failed');
    return await response.json(); // returns { url: string }
  },

  getFullProfile: async (token: string) => {
      const response = await fetch(`${API_URL}/user/profile`, {
          headers: { 'Authorization': `Token ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch profile');
      return await response.json();
  },

  updateProfile: async (token: string, data: any) => {
      const response = await fetch(`${API_URL}/user/profile`, {
          method: 'POST',
          headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Token ${token}` 
          },
          body: JSON.stringify({ action: 'UPDATE_INFO', ...data })
      });
      if (!response.ok) throw new Error('Update failed');
      return await response.json();
  },

  changePin: async (token: string, oldPin: string, newPin: string) => {
      const response = await fetch(`${API_URL}/user/profile`, {
          method: 'POST',
          headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Token ${token}` 
          },
          body: JSON.stringify({ action: 'CHANGE_PIN', oldPin, newPin })
      });
      
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || 'Failed to change PIN');
      return resData;
  },

  addDocument: async (token: string, docName: string, docUrl: string) => {
      const response = await fetch(`${API_URL}/user/profile`, {
          method: 'POST',
          headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Token ${token}` 
          },
          body: JSON.stringify({ action: 'ADD_DOC', docName, docUrl })
      });
      if (!response.ok) throw new Error('Failed to save document');
      return await response.json();
  },

  // CHAT METHODS
  getChatMessages: async (token: string) => {
      const response = await fetch(`${API_URL}/chat`, {
          headers: { 'Authorization': `Token ${token}` }
      });
      if (!response.ok) return [];
      return await response.json();
  },

  sendChatMessage: async (token: string, message: string) => {
      const response = await fetch(`${API_URL}/chat`, {
          method: 'POST',
          headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Token ${token}` 
          },
          body: JSON.stringify({ message })
      });
      if (!response.ok) throw new Error('Failed to send');
      return await response.json();
  }
};