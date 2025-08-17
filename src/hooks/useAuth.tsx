import { useState, useEffect } from 'react';

export interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  username?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export const useAuth = () => {
  return {
    user: null,
    session: null,
    profile: null,
    loading: false,
    signOut: () => {},
    updateProfile: async () => ({}),
    isAuthenticated: false
  };
};