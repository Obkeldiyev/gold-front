import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authApi, LoginResponse } from "@/lib/api";

interface User {
  role: "super_admin" | "manager";
}

interface Tokens {
  access_token: string;
  refresh_token: string;
}

interface AuthContextType {
  user: User | null;
  tokens: Tokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<LoginResponse>;
  logout: () => void;
  isSuperAdmin: boolean;
  isManager: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 🔧 normalize backend role
const normalizeRole = (role: string): User["role"] => {
  if (role === "super admin") return "super_admin";
  return role as User["role"];
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<Tokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🔁 Load auth from localStorage ONCE
  useEffect(() => {
    const loadAuth = async () => {
      try {
        const storedTokens = localStorage.getItem("tokens");
        const storedUser = localStorage.getItem("user");

        console.log('Loading auth from localStorage:', { 
          hasTokens: !!storedTokens, 
          hasUser: !!storedUser 
        });

        if (storedTokens && storedUser) {
          const parsedTokens = JSON.parse(storedTokens);
          const parsedUser = JSON.parse(storedUser);

          console.log('Parsed auth data:', { 
            hasAccessToken: !!parsedTokens.access_token, 
            userRole: parsedUser.role 
          });

          if (parsedTokens.access_token && parsedUser.role) {
            setTokens(parsedTokens);
            setUser(parsedUser);
            console.log('Auth loaded successfully');
          } else {
            console.log('Invalid auth data, clearing localStorage');
            localStorage.clear();
          }
        } else {
          console.log('No auth data found in localStorage');
        }
      } catch (err) {
        console.error("Auth load error:", err);
        localStorage.clear();
      } finally {
        setIsLoading(false);
      }
    };

    loadAuth();
  }, []);

  // 🔐 LOGIN
  const login = async (
    username: string,
    password: string
  ): Promise<LoginResponse> => {
    const response = await authApi.login(username, password);

    if (response.success && response.tokens && response.role) {
      const userData: User = {
        role: normalizeRole(response.role),
      };

      localStorage.setItem("tokens", JSON.stringify(response.tokens));
      localStorage.setItem("user", JSON.stringify(userData));

      setTokens(response.tokens);
      setUser(userData);
    }

    return response;
  };

  // 🚪 LOGOUT
  const logout = () => {
    localStorage.clear();
    setTokens(null);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    tokens,
    isLoading,
    isAuthenticated: !!user && !!tokens,
    login,
    logout,
    isSuperAdmin: user?.role === "super_admin",
    isManager: user?.role === "manager",
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
