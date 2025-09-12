import axiosInstance from './axios';

// 後端認證相關的類型定義
export interface BackendUser {
  id: number;       // 後端返回的是數字
  email: string;
  displayName: string;  // 後端返回的是 displayName 而不是 name
  picture?: string;
  role?: string;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface OAuthLoginRequest {
  idToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface LogoutResponse {
  status: number;  // 後端返回的是數字
  message?: string;
}

export interface OAuthLoginResponse {
  status: number;  // 後端返回的是數字 0
  user: BackendUser;
  jwt: string;     // 後端返回的是 jwt 而不是 token
  refreshToken?: string;
  message?: string;
}

export interface AuthErrorResponse {
  status: string;
  message: string;
  code?: string;
}

// OAuth 登入（發送 Firebase ID Token 到後端）
export const oauthLogin = async (idToken: string): Promise<OAuthLoginResponse> => {
  try {
    const requestData: OAuthLoginRequest = {
      idToken
    };

    console.log('🔄 發送 OAuth 請求到後端...', {
      endpoint: '/auth/oauth-login'
    });

    const response = await axiosInstance.post<OAuthLoginResponse>('/auth/oauth-login', requestData);
    
    if (response.data.status === 0) {  // 後端成功狀態是數字 0
      console.log('✅ 後端認證成功:', response.data.user.displayName);
      
      // 儲存 JWT token 到 localStorage
      if (response.data.jwt) {
        localStorage.setItem('authToken', response.data.jwt);
      }
      
      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
      
      return response.data;
    } else {
      throw new Error(response.data.message || '後端認證失敗');
    }
  } catch (error: any) {
    console.error('❌ 後端 OAuth 登入失敗:', error);
    
    if (error.response?.data) {
      const errorData = error.response.data as AuthErrorResponse;
      throw new Error(errorData.message || '後端認證失敗');
    }
    
    throw new Error('無法連接到後端服務');
  }
};

// 後端登出（撤銷 refresh token 並清理本地資料）
export const backendLogout = async (): Promise<void> => {
  try {
    const refreshTokenValue = localStorage.getItem('refreshToken');
    
    if (refreshTokenValue) {
      console.log('🔄 發送登出請求到後端...');
      
      try {
        const requestData: LogoutRequest = {
          refreshToken: refreshTokenValue
        };
        
        const response = await axiosInstance.post<LogoutResponse>('/auth/logout', requestData);
        
        if (response.data.status === 0) {  // 後端成功狀態是數字 0
          console.log('✅ 後端登出成功');
        } else {
          console.warn('⚠️ 後端登出回應異常:', response.data.message);
        }
      } catch (error) {
        console.error('❌ 後端登出失敗:', error);
        // 即使後端登出失敗，也繼續清理本地資料
      }
    }
    
    // 清理本地儲存的認證資料
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    
    console.log('✅ 本地認證資料已清理');
  } catch (error) {
    console.error('❌ 登出處理失敗:', error);
    
    // 確保資料被清理
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
  }
};

// 刷新 token
export const refreshToken = async (): Promise<OAuthLoginResponse | null> => {
  try {
    const storedRefreshToken = localStorage.getItem('refreshToken');
    
    if (!storedRefreshToken) {
      console.log('📋 沒有 refresh token');
      return null;
    }
    
    console.log('🔄 刷新 token...');
    
    const requestData: RefreshTokenRequest = {
      refreshToken: storedRefreshToken
    };
    
    const response = await axiosInstance.post<OAuthLoginResponse>('/auth/refresh-token', requestData);
    
    if (response.data.status === 0) {  // 後端成功狀態是數字 0
      console.log('✅ Token 刷新成功');
      
      // 更新儲存的 token
      if (response.data.jwt) {
        localStorage.setItem('authToken', response.data.jwt);
      }
      
      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
      
      return response.data;
    } else {
      throw new Error('Token 刷新失敗');
    }
  } catch (error) {
    console.error('❌ Token 刷新失敗:', error);
    
    // 刷新失敗，清理所有 token
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    
    return null;
  }
};

// 驗證 token 是否有效（簡化版，因為後端沒有 /auth/me 端點）
export const validateToken = async (): Promise<BackendUser | null> => {
  try {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      console.log('📋 沒有儲存的 token');
      return null;
    }
    
    console.log('✅ 找到已儲存的 token，將嘗試使用');
    
    // 由於後端沒有 /auth/me 端點，我們先返回 null
    // 用戶資料會在下次登入時更新
    return null;
  } catch (error) {
    console.error('❌ Token 處理失敗:', error);
    
    // 清理無效的資料
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    
    return null;
  }
};

// 初始化認證狀態（應用啟動時調用）
export const initializeAuth = async (): Promise<BackendUser | null> => {
  try {
    const token = localStorage.getItem('authToken');
    const refreshTokenValue = localStorage.getItem('refreshToken');
    
    if (!token && !refreshTokenValue) {
      console.log('📋 沒有找到已儲存的認證資料');
      return null;
    }
    
    console.log('🔄 初始化認證狀態...');
    
    // 如果有 access token，先嘗試驗證
    if (token) {
      console.log('✅ 找到 access token，嘗試使用');
      
      // 由於沒有 /auth/me 端點，我們先假設 token 有效
      // 如果 token 無效，後續 API 調用會觸發自動刷新
      return null; // 用戶資料會在後續登入或 API 調用中獲取
    }
    
    // 如果只有 refresh token，嘗試刷新獲取新的 access token
    if (refreshTokenValue && !token) {
      console.log('🔄 只有 refresh token，嘗試刷新...');
      
      const refreshResult = await refreshToken();
      if (refreshResult && refreshResult.status === 0) {  // 後端成功狀態是數字 0
        console.log('✅ 自動刷新成功，用戶已自動登入');
        return refreshResult.user;
      } else {
        console.log('❌ 自動刷新失敗，需要重新登入');
        return null;
      }
    }
    
    return null;
  } catch (error) {
    console.error('❌ 初始化認證狀態失敗:', error);
    
    // 發生錯誤時清理可能損壞的資料
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    
    return null;
  }
};
