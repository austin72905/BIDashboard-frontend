import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:5127/api", // 你的後端 API
  timeout: 10000,
});

// 請求攔截器 - 自動添加 token
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
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

// 回應攔截器 - 處理 token 過期
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
        const refreshTokenValue = localStorage.getItem('refreshToken');
        
        if (refreshTokenValue) {
          console.log('🔄 Token 過期，嘗試刷新...');
          
          const refreshResponse = await instance.post('/auth/refresh-token', {
            refreshToken: refreshTokenValue
          });
          
          if (refreshResponse.data.status === 0) {  // 後端成功狀態是數字 0
            const newToken = refreshResponse.data.jwt;
            
            // 更新 token
            localStorage.setItem('authToken', newToken);
            
            if (refreshResponse.data.refreshToken) {
              localStorage.setItem('refreshToken', refreshResponse.data.refreshToken);
            }
            
            console.log('✅ Token 刷新成功');
            
            // 處理佇列中的請求
            processQueue(null, newToken);
            
            // 重試原始請求
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return instance(originalRequest);
          }
        }
        
        // 刷新失敗，清理 token 並重導向登入
        console.log('❌ Token 刷新失敗，請重新登入');
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        
        processQueue(new Error('Token refresh failed'), null);
        
        // 觸發重導向到登入頁面
        window.location.href = '/login';
        
      } catch (refreshError) {
        console.error('❌ Token 刷新錯誤:', refreshError);
        localStorage.removeItem('authToken');
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
