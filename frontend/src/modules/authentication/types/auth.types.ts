export type UserRole = 'ADMIN' | 'INVENTORY_MANAGER' | 'SALES_MANAGER' | 'PURCHASE_MANAGER' | 'VIEWER';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface IUser {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface IRole {
  id: string;
  name: UserRole;
  description: string;
  created_at: string;
}

export interface ILoginCredentials {
  email: string;
  password: string;
}

export interface IRegisterData {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
  role: UserRole;
}

export interface IUpdateProfileData {
  full_name?: string;
  email?: string;
}

export interface IAuthResponse {
  token: string;
  user: IUser;
}

export interface IAuthContextState {
  user: IUser | null;
  token: string | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: ILoginCredentials) => Promise<void>;
  register: (data: IRegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: IUpdateProfileData) => Promise<void>;
  clearError: () => void;
}
