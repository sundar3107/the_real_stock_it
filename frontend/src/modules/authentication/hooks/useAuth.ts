import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { IAuthContextState } from '../types/auth.types';

export function useAuth(): IAuthContextState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
