import axios from "axios";
import { useAuthStore } from "../stores/useAuthStore";

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // 你的後端 API
  timeout: 30000,
});

// 🔥 創建原始 axios 實例，不帶攔截器，避免循環攔截
const rawAxios = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
});

// 請求攔截器 - 自動添加 token
instance.interceptors.request.use(
  (config) => {
    // 從 zustand store 中獲取 access token
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 用於防止多個請求同時刷新 token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// 🔥 統一的 token 刷新函數 - 使用原始 axios 避免循環攔截
const refreshTokenRequest = async (): Promise<{ jwt: string; refreshToken: string } | null> => {
  try {
    const refreshTokenValue = localStorage.getItem('refreshToken');
    
    if (!refreshTokenValue) {
      console.log('📋 沒有 refresh token');
      return null;
    }
    
    console.log('🔄 開始刷新 token...');
    
    // 🔥 使用原始 axios 實例，避免循環攔截
    const response = await rawAxios.post('/auth/refresh-token', {
      refreshToken: refreshTokenValue
    });
    
    if (response.data.status === 0) {
      console.log('✅ Token 刷新成功');
      return {
        jwt: response.data.jwt,
        refreshToken: response.data.refreshToken
      };
    } else if (response.data.status === 2) {
      console.log('❌ Refresh token 無效或過期，需要重新登入');
      return null;
    } else {
      throw new Error(response.data.message || 'Token 刷新失敗');
    }
  } catch (error: any) {
    console.error('❌ Token 刷新失敗:', error);
    
    // 🔥 處理 refresh token 請求返回 401 的情況
    if (error.response?.status === 401) {
      console.log('❌ Refresh token 請求返回 401，token 完全失效');
      return null;
    }
    
    if (error.response?.data?.status === 2) {
      console.log('❌ 後端明確告知 Refresh token 過期');
      return null;
    }
    
    return null;
  }
};

// 🔥 回應攔截器 - 統一處理 token 過期
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // 如果是 401 錯誤且還沒重試過
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 如果正在刷新，將請求加入佇列
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return instance(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        console.log('🔄 檢測到 401 錯誤，開始自動刷新 token...');
        
        // 🔥 使用統一的刷新函數
        const refreshResult = await refreshTokenRequest();
        
        if (refreshResult) {
          // 更新 token 到 zustand store
          useAuthStore.getState().setAccessToken(refreshResult.jwt);
          
          // 更新 refresh token 到 localStorage
          localStorage.setItem('refreshToken', refreshResult.refreshToken);
          
          console.log('✅ Token 刷新成功，重試原始請求');
          
          // 處理佇列中的請求
          processQueue(null, refreshResult.jwt);
          
          // 重試原始請求
          originalRequest.headers.Authorization = `Bearer ${refreshResult.jwt}`;
          return instance(originalRequest);
        } else {
          // 🔥 刷新失敗，清理所有認證狀態並重導向登入
          console.log('❌ Token 刷新失敗，清理認證狀態');
          
          // 清理 zustand store 中的認證狀態
          useAuthStore.getState().setAccessToken(null);
          useAuthStore.getState().setBackendUser(null);
          
          // 🔥 清理 localStorage 中的 refresh token
          localStorage.removeItem('refreshToken');
          
          // 通知所有等待的請求刷新失敗
          processQueue(new Error('Token refresh failed'), null);
          
          // 觸發重導向到登入頁面
          console.log('🔄 重導向到登入頁面');
          window.location.href = '/login';
        }
        
      } catch (refreshError) {
        console.error('❌ Token 刷新錯誤:', refreshError);
        
        // 🔥 清理所有認證狀態
        useAuthStore.getState().setAccessToken(null);
        useAuthStore.getState().setBackendUser(null);
        localStorage.removeItem('refreshToken');
        
        processQueue(refreshError, null);
        window.location.href = '/login';
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

export default instance;
