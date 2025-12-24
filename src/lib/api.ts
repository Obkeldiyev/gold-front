import axios from 'axios';
import { toast } from 'sonner';

const API_BASE_URL = 'http://localhost:9000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000, // 5 second timeout to match our workaround
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const tokens = localStorage.getItem('tokens');
    if (tokens) {
      try {
        const { access_token } = JSON.parse(tokens);
        if (access_token) {
          console.log('Adding token to request:', config.url);
          // Try both formats - most APIs expect Authorization header
          config.headers.Authorization = `Bearer ${access_token}`;
          config.headers.access_token = access_token; // Keep the old format as backup
        } else {
          console.log('No access token found in stored tokens');
        }
      } catch (error) {
        console.error('Error parsing tokens from localStorage:', error);
        localStorage.removeItem('tokens');
        localStorage.removeItem('user');
      }
    } else {
      console.log('No tokens found in localStorage for request:', config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.response?.data?.message,
      pathname: window.location.pathname
    });
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Only redirect if we're not already on the login page
      if (window.location.pathname !== '/login') {
        console.log('Redirecting to login due to auth error');
        localStorage.removeItem('tokens');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export interface LoginResponse {
  success: boolean;
  message: string;
  role?: string;
  tokens?: {
    access_token: string;
    refresh_token: string;
  };
}

export interface Balance {
  id: number;
  balance: number;
  incomes?: Income[];
  outcomes?: Outcome[];
}

export interface Branch {
  id: string; // Changed from number to string to match Prisma schema
  name: string;
  description: string;
  balance: number;
  createdAt?: string;
}

export interface Manager {
  id: number;
  first_name: string;
  second_name: string;
  third_name: string;
  username: string;
  role: string;
  createdAt?: string;
}

export interface SuperAdmin {
  id: number;
  first_name: string;
  second_name: string;
  username: string;
  role: string;
}

export interface Income {
  id: number;
  amount: number;
  status: string;
  balanceId: number;
  createdAt: string;
}

export interface Outcome {
  id: number;
  amount: number;
  status: string;
  balanceId: number;
  createdAt: string;
}

export interface Transaction {
  type: 'INCOME' | 'OUTCOME' | 'BALANCE_TO_BRANCH' | 'BRANCH_TO_BALANCE' | 'BRANCH_TO_BRANCH' | 'UGAR_LOSS';
  amount: number;
  status?: string;
  date: string; // This is createdAt or time from backend
  source?: string; // For INCOME/OUTCOME
  branch?: string; // Branch name
  from?: string; // For BRANCH_TO_BRANCH
  to?: string; // For BRANCH_TO_BRANCH
  reason?: string; // For UGAR_LOSS
  image?: string; // Image URL from backend
  id?: number; // Transaction ID for detail view
}

export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await api.post('/login', { username, password });
    return response.data;
  },
};

