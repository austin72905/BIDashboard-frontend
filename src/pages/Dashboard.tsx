// @ts-nocheck
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Grid, 
  Paper, 
  Card, 
  CardContent, 
  Button, 
  Box,
  AppBar,
  Toolbar,
  Alert,
  CircularProgress,
  Avatar,
  Menu,
  MenuItem,
  Select,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip
} from '@mui/material';
import { 
  Upload,
  Assessment, 
  People, 
  TrendingUp, 
  AttachMoney, 
  ShoppingCart, 
  LocationOn,
  Category,
  Logout,
  AccountCircle,
  History,
  Storage,
  Add,
  Dataset,
  Delete,
  Info
} from '@mui/icons-material';
import { useDashboardStore } from '../stores/useDashboardStore';
import { getAllMetrics, uploadCsv, convertAllMetricsToDashboardStats, getUserDatasets } from '../services/dashboardApi';
import CreateDatasetDialog from '../components/CreateDatasetDialog';
import { useAuthStore } from '../stores/useAuthStore';
import { logout } from '../services/authService';
import AgeDistributionChart from '../charts/AgeDistributionChart';
import GenderPieChart from '../charts/GenderPieChart';
import RevenueChart from '../charts/RevenueChart';
import RegionChart from '../charts/RegionChart';
import ProductCategoriesChart from '../charts/ProductCategoriesChart';
import AuthDebugPanel from '../components/AuthDebugPanel';

