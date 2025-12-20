import axios from 'axios';
import { toast } from 'sonner';

const API_BASE_URL = 'http://localhost:9000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const tokens = localStorage.getItem('tokens');
    if (tokens) {
      const { access_token } = JSON.parse(tokens);
      config.headers.access_token = access_token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token expired or invalid
      localStorage.removeItem('tokens');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types
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
}

export interface Branch {
  id: number;
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

// Auth API
export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await api.post('/login', { username, password });
    return response.data;
  },
};

// Balance API
export const balanceApi = {
  getBalance: async () => {
    const response = await api.get('/balance');
    return response.data;
  },
  addIncome: async (amount: number, status: string, balanceId: number) => {
    const response = await api.post('/balance/income', { amount, status, balanceId });
    return response.data;
  },
  addOutcome: async (amount: number, status: string, balanceId: number) => {
    const response = await api.post('/balance/outcome', { amount, status, balanceId });
    return response.data;
  },
};

// Branches API
export const branchesApi = {
  getAll: async () => {
    const response = await api.get('/branches');
    return response.data;
  },
  getOne: async (id: number) => {
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
  delete: async (branchId: number, name: string) => {
    const response = await api.delete('/branches', { data: { branchId, name } });
    return response.data;
  },
  balanceToBranch: async (amount: number, branchId: number) => {
    const response = await api.post('/branches/receive', { amount, branchId });
    return response.data;
  },
  branchToBalance: async (amount: number, branchId: number, ugarAmount: number, reason: string) => {
    const response = await api.post('/branches/give', { amount, branchId, ugarAmount, reason });
    return response.data;
  },
  branchToBranch: async (amount: number, fromBranchId: number, toBranchId: number) => {
    const response = await api.post('/branches/transaction', { amount, fromBranchId, toBranchId });
    return response.data;
  },
};

// Manager API
export const managerApi = {
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

// Super Admin API
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
