import { create } from 'zustand';
import { User } from '../types/security.types.js';

interface SecurityStore {
  user: User | null;
  projectId: string;
  token: string | null;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setProjectId: (projectId: string) => void;
  clearUser: () => void;
}

export const useSecurityStore = create<SecurityStore>((set) => ({
  user: null,
  projectId: '',
  token: null,
  setUser: (user: User) => set({ user }),
  setToken: (token: string) => set({ token }),
  setProjectId: (projectId: string) => set({ projectId }),
  clearUser: () => set({ user: null, token: null })
}));
