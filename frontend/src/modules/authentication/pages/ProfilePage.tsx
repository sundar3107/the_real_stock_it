import React from 'react';
import { UserProfile } from '../components/UserProfile';

export const ProfilePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Account Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your identity and profile preferences.</p>
      </div>
      <UserProfile />
    </div>
  );
};
