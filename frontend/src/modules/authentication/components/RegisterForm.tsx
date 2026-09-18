import React, { useState, FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types/auth.types';
import { Input } from '../../../components/common/Input';
import { PasswordInput } from './PasswordInput';
import { Select } from '../../../components/common/Select';
import { Button } from '../../../components/common/Button';
import { ErrorMessage } from '../../../components/common/ErrorMessage';

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Administrator (Full System Access)' },
  { value: 'INVENTORY_MANAGER', label: 'Inventory Manager (Stock & Adjustments)' },
  { value: 'SALES_MANAGER', label: 'Sales Manager (Orders & Customers)' },
  { value: 'PURCHASE_MANAGER', label: 'Purchase Manager (Purchases & Suppliers)' },
  { value: 'VIEWER', label: 'Viewer (Read-Only Access)' },
];

interface RegisterFormProps {
  onSuccess?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const { register, isLoading, error: authError, clearError } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('INVENTORY_MANAGER');

  const [formErrors, setFormErrors] = useState<{
    full_name?: string;
    email?: string;
    password?: string;
    confirm_password?: string;
    role?: string;
  }>({});

  const validate = (): boolean => {
    const errors: typeof formErrors = {};

    if (!fullName.trim()) {
      errors.full_name = 'Full name cannot be empty';
    } else if (fullName.trim().length < 2) {
      errors.full_name = 'Full name must be at least 2 characters';
    }

    if (!email.trim()) {
      errors.email = 'Email address cannot be empty';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email format';
    }

    if (!password) {
      errors.password = 'Password cannot be empty';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    if (password !== confirmPassword) {
      errors.confirm_password = 'Password and confirm password must match';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validate()) return;

    try {
      await register({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        confirm_password: confirmPassword,
        role,
      });
      if (onSuccess) {
        onSuccess();
      }
    } catch {
      // Error handled in AuthContext
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <ErrorMessage message={authError} onDismiss={clearError} />

      <Input
        label="Full Name"
        type="text"
        placeholder="e.g., Sarah Connor"
        value={fullName}
        onChange={(e) => {
          setFullName(e.target.value);
          if (formErrors.full_name) setFormErrors((prev) => ({ ...prev, full_name: undefined }));
        }}
        error={formErrors.full_name}
        disabled={isLoading}
        required
      />

      <Input
        label="Email Address"
        type="email"
        placeholder="e.g., sarah@stockit.local"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: undefined }));
        }}
        error={formErrors.email}
        disabled={isLoading}
        required
      />

      <PasswordInput
        label="Password"
        placeholder="At least 6 characters"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          if (formErrors.password) setFormErrors((prev) => ({ ...prev, password: undefined }));
        }}
        error={formErrors.password}
        disabled={isLoading}
        required
      />

      <PasswordInput
        label="Confirm Password"
        placeholder="Re-enter your password"
        value={confirmPassword}
        onChange={(e) => {
          setConfirmPassword(e.target.value);
          if (formErrors.confirm_password)
            setFormErrors((prev) => ({ ...prev, confirm_password: undefined }));
        }}
        error={formErrors.confirm_password}
        disabled={isLoading}
        required
      />

      <Select
        label="System Role"
        options={ROLE_OPTIONS}
        value={role}
        onChange={(e) => setRole(e.target.value as UserRole)}
        error={formErrors.role}
        disabled={isLoading}
      />

      <Button
        type="submit"
        variant="primary"
        size="md"
        isLoading={isLoading}
        className="w-full mt-2"
      >
        Create Account
      </Button>
    </form>
  );
};
