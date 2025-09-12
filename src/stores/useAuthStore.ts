import { create } from 'zustand';
import { auth } from '../config/firebase';
import type { BackendUser } from '../services/backendAuthService';

type FirebaseUser = typeof auth.currentUser;

interface AuthState {
  // Firebase 用戶資料
  firebaseUser: FirebaseUser;
  // 後端用戶資料
  backendUser: BackendUser | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  setFirebaseUser: (user: FirebaseUser) => void;
  setBackendUser: (user: BackendUser | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAuth: () => void;
  
  // Computed
  isAuthenticated: () => boolean;
  isFullyAuthenticated: () => boolean; // Firebase + 後端都認證成功
}

export const useAuthStore = create<AuthState>((set, get) => ({
  firebaseUser: null,
  backendUser: null,
  loading: true,
  error: null,
  
  setFirebaseUser: (user) => set({ firebaseUser: user }),
  setBackendUser: (user) => set({ backendUser: user }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  clearAuth: () => {
    // 清理 store 狀態
    set({ 
      firebaseUser: null, 
      backendUser: null, 
      error: null 
    });
    
    // 清理 localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
  },
  
  isAuthenticated: () => {
    const state = get();
    // 如果有 Firebase 用戶或後端用戶，就算已認證
    return state.firebaseUser !== null || state.backendUser !== null;
  },
  
  isFullyAuthenticated: () => {
    const state = get();
    // 檢查是否有有效的後端認證（最重要）
    if (state.backendUser !== null) {
      return true;
    }
    
    // 如果沒有後端用戶但有儲存的 token，也算部分認證
    const hasStoredToken = localStorage.getItem('authToken') || localStorage.getItem('refreshToken');
    return hasStoredToken !== null;
  },
}));
