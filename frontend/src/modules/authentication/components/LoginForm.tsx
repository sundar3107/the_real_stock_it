import React, { useState, FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../../../components/common/Input';
import { PasswordInput } from './PasswordInput';
import { Button } from '../../../components/common/Button';
import { ErrorMessage } from '../../../components/common/ErrorMessage';

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { login, isLoading, error: authError, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validate()) return;

    try {
      await login({ email: email.trim(), password });
      if (onSuccess) {
        onSuccess();
      }
    } catch {
      // Error handled via AuthContext
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <ErrorMessage message={authError} onDismiss={clearError} />

      <Input
        label="Email Address"
        type="email"
        placeholder="e.g., admin@stockit.local"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: undefined }));
        }}
        error={formErrors.email}
        disabled={isLoading}
        autoComplete="email"
        required
      />

      <PasswordInput
        label="Password"
        placeholder="Enter your account password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          if (formErrors.password) setFormErrors((prev) => ({ ...prev, password: undefined }));
        }}
        error={formErrors.password}
        disabled={isLoading}
        autoComplete="current-password"
        required
      />

      <Button
        type="submit"
        variant="primary"
        size="md"
        isLoading={isLoading}
        className="w-full mt-2"
      >
        Sign In
      </Button>
    </form>
  );
};