export default function Dashboard() {
  const navigate = useNavigate();
  const { 
    stats, 
    allMetrics, 
    userDatasets, 
    currentDatasetId, 
    setStats, 
    setAllMetrics, 
    setUserDatasets, 
    setCurrentDatasetId,
    getCurrentDataset,
    deleteDataset,
    isLoading,
    error: storeError
  } = useDashboardStore();
  const { firebaseUser, backendUser, clearAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 載入用戶 datasets
  const loadUserDatasets = async () => {
    try {
      console.log('🔄 載入用戶 datasets...');
      const response = await getUserDatasets();
      
      // 防護性檢查：確保 response 和 datasets 存在
      if (!response) {
        console.warn('⚠️  後端返回空響應');
        setUserDatasets([]);
        return;
      }
      
      const datasets = response.datasets || [];
      console.log('📊 獲取到的 datasets:', datasets);
      
      setUserDatasets(datasets);
      
      // 如果有 datasets，自動選擇第一個作為當前 dataset
      if (datasets.length > 0 && !currentDatasetId) {
        setCurrentDatasetId(datasets[0].id);
        console.log('✅ 自動選擇第一個 dataset:', datasets[0]);
      }
      
      console.log('✅ 用戶 datasets 載入成功:', datasets);
    } catch (err: any) {
      console.error('❌ 載入用戶 datasets 失敗:', err);
      // 設置空數組作為默認值
      setUserDatasets([]);
      // 不設置錯誤狀態，因為這不影響主要功能
    }
  };


  // 載入儀表板數據
  const loadDashboardData = async () => {
    if (!currentDatasetId) {
      console.log('⚠️  沒有選擇的 dataset，跳過載入儀表板數據');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // 使用當前選擇的 dataset ID
      const allMetricsData = await getAllMetrics(currentDatasetId, 12);
      setAllMetrics(allMetricsData);
      
      // 轉換為舊格式以保持向後兼容
      const dashboardStats = convertAllMetricsToDashboardStats(allMetricsData);
      setStats(dashboardStats);
      
      console.log('✅ 儀表板數據載入成功:', { allMetricsData, dashboardStats });
    } catch (err: any) {
      const errorMessage = err.message || '載入數據失敗，請檢查後端連接';
      setError(errorMessage);
      console.error('載入數據錯誤:', err);
    } finally {
      setLoading(false);
    }
  };

  // 處理 CSV 檔案上傳
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 檢查是否已選擇資料集
    if (!currentDatasetId) {
      setError('請先選擇要上傳的資料集');
      return;
    }

    // 注意：批次數量限制將由後端 API 處理

    try {
      setUploading(true);
      setError(null);
      
      // 檢查檔案類型
      if (!file.name.toLowerCase().endsWith('.csv')) {
        throw new Error('請選擇 CSV 格式的檔案');
      }
      
      // 檢查檔案大小（例如：最大 10MB）
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('檔案大小不能超過 10MB');
      }
      
      const currentDataset = getCurrentDataset();
      console.log('🔄 開始上傳檔案:', {
        fileName: file.name,
        datasetId: currentDatasetId,
        datasetName: currentDataset?.name
      });
      
      // 上傳到指定的 dataset
      await uploadCsv(file, currentDatasetId);
      
      console.log('✅ 檔案上傳成功，重新載入數據...');
      await loadDashboardData();
      
      // 顯示成功訊息（可選）
      console.log('🎉 數據更新完成');
    } catch (err: any) {
      const errorMessage = err.message || '檔案上傳失敗，請檢查檔案格式';
      setError(errorMessage);
      console.error('上傳錯誤:', err);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  // 處理刪除資料集
  const handleDeleteDataset = async () => {
    if (!currentDatasetId) return;

    try {
      setDeleting(true);
      setError(null);
      
      const currentDataset = getCurrentDataset();
      console.log('🔄 刪除資料集...', { 
        datasetId: currentDatasetId, 
        datasetName: currentDataset?.name 
      });
      
      await deleteDataset(currentDatasetId);
      
      console.log('✅ 資料集刪除成功');
      setDeleteDialogOpen(false);
      
      // 重新載入用戶 datasets
      await loadUserDatasets();
      
    } catch (err: any) {
      const errorMessage = err.message || '刪除資料集失敗';
      setError(errorMessage);
      console.error('刪除資料集錯誤:', err);
    } finally {
      setDeleting(false);
    }
  };

  // 打開刪除確認對話框
  const handleOpenDeleteDialog = () => {
    setDeleteDialogOpen(true);
  };

  // 關閉刪除確認對話框
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };

  // 處理登出
  const handleLogout = async () => {
    try {
      console.log('🔄 執行登出...');
      await logout();
      clearAuth();
      console.log('✅ 登出完成，重導向到登入頁面');
      navigate('/login');
    } catch (error) {
      console.error('❌ 登出錯誤:', error);
      // 即使登出失敗，也清理本地狀態並重導向
      clearAuth();
      navigate('/login');
    }
    setAnchorEl(null);
  };

  // 組件載入時獲取數據
  useEffect(() => {
    const initializeData = async () => {
      // 先載入用戶 datasets
      await loadUserDatasets();
      // 然後載入儀表板數據
      await loadDashboardData();
    };
    
    initializeData();
  }, []);

  // 當 currentDatasetId 改變時重新載入儀表板數據
  useEffect(() => {
    if (currentDatasetId) {
      loadDashboardData();
    }
  }, [currentDatasetId]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* 頂部導航欄 */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Assessment sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            BI 數據儀表板
          </Typography>
          
          {/* Dataset 選擇器 */}
          {userDatasets.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 200, mr: 2 }}>
              <Select
                value={currentDatasetId || ''}
                onChange={(e) => setCurrentDatasetId(Number(e.target.value))}
                displayEmpty
                sx={{ 
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.23)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'white',
                  },
                }}
              >
                {userDatasets.map((dataset) => (
                  <MenuItem key={dataset.id} value={dataset.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Storage fontSize="small" />
                      <Typography variant="body2">{dataset.name}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          
          {/* 刪除資料集按鈕 */}
          {currentDatasetId && (
            <Button
              color="inherit"
              onClick={handleOpenDeleteDialog}
              startIcon={<Delete />}
              sx={{ mr: 2 }}
            >
              刪除資料集
            </Button>
          )}
          
          {/* 創建資料集按鈕 */}
          <Button
            color="inherit"
            onClick={() => setCreateDialogOpen(true)}
            startIcon={<Add />}
            sx={{ mr: 2 }}
          >
            創建資料集
          </Button>
          

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button
              color="inherit"
              onClick={handleMenuOpen}
              startIcon={
                (backendUser?.picture || firebaseUser?.photoURL) ? (
                  <Avatar 
                    src={backendUser?.picture || firebaseUser?.photoURL || undefined} 
                    sx={{ width: 24, height: 24 }} 
                  />
                ) : (
                  <AccountCircle />
                )
              }
            >
              {backendUser?.displayName || firebaseUser?.displayName || '用戶'}
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 1 }} />
                登出
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, px: 3 }}>
        {/* 開發環境調試面板 */}
        {import.meta.env.DEV && <AuthDebugPanel />}

        {/* 錯誤提示 */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* 檔案上傳區域 */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            數據管理
          </Typography>
          
          {/* 顯示批次數量限制信息 */}
          {currentDatasetId && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Box display="flex" alignItems="center" gap={1}>
                <Info color="info" fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  每個資料集最多可上傳 5 個檔案
                </Typography>
              </Box>
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              component="label"
              startIcon={<Upload />}
              disabled={uploading}
            >
              {uploading ? '上傳中...' : '上傳 CSV 檔案'}
              <input
                type="file"
                accept=".csv"
                hidden
                onChange={handleFileUpload}
              />
            </Button>
            <Button
              variant="outlined"
              startIcon={<History />}
              onClick={() => navigate('/upload-history')}
            >
              查看上傳歷史
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1, minWidth: 200 }}>
              支援 CSV 格式，最大 10MB，包含年齡和性別欄位
            </Typography>
          </Box>
        </Paper>

        {/* 主要業務指標 */}
        {stats && (
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 3, 
            mb: 4,
            justifyContent: { xs: 'center', sm: 'flex-start' }
          }}>
            <Card className="stats-card" sx={{ 
              flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' },
              minWidth: { xs: '280px', sm: '240px' },
              maxWidth: { xs: '100%', sm: 'none' },
              height: '140px'
            }}>
              <CardContent sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center' }}>
                <AttachMoney sx={{ mr: 2, color: 'success.main', fontSize: 40 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography color="text.secondary" gutterBottom variant="subtitle2">
                    總營收
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    NT$ {(stats.revenueData.total / 1000000).toFixed(1)}M
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    ↗ {stats.revenueData.growth.toFixed(1)}%
                  </Typography>
                </Box>
              </CardContent>
            </Card>
            
            <Card className="stats-card" sx={{ 
              flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' },
              minWidth: { xs: '280px', sm: '240px' },
              maxWidth: { xs: '100%', sm: 'none' },
              height: '140px'
            }}>
              <CardContent sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center' }}>
                <People sx={{ mr: 2, color: 'primary.main', fontSize: 40 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography color="text.secondary" gutterBottom variant="subtitle2">
                    總客戶數
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {stats.customerMetrics.totalCustomers.toLocaleString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Card className="stats-card" sx={{ 
              flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' },
              minWidth: { xs: '280px', sm: '240px' },
              maxWidth: { xs: '100%', sm: 'none' },
              height: '140px'
            }}>
              <CardContent sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center' }}>
                <ShoppingCart sx={{ mr: 2, color: 'warning.main', fontSize: 40 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography color="text.secondary" gutterBottom variant="subtitle2">
                    總訂單數
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {stats.salesMetrics.totalOrders.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    完成率 {stats.salesMetrics.totalOrders > 0 ? 
                      ((stats.salesMetrics.completedOrders / stats.salesMetrics.totalOrders) * 100).toFixed(1) : 
                      '0.0'}%
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Card className="stats-card" sx={{ 
              flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' },
              minWidth: { xs: '280px', sm: '240px' },
              maxWidth: { xs: '100%', sm: 'none' },
              height: '140px'
            }}>
              <CardContent sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center' }}>
                <TrendingUp sx={{ mr: 2, color: 'info.main', fontSize: 40 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography color="text.secondary" gutterBottom variant="subtitle2">
                    平均客單價
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    NT$ {stats.customerMetrics.averageOrderValue.toLocaleString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* 次要指標 */}
        {stats && (
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 3, 
            mb: 4,
            justifyContent: { xs: 'center', sm: 'flex-start' }
          }}>
            <Card className="stats-card" sx={{ 
              flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(33.333% - 16px)' },
              minWidth: { xs: '280px', sm: '200px' },
              maxWidth: { xs: '100%', sm: 'none' },
              height: '120px'
            }}>
              <CardContent sx={{ 
                textAlign: 'center',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <LocationOn sx={{ color: 'info.main', fontSize: 32, mb: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  服務地區
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {Object.keys(stats.regionDistribution).length}
                </Typography>
              </CardContent>
            </Card>

            <Card className="stats-card" sx={{ 
              flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(33.333% - 16px)' },
              minWidth: { xs: '280px', sm: '200px' },
              maxWidth: { xs: '100%', sm: 'none' },
              height: '120px'
            }}>
              <CardContent sx={{ 
                textAlign: 'center',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Category sx={{ color: 'secondary.main', fontSize: 32, mb: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  產品類別
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {Object.keys(stats.productCategories).length}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* 主要圖表區域 */}
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 3, 
          mb: 4
        }}>
          <Paper sx={{ 
            flex: { xs: '1 1 100%', lg: '2 1 0' },
            minWidth: { xs: '100%', lg: '60%' },
            p: 3,
            borderRadius: 2,
            boxShadow: 2
          }}>
            <Typography variant="h6" gutterBottom sx={{ 
              display: 'flex', 
              alignItems: 'center',
              mb: 3,
              fontWeight: 600
            }}>
              <TrendingUp sx={{ mr: 1.5, color: 'primary.main' }} />
              月度營收趨勢
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <RevenueChart />
            )}
          </Paper>
          
          <Paper sx={{ 
            flex: { xs: '1 1 100%', lg: '1 1 0' },
            minWidth: { xs: '100%', lg: '35%' },
            p: 3,
            borderRadius: 2,
            boxShadow: 2
          }}>
            <Typography variant="h6" gutterBottom sx={{ 
              display: 'flex', 
              alignItems: 'center',
              mb: 3,
              fontWeight: 600
            }}>
              <LocationOn sx={{ mr: 1.5, color: 'info.main' }} />
              地區分布
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <RegionChart />
            )}
          </Paper>
        </Box>

        {/* 次要圖表區域 */}
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 3, 
          mb: 4
        }}>
          <Paper sx={{ 
            flex: { xs: '1 1 100%', md: '1 1 calc(50% - 12px)' },
            minWidth: { xs: '100%', md: '45%' },
            p: 3,
            borderRadius: 2,
            boxShadow: 2
          }}>
            <Typography variant="h6" gutterBottom sx={{ 
              display: 'flex', 
              alignItems: 'center',
              mb: 3,
              fontWeight: 600
            }}>
              <Category sx={{ mr: 1.5, color: 'secondary.main' }} />
              產品類別銷量
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <ProductCategoriesChart />
            )}
          </Paper>

          <Paper sx={{ 
            flex: { xs: '1 1 100%', md: '1 1 calc(50% - 12px)' },
            minWidth: { xs: '100%', md: '45%' },
            p: 3,
            borderRadius: 2,
            boxShadow: 2
          }}>
            <Typography variant="h6" gutterBottom sx={{ 
              display: 'flex', 
              alignItems: 'center',
              mb: 3,
              fontWeight: 600
            }}>
              <People sx={{ mr: 1.5, color: 'primary.main' }} />
              年齡分布統計
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <AgeDistributionChart />
            )}
          </Paper>
        </Box>

        {/* 附加分析圖表 */}
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 3
        }}>
          <Paper sx={{ 
            flex: { xs: '1 1 100%', md: '1 1 calc(33.333% - 16px)' },
            minWidth: { xs: '100%', md: '30%' },
            p: 3,
            borderRadius: 2,
            boxShadow: 2
          }}>
            <Typography variant="h6" gutterBottom sx={{ 
              display: 'flex', 
              alignItems: 'center',
              mb: 3,
              fontWeight: 600
            }}>
              <Assessment sx={{ mr: 1.5, color: 'secondary.main' }} />
              性別比例
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <GenderPieChart />
            )}
          </Paper>

          <Paper sx={{ 
            flex: { xs: '1 1 100%', md: '2 1 0' },
            minWidth: { xs: '100%', md: '65%' },
            p: 3,
            borderRadius: 2,
            boxShadow: 2,
            height: { xs: 'auto', md: '450px' },
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Typography variant="h6" gutterBottom sx={{ 
              display: 'flex', 
              alignItems: 'center',
              mb: 3,
              fontWeight: 600
            }}>
              <Assessment sx={{ mr: 1.5, color: 'primary.main' }} />
              數據摘要
            </Typography>
            {stats && (
              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 2,
                flex: 1,
                alignItems: 'stretch'
              }}>
                <Box sx={{ 
                  flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' },
                  p: 3, 
                  bgcolor: 'grey.50', 
                  borderRadius: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <Typography variant="subtitle1" sx={{ 
                    fontWeight: 'bold', 
                    color: 'success.main',
                    mb: 2
                  }}>
                    營收表現
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    • 年度總營收：NT$ {(stats.revenueData.total / 1000000).toFixed(1)}M
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    • 年成長率：{stats.revenueData.growth.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2">
                    • 月平均營收：NT$ {(stats.revenueData.total / 12 / 1000).toFixed(0)}K
                  </Typography>
                </Box>
                
                <Box sx={{ 
                  flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' },
                  p: 3, 
                  bgcolor: 'grey.50', 
                  borderRadius: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <Typography variant="subtitle1" sx={{ 
                    fontWeight: 'bold', 
                    color: 'primary.main',
                    mb: 2
                  }}>
                    客戶分析
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    • 總客戶數：{stats.customerMetrics.totalCustomers.toLocaleString()} 人
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    • 回購客戶：{stats.customerMetrics.returningCustomers.toLocaleString()} 人
                  </Typography>
                  <Typography variant="body2">
                    • 平均客單價：NT$ {stats.customerMetrics.averageOrderValue.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            )}
          </Paper>
        </Box>

        {/* 無數據時的提示 */}
        {!loading && !stats && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              暫無數據
            </Typography>
            <Typography variant="body1" color="text.secondary">
              請上傳 CSV 檔案或檢查後端連接狀態
            </Typography>
          </Paper>
        )}
      </Container>
      
      {/* 創建資料集對話框 */}
      <CreateDatasetDialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)} 
      />
      
      {/* 刪除資料集確認對話框 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          color: 'error.main'
        }}>
          <Delete />
          刪除資料集
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            您確定要刪除資料集「{getCurrentDataset()?.name}」嗎？
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>警告：</strong>此操作將永久刪除以下內容：
            </Typography>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>所有上傳的批次資料</li>
              <li>所有欄位映射設定</li>
              <li>所有計算的指標數據</li>
              <li>資料集本身</li>
            </ul>
            <Typography variant="body2">
              <strong>此操作無法復原！</strong>
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseDeleteDialog}
            disabled={deleting}
          >
            取消
          </Button>
          <Button 
            onClick={handleDeleteDataset}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} /> : <Delete />}
          >
            {deleting ? '刪除中...' : '確認刪除'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
