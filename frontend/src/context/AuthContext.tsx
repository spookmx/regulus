'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, UserProfile } from '@/lib/types';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  setRole: (role: UserRole) => void;
  switchUserRole: (role: UserRole) => void;
  canWriteLRD: boolean;
  canApproveLRD: boolean;
  canSignDecision: boolean;
  canWriteArtifacts: boolean;
  canApproveBRDPRD: boolean;
  canWriteMilestones: boolean;
  canWriteTasks: boolean;
  canManageUsers: boolean;
  isReadOnly: boolean;
}

export const MOCK_USERS: Record<UserRole, UserProfile> = {
  legal_counsel: {
    uid: 'usr-legal-1',
    name: 'Elena Rostova',
    email: 'elena.rostova@regulus.internal',
    role: 'legal_counsel',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
  pm_owner: {
    uid: 'usr-pm-1',
    name: 'Sarah Chen',
    email: 'sarah.chen@regulus.internal',
    role: 'pm_owner',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  },
  pgm_lead: {
    uid: 'usr-pgm-1',
    name: 'Marcus Vance',
    email: 'marcus.vance@regulus.internal',
    role: 'pgm_lead',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  bu_lead: {
    uid: 'usr-bu-1',
    name: 'Julian Thorne',
    email: 'julian.thorne@regulus.internal',
    role: 'bu_lead',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  eng_lead: {
    uid: 'usr-eng-1',
    name: 'David Kim',
    email: 'david.kim@regulus.internal',
    role: 'eng_lead',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
  portfolio_admin: {
    uid: 'usr-admin-1',
    name: 'Admin Operational Center',
    email: 'admin@regulus.internal',
    role: 'portfolio_admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  },
  viewer: {
    uid: 'usr-viewer-1',
    name: 'Audit Viewer',
    email: 'auditor@external.org',
    role: 'viewer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>('legal_counsel');
  const [user, setUser] = useState<UserProfile | null>(MOCK_USERS['legal_counsel']);

  useEffect(() => {
    setUser(MOCK_USERS[role]);
  }, [role]);

  const switchUserRole = (newRole: UserRole) => {
    setRole(newRole);
    setUser(MOCK_USERS[newRole]);
  };

  const canWriteLRD = role === 'legal_counsel' || role === 'portfolio_admin';
  const canApproveLRD = role === 'legal_counsel' || role === 'portfolio_admin';
  const canSignDecision = role === 'legal_counsel' || role === 'pm_owner' || role === 'portfolio_admin';
  const canWriteArtifacts = role === 'pm_owner' || role === 'legal_counsel' || role === 'portfolio_admin';
  const canApproveBRDPRD = role === 'pm_owner' || role === 'bu_lead' || role === 'portfolio_admin';
  const canWriteMilestones = role === 'pgm_lead' || role === 'pm_owner' || role === 'portfolio_admin';
  const canWriteTasks = role === 'pgm_lead' || role === 'pm_owner' || role === 'portfolio_admin';
  const canManageUsers = role === 'portfolio_admin';
  const isReadOnly = role === 'viewer';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        setRole,
        switchUserRole,
        canWriteLRD,
        canApproveLRD,
        canSignDecision,
        canWriteArtifacts,
        canApproveBRDPRD,
        canWriteMilestones,
        canWriteTasks,
        canManageUsers,
        isReadOnly,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
