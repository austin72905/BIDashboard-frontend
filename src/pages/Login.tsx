// @ts-nocheck
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Google as GoogleIcon, Assessment } from '@mui/icons-material';
import { signInWithGoogle } from '../services/authService';
import { useAuthStore } from '../stores/useAuthStore';

export default function Login() {
  const navigate = useNavigate();
  const { setFirebaseUser, setBackendUser, setError: setAuthError } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      setAuthError(null);
      
      // 執行完整的登入流程（Firebase + 後端）
      const authResult = await signInWithGoogle();
      
      // 更新認證狀態
      setFirebaseUser(authResult.firebaseUser);
      setBackendUser(authResult.backendUser);
      
      console.log('🎉 登入成功，重導向到 Dashboard');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('登入錯誤:', error);
      const errorMessage = error.message || '登入失敗，請稍後再試';
      setError(errorMessage);
      setAuthError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
      <Paper
        elevation={8}
        sx={{
          p: 6,
          width: '100%',
          borderRadius: 3,
          background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Assessment sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            BI 數據儀表板
          </Typography>
          <Typography variant="body1" color="text.secondary">
            使用 Google 帳號登入以存取您的數據分析平台
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Button
          fullWidth
          variant="contained"
          size="large"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <GoogleIcon />}
          onClick={handleGoogleLogin}
          disabled={loading}
          sx={{
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 'bold',
            textTransform: 'none',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
            '&:hover': {
              boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
              transform: 'translateY(-1px)',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          {loading ? '登入中...' : '使用 Google 登入'}
        </Button>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            登入即表示您同意我們的服務條款和隱私政策
          </Typography>
        </Box>

        {/* 裝飾性元素 */}
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
            opacity: 0.1,
            zIndex: -1,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -30,
            left: -30,
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'linear-gradient(45deg, #ff9800, #ffb74d)',
            opacity: 0.1,
            zIndex: -1,
          }}
        />
      </Paper>
    </Container>
  );
}
