import React, { createContext, useState, useEffect, ReactNode } from 'react';
import {
  IAuthContextState,
  ILoginCredentials,
  IRegisterData,
  IUpdateProfileData,
  IUser,
} from '../types/auth.types';
import { authService } from '../services/authService';
import { tokenStorage } from '../utils/tokenStorage';

export const AuthContext = createContext<IAuthContextState | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [token, setToken] = useState<string | null>(tokenStorage.getToken());
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = tokenStorage.getToken();
      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await authService.getCurrentUser();
        setUser(data.user);
        setPermissions(data.permissions || []);
      } catch (err) {
        console.warn('Authentication token expired or invalid:', err);
        tokenStorage.removeToken();
        setToken(null);
        setUser(null);
        setPermissions([]);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: ILoginCredentials): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await authService.login(credentials);
      tokenStorage.setToken(result.token);
      setToken(result.token);
      setUser(result.user);

      // Fetch permissions for the logged in user
      const userDetails = await authService.getCurrentUser();
      setPermissions(userDetails.permissions || []);
    } catch (err: any) {
      const message = err.message || 'Login failed. Please check your credentials.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: IRegisterData): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await authService.register(data);
      tokenStorage.setToken(result.token);
      setToken(result.token);
      setUser(result.user);

      const userDetails = await authService.getCurrentUser();
      setPermissions(userDetails.permissions || []);
    } catch (err: any) {
      const message = err.message || 'Registration failed. Please try again.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      tokenStorage.removeToken();
      setToken(null);
      setUser(null);
      setPermissions([]);
      setError(null);
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: IUpdateProfileData): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await authService.updateProfile(data);
      setUser(updated);
    } catch (err: any) {
      const message = err.message || 'Failed to update profile';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  const value: IAuthContextState = {
    user,
    token,
    permissions,
    isAuthenticated: !!user && !!token,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
