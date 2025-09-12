import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { 
  oauthLogin, 
  backendLogout, 
  initializeAuth, 
  type BackendUser 
} from './backendAuthService';

type FirebaseUser = typeof auth.currentUser;

export interface CompleteAuthResult {
  firebaseUser: FirebaseUser;
  backendUser: BackendUser;
}

// 完整的 Google 登入流程（Firebase + 後端）
export const signInWithGoogle = async (): Promise<CompleteAuthResult> => {
  try {
    console.log('🔄 開始 Google 登入流程...');
    
    // 步驟 1: Firebase Google 登入
    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;
    
    console.log('✅ Firebase 登入成功:', firebaseUser.displayName);
    
    // 步驟 2: 取得 Firebase ID Token
    const idToken = await firebaseUser.getIdToken();
    console.log('🔐 已取得 Firebase ID Token');
    
    // 步驟 3: 發送 ID Token 到後端進行驗證
    const backendAuthResult = await oauthLogin(idToken);
    
    console.log('✅ 完整登入流程成功完成');
    
    return {
      firebaseUser,
      backendUser: backendAuthResult.user
    };
  } catch (error: any) {
    console.error('❌ 登入流程失敗:', error);
    
    // 如果後端認證失敗，也要登出 Firebase
    try {
      await signOut(auth);
    } catch (signOutError) {
      console.error('❌ Firebase 登出失敗:', signOutError);
    }
    
    throw new Error(error.message || '登入失敗，請稍後再試');
  }
};

// 完整的登出流程（Firebase + 後端）
export const logout = async (): Promise<void> => {
  try {
    console.log('🔄 開始登出流程...');
    
    // 步驟 1: 後端登出
    await backendLogout();
    
    // 步驟 2: Firebase 登出
    await signOut(auth);
    
    console.log('✅ 完整登出流程成功');
  } catch (error) {
    console.error('❌ 登出失敗:', error);
    
    // 即使出錯，也嘗試清理 Firebase 狀態
    try {
      await signOut(auth);
    } catch (firebaseError) {
      console.error('❌ Firebase 登出失敗:', firebaseError);
    }
    
    throw error;
  }
};

// 監聽 Firebase 認證狀態變化
export const onAuthStateChange = (callback: (user: FirebaseUser) => void) => {
  return onAuthStateChanged(auth, callback);
};

// 取得當前 Firebase 用戶
export const getCurrentUser = (): FirebaseUser => {
  return auth.currentUser;
};

// 初始化認證狀態（應用啟動時調用）
export const initializeAuthentication = async (): Promise<{
  firebaseUser: FirebaseUser;
  backendUser: BackendUser | null;
}> => {
  try {
    console.log('🔄 初始化認證狀態...');
    
    // 先檢查後端認證狀態（包含自動刷新功能）
    const backendUser = await initializeAuth();
    
    if (backendUser) {
      console.log('✅ 後端認證有效，檢查 Firebase 狀態');
      
      // 如果後端認證成功但 Firebase 未登入，嘗試保持後端狀態
      const firebaseUser = getCurrentUser();
      
      if (!firebaseUser) {
        console.log('⚠️ Firebase 未登入但後端已認證，保持後端認證狀態');
        // 保持後端認證，讓用戶可以使用應用
        return { firebaseUser: null, backendUser };
      }
      
      console.log('✅ Firebase 和後端都已認證');
      return { firebaseUser, backendUser };
    }
    
    // 如果後端認證失效，檢查是否有 localStorage 中的 token
    const hasToken = localStorage.getItem('authToken') || localStorage.getItem('refreshToken');
    
    if (hasToken) {
      console.log('🔄 發現儲存的 token，嘗試自動恢復認證...');
      
      // 嘗試重新初始化（可能會觸發自動刷新）
      const retryBackendUser = await initializeAuth();
      
      if (retryBackendUser) {
        const firebaseUser = getCurrentUser();
        return { firebaseUser, backendUser: retryBackendUser };
      }
    }
    
    // 檢查 Firebase 認證狀態
    const firebaseUser = getCurrentUser();
    
    if (firebaseUser) {
      console.log('⚠️ Firebase 已登入但後端認證失效');
      
      // 可以選擇保持 Firebase 狀態，讓用戶重新進行後端認證
      // 或者完全登出 Firebase
      console.log('🔄 保持 Firebase 狀態，等待重新認證');
      return { firebaseUser, backendUser: null };
    }
    
    console.log('📋 沒有有效的認證狀態');
    return { firebaseUser: null, backendUser: null };
  } catch (error) {
    console.error('❌ 認證狀態初始化失敗:', error);
    
    // 出錯時清理可能損壞的狀態
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
    } catch (cleanupError) {
      console.error('❌ 清理儲存失敗:', cleanupError);
    }
    
    return { firebaseUser: null, backendUser: null };
  }
};
