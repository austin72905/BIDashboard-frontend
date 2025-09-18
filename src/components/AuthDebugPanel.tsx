import { Box, Paper, Typography, Button, Chip, Stack } from '@mui/material';
import { useAuthStore } from '../stores/useAuthStore';
import { refreshToken } from '../services/backendAuthService';

export default function AuthDebugPanel() {
  const { 
    firebaseUser, 
    backendUser, 
    loading, 
    error,
    isAuthenticated,
    isFullyAuthenticated 
  } = useAuthStore();

  const handleTestRefresh = async () => {
    try {
      console.log('🧪 測試手動刷新 token...');
      const result = await refreshToken();
      if (result) {
        console.log('✅ 手動刷新成功:', result);
      } else {
        console.log('❌ 手動刷新失敗');
      }
    } catch (error) {
      console.error('❌ 手動刷新錯誤:', error);
    }
  };

  const getTokenInfo = () => {
    // 從 zustand store 獲取 access token
    const token = useAuthStore.getState().accessToken;
    const refreshTokenValue = localStorage.getItem('refreshToken');
    
    return {
      hasAccessToken: !!token,
      hasRefreshToken: !!refreshTokenValue,
      accessTokenLength: token ? token.length : 0,
      refreshTokenLength: refreshTokenValue ? refreshTokenValue.length : 0
    };
  };

  const tokenInfo = getTokenInfo();

  return (
    <Paper sx={{ p: 3, mb: 3, border: '1px dashed #ccc' }}>
      <Typography variant="h6" gutterBottom>
        🔧 認證狀態調試面板
      </Typography>
      
      <Stack spacing={2}>
        {/* 狀態指示器 */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            狀態指示器：
          </Typography>
          <Stack direction="row" spacing={1}>
            <Chip 
              label={loading ? "載入中" : "已載入"} 
              color={loading ? "warning" : "success"} 
              size="small" 
            />
            <Chip 
              label={isAuthenticated() ? "已認證" : "未認證"} 
              color={isAuthenticated() ? "success" : "error"} 
              size="small" 
            />
            <Chip 
              label={isFullyAuthenticated() ? "完全認證" : "部分認證"} 
              color={isFullyAuthenticated() ? "success" : "warning"} 
              size="small" 
            />
          </Stack>
        </Box>

        {/* 用戶資訊 */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            用戶資訊：
          </Typography>
          <Typography variant="body2">
            • Firebase 用戶：{firebaseUser ? firebaseUser.email || '已登入' : '無'}
          </Typography>
          <Typography variant="body2">
            • 後端用戶：{backendUser ? `${backendUser.displayName} (${backendUser.email})` : '無'}
          </Typography>
        </Box>

        {/* Token 資訊 */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Token 狀態：
          </Typography>
          <Typography variant="body2">
            • Access Token：{tokenInfo.hasAccessToken ? `有 (${tokenInfo.accessTokenLength} 字元)` : '無'}
          </Typography>
          <Typography variant="body2">
            • Refresh Token：{tokenInfo.hasRefreshToken ? `有 (${tokenInfo.refreshTokenLength} 字元)` : '無'}
          </Typography>
        </Box>

        {/* 錯誤資訊 */}
        {error && (
          <Box>
            <Typography variant="subtitle2" color="error" gutterBottom>
              錯誤：
            </Typography>
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          </Box>
        )}

        {/* 測試按鈕 */}
        <Box>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={handleTestRefresh}
            disabled={!tokenInfo.hasRefreshToken}
          >
            🧪 測試手動刷新 Token
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}
