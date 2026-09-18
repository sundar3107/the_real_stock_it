export type UserRole = 'ADMIN' | 'INVENTORY_MANAGER' | 'SALES_MANAGER' | 'PURCHASE_MANAGER' | 'VIEWER';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface IRole {
  id: string;
  name: UserRole;
  description: string;
  created_at: string;
}

export interface IUser {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  role_id: string;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface IUserResponse {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface ILoginRequest {
  email?: string;
  password?: string;
}

export interface IRegisterRequest {
  full_name?: string;
  email?: string;
  password?: string;
  confirm_password?: string;
  role?: UserRole;
}

export interface IUpdateProfileRequest {
  full_name?: string;
  email?: string;
}

export interface IAuthResponse {
  token: string;
  user: IUserResponse;
}

export interface IJwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}
