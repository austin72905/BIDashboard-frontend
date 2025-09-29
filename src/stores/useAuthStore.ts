import { create } from 'zustand';
import { auth } from '../config/firebase';
import type { BackendUser } from '../services/backendAuthService';

type FirebaseUser = typeof auth.currentUser;

interface AuthState {
  // Firebase 用戶資料
  firebaseUser: FirebaseUser;
  // 後端用戶資料
  backendUser: BackendUser | null;
  // Access Token (存在記憶體中)
  accessToken: string | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  setFirebaseUser: (user: FirebaseUser) => void;
  setBackendUser: (user: BackendUser | null) => void;
  setAccessToken: (token: string | null) => void;
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
  accessToken: null,
  loading: true,
  error: null,
  
  setFirebaseUser: (user) => set({ firebaseUser: user }),
  setBackendUser: (user) => set({ backendUser: user }),
  setAccessToken: (token) => set({ accessToken: token }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  clearAuth: () => {
    // 清理 store 狀態
    set({ 
      firebaseUser: null, 
      backendUser: null, 
      accessToken: null,
      error: null 
    });
    
    // 只清理 localStorage 中的 refreshToken，accessToken 現在存在 store 中
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
    if (state.backendUser !== null && state.accessToken !== null) {
      return true;
    }
    
    // 如果有 accessToken，算作已認證（即使沒有用戶資料）
    if (state.accessToken !== null) {
      return true;
    }
    
    // 不再依賴 localStorage 中的 refreshToken 來判斷認證狀態
    // 因為 refreshToken 過期時需要重新登入
    return false;
  },
}));