export const balanceApi = {
  getBalance: async () => {
    const response = await api.get('/balance');
    return response.data;
  },
  addIncome: async (amount: number, status: string, balanceId: number, image?: File) => {
    try {
      if (image) {
        // Send as FormData if image is provided
        const formData = new FormData();
        formData.append('amount', amount.toString());
        formData.append('status', status);
        formData.append('balanceId', balanceId.toString());
        formData.append('image', image);

        const response = await api.post('/balance/income', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data;
      } else {
        // Send as JSON if no image
        const response = await api.post('/balance/income', { amount, status, balanceId });
        return response.data;
      }
    } catch (error) {
      console.error('Add income error:', error);
      throw error;
    }
  },
  addOutcome: async (amount: number, status: string, balanceId: number, image?: File) => {
    try {
      if (image) {
        // Send as FormData if image is provided
        const formData = new FormData();
        formData.append('amount', amount.toString());
        formData.append('status', status);
        formData.append('balanceId', balanceId.toString());
        formData.append('image', image);

        const response = await api.post('/balance/outcome', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data;
      } else {
        // Send as JSON if no image
        const response = await api.post('/balance/outcome', { amount, status, balanceId });
        return response.data;
      }
    } catch (error) {
      console.error('Add outcome error:', error);
      throw error;
    }
  },
};

export const branchesApi = {
  getAll: async () => {
    const response = await api.get('/branches');
    return response.data;
  },
  getAllTransactions: async () => {
    const response = await api.get('/transactions');
    return response.data;
  },
  getOne: async (id: string) => {
    const response = await api.get('/branches/one', { data: { id } });
    return response.data;
  },
  create: async (name: string, description: string) => {
    const response = await api.post('/branches', { name, description });
    return response.data;
  },
  update: async (oldName: string, newName: string, description: string) => {
    const response = await api.patch('/branches', { oldName, newName, description });
    return response.data;
  },
  delete: async (branchId: string, name: string) => {
    const response = await api.delete('/branches', { data: { branchId, name } });
    return response.data;
  },
  balanceToBranch: async (amount: number, branchId: string, image?: File) => {
    console.log('Balance to Branch API call:', { amount, branchId, hasImage: !!image });
    try {
      // Backend expects FormData because of multer middleware
      const formData = new FormData();
      formData.append('amount', amount.toString());
      formData.append('branchId', branchId); // Keep as string, backend will handle conversion
      if (image) {
        formData.append('image', image);
      }

      const response = await api.post('/branches/receive', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Balance to Branch response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Balance to Branch error details:');
      console.error('- Message:', error.message);
      console.error('- Status:', error.response?.status);
      console.error('- Status Text:', error.response?.statusText);
      console.error('- Response Data:', error.response?.data);
      console.error('- Request URL:', error.config?.url);
      console.error('- Request Method:', error.config?.method);
      throw error;
    }
  },
  branchToBalance: async (amount: number, branchId: string, ugarAmount: number, reason: string, image?: File) => {
    console.log('Branch to Balance API call:', { amount, branchId, ugarAmount, reason, hasImage: !!image });
    try {
      // Backend expects FormData because of multer middleware
      const formData = new FormData();
      formData.append('amount', amount.toString());
      formData.append('branchId', branchId); // Keep as string, backend will handle conversion
      formData.append('ugarAmount', ugarAmount.toString());
      formData.append('reason', reason);
      if (image) {
        formData.append('image', image);
      }

      const response = await api.post('/branches/give', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Branch to Balance response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Branch to Balance error:', error);
      throw error;
    }
  },
  branchToBranch: async (amount: number, fromBranchId: string, toBranchId: string, image?: File) => {
    console.log('Branch to Branch API call:', { amount, fromBranchId, toBranchId, hasImage: !!image });
    try {
      // Backend expects FormData because of multer middleware
      const formData = new FormData();
      formData.append('amount', amount.toString());
      formData.append('fromBranchId', fromBranchId); // Keep as string, backend will handle conversion
      formData.append('toBranchId', toBranchId); // Keep as string, backend will handle conversion
      if (image) {
        formData.append('image', image);
      }

      const response = await api.post('/branches/transaction', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Branch to Branch response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Branch to Branch error:', error);
      throw error;
    }
  },
};

export const managerApi = {
  getAll: async () => {
    const response = await api.get('/manager');
    return response.data;
  },
  create: async (data: {
    first_name: string;
    second_name: string;
    third_name: string;
    username: string;
    password: string;
  }) => {
    const response = await api.post('/manager', data);
    return response.data;
  },
  delete: async (username: string) => {
    const response = await api.delete('/manager', { data: { username } });
    return response.data;
  },
};

export const superAdminApi = {
  getProfile: async () => {
    const response = await api.get('/super-admin');
    return response.data;
  },
  createAdmin: async (data: {
    first_name: string;
    second_name: string;
    username: string;
    password: string;
  }) => {
    const response = await api.post('/super-admin', data);
    return response.data;
  },
  updateProfile: async (first_name: string, second_name: string) => {
    const response = await api.patch('/super-admin/profile', { first_name, second_name });
    return response.data;
  },
  updatePassword: async (oldPassword: string, newPassword: string) => {
    const tokens = localStorage.getItem('tokens');
    const access_token = tokens ? JSON.parse(tokens).access_token : '';
    const response = await api.patch(`/super-admin/password/${access_token}`, { oldPassword, newPassword });
    return response.data;
  },
  updateUsername: async (oldUsername: string, newUsername: string) => {
    const tokens = localStorage.getItem('tokens');
    const access_token = tokens ? JSON.parse(tokens).access_token : '';
    const response = await api.patch(`/super-admin/username/${access_token}`, { oldUsername, newUsername });
    return response.data;
  },
};

export default api;
