import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/useAuthStore';
import { initializeAuthentication, onAuthStateChange } from './services/authService';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UploadHistory from './pages/UploadHistory';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  const { 
    setFirebaseUser, 
    setBackendUser, 
    setLoading, 
    clearAuth 
  } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    // 初始化認證狀態
    const initAuth = async () => {
      try {
        setLoading(true);
        
        // 初始化並檢查認證狀態
        const authState = await initializeAuthentication();
        
        if (mounted) {
          setFirebaseUser(authState.firebaseUser);
          setBackendUser(authState.backendUser);
        }
      } catch (error) {
        console.error('❌ 應用初始化認證失敗:', error);
        if (mounted) {
          clearAuth();
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // 監聽 Firebase 認證狀態變化
    const unsubscribe = onAuthStateChange((firebaseUser) => {
      if (mounted) {
        setFirebaseUser(firebaseUser);
        
        // 如果 Firebase 用戶登出，也清空後端用戶
        if (!firebaseUser) {
          setBackendUser(null);
        }
      }
    });

    // 執行初始化
    initAuth();

    // 清理函數
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [setFirebaseUser, setBackendUser, setLoading, clearAuth]);

  return (
    <Routes>
      {/* 預設路由重導向到 dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* 登入頁面 */}
      <Route path="/login" element={<Login />} />
      
      {/* 受保護的 Dashboard 路由 */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* 受保護的上傳歷史路由 */}
      <Route 
        path="/upload-history" 
        element={
          <ProtectedRoute>
            <UploadHistory />
          </ProtectedRoute>
        } 
      />
      
      {/* 404 頁面 */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;