import { create } from 'zustand';
export const useSecurityStore = create((set) => ({
    user: null,
    projectId: '',
    token: null,
    setUser: (user) => set({ user }),
    setToken: (token) => set({ token }),
    setProjectId: (projectId) => set({ projectId }),
    clearUser: () => set({ user: null, token: null })
}));
