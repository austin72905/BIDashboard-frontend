import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Visibility,
  Refresh,
  ArrowBack,
  Error,
  CheckCircle,
  Schedule,
  Info,
  Warning,
  Settings,
  Delete
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getUploadHistory, getBatchDetails, deleteBatch } from '../services/dashboardApi';
import type { UploadHistory } from '../types/UploadHistory';
import { BatchStatusConfig } from '../types/UploadHistory';
import ColumnMappingDialog from '../components/ColumnMappingDialog';
import { useDashboardStore } from '../stores/useDashboardStore';

export default function UploadHistoryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentDatasetId, getCurrentDataset, setCurrentDatasetId } = useDashboardStore();
  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<UploadHistory | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [mappingDialogOpen, setMappingDialogOpen] = useState(false);
  const [mappingBatchId, setMappingBatchId] = useState<number | null>(null);
  const [mappingBatchName, setMappingBatchName] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<UploadHistory | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 獲取當前選中的資料集
  const currentDataset = getCurrentDataset();

  // 處理 URL 參數中的資料集 ID
  useEffect(() => {
    const datasetIdFromUrl = searchParams.get('datasetId');
    if (datasetIdFromUrl) {
      const datasetId = parseInt(datasetIdFromUrl, 10);
      if (!isNaN(datasetId) && datasetId !== currentDatasetId) {
        setCurrentDatasetId(datasetId);
      }
    }
  }, [searchParams, currentDatasetId, setCurrentDatasetId]);

  // 當 currentDatasetId 改變時重新載入歷史
  useEffect(() => {
    if (currentDatasetId) {
      loadUploadHistory();
    }
  }, [currentDatasetId]);

  // 載入上傳歷史
  const loadUploadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 檢查是否已選擇資料集
      if (!currentDatasetId) {
        setError('請先在 Dashboard 選擇資料集');
        return;
      }
      
      const history = await getUploadHistory(currentDatasetId);
      setUploadHistory(history);
    } catch (err: any) {
      setError(err.message || '載入上傳歷史失敗');
      console.error('載入上傳歷史錯誤:', err);
    } finally {
      setLoading(false);
    }
  };

  // 載入批次詳細資訊
  const loadBatchDetails = async (batchId: number) => {
    try {
      setDetailLoading(true);
      const details = await getBatchDetails(batchId);
      setSelectedBatch(details);
      setDetailDialogOpen(true);
    } catch (err: any) {
      setError(err.message || '載入批次詳細資訊失敗');
      console.error('載入批次詳細資訊錯誤:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 獲取狀態圖標
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Succeeded':
        return <CheckCircle color="success" />;
      case 'Failed':
        return <Error color="error" />;
      case 'Processing':
        return <Schedule color="primary" />;
      case 'Mapped':
        return <Info color="info" />;
      case 'Pending':
        return <Warning color="warning" />;
      default:
        return <Info color="action" />;
    }
  };

  // 格式化數字
  const formatNumber = (num: number) => {
    return num.toLocaleString('zh-TW');
  };

  // 打開映射對話框
  const handleOpenMapping = (batch: UploadHistory) => {
    setMappingBatchId(batch.batchId);
    setMappingBatchName(batch.datasetName);
    setMappingDialogOpen(true);
  };

  // 關閉映射對話框
  const handleCloseMapping = () => {
    setMappingDialogOpen(false);
    setMappingBatchId(null);
    setMappingBatchName('');
  };

  // 映射成功後重新載入歷史
  const handleMappingSuccess = () => {
    loadUploadHistory();
  };

  // 打開刪除確認對話框
  const handleOpenDeleteDialog = (batch: UploadHistory) => {
    setBatchToDelete(batch);
    setDeleteDialogOpen(true);
  };

  // 關閉刪除確認對話框
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setBatchToDelete(null);
  };

  // 執行刪除操作
  const handleDeleteBatch = async () => {
    if (!batchToDelete) return;

    try {
      setDeleting(true);
      setError(null);
      
      await deleteBatch(batchToDelete.batchId);
      
      // 刪除成功後重新載入歷史
      await loadUploadHistory();
      
      // 關閉對話框
      handleCloseDeleteDialog();
      
    } catch (err: any) {
      setError(err.message || '刪除批次失敗');
      console.error('刪除批次錯誤:', err);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    loadUploadHistory();
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* 頁面標題 */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 3 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton 
              color="inherit" 
              onClick={() => navigate(`/dashboard?datasetId=${currentDatasetId}`)}
              sx={{ mr: 1 }}
            >
              <ArrowBack />
            </IconButton>
            <Typography variant="h4" component="h1">
              上傳歷史紀錄
              {currentDataset && (
                <Typography variant="h6" component="span" sx={{ ml: 2, opacity: 0.8 }}>
                  - {currentDataset.name}
                </Typography>
              )}
            </Typography>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<Refresh />}
              onClick={loadUploadHistory}
              disabled={loading}
              sx={{ ml: 'auto' }}
            >
              重新整理
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* 錯誤提示 */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* 載入中 */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Paper sx={{ overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>批次 ID</TableCell>
                    <TableCell>資料集名稱</TableCell>
                    <TableCell>檔案名稱</TableCell>
                    <TableCell align="right">資料筆數</TableCell>
                    <TableCell>狀態</TableCell>
                    <TableCell>上傳時間</TableCell>
                    <TableCell align="center">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {uploadHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          尚無上傳歷史紀錄
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    uploadHistory.map((batch) => (
                      <TableRow key={batch.batchId} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            #{batch.batchId}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {batch.datasetName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {batch.sourceFilename}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {formatNumber(batch.totalRows)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getStatusIcon(batch.status)}
                            <Chip
                              label={BatchStatusConfig[batch.status as keyof typeof BatchStatusConfig]?.label || batch.status}
                              color={BatchStatusConfig[batch.status as keyof typeof BatchStatusConfig]?.color || 'default'}
                              size="small"
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(batch.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <Tooltip title="查看詳細資訊">
                              <IconButton
                                size="small"
                                onClick={() => loadBatchDetails(batch.batchId)}
                                disabled={detailLoading}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="設定欄位映射">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenMapping(batch)}
                                disabled={batch.status === 'Failed'}
                              >
                                <Settings />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="刪除批次">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDeleteDialog(batch)}
                                disabled={deleting}
                                color="error"
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* 批次詳細資訊對話框 */}
        <Dialog
          open={detailDialogOpen}
          onClose={() => setDetailDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {selectedBatch && getStatusIcon(selectedBatch.status)}
              批次詳細資訊 #{selectedBatch?.batchId}
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedBatch && (
              <Box>
                {/* 基本資訊 */}
                <Box sx={{ display: 'flex', gap: 3, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <Box sx={{ flex: 1 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          基本資訊
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>資料集名稱：</strong>{selectedBatch.datasetName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>檔案名稱：</strong>{selectedBatch.sourceFilename}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>資料筆數：</strong>{formatNumber(selectedBatch.totalRows)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>狀態：</strong>
                          <Chip
                            label={BatchStatusConfig[selectedBatch.status as keyof typeof BatchStatusConfig]?.label || selectedBatch.status}
                            color={BatchStatusConfig[selectedBatch.status as keyof typeof BatchStatusConfig]?.color || 'default'}
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          時間資訊
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>上傳時間：</strong>{formatDate(selectedBatch.createdAt)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>更新時間：</strong>{formatDate(selectedBatch.updatedAt)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                </Box>

                {/* 錯誤訊息 */}
                {selectedBatch.errorMessage && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      錯誤訊息：
                    </Typography>
                    {selectedBatch.errorMessage}
                  </Alert>
                )}

                <Divider sx={{ my: 2 }} />

                {/* 欄位資訊 */}
                <Typography variant="h6" gutterBottom>
                  欄位資訊
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>欄位名稱</TableCell>
                        <TableCell>資料型別</TableCell>
                        <TableCell>可空值</TableCell>
                        <TableCell>系統欄位對應</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedBatch.columns.map((column, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {column.sourceName}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={column.dataType}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={column.isNullable ? '是' : '否'}
                              size="small"
                              color={column.isNullable ? 'warning' : 'success'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            {column.systemField ? (
                              <Chip
                                label={column.systemField}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                未對應
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailDialogOpen(false)}>
              關閉
            </Button>
          </DialogActions>
        </Dialog>

        {/* 欄位映射對話框 */}
        {mappingBatchId && (
          <ColumnMappingDialog
            open={mappingDialogOpen}
            onClose={handleCloseMapping}
            batchId={mappingBatchId}
            batchName={mappingBatchName}
            onSuccess={handleMappingSuccess}
          />
        )}

        {/* 刪除確認對話框 */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleCloseDeleteDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Delete color="error" />
              確認刪除批次
            </Box>
          </DialogTitle>
          <DialogContent>
            {batchToDelete && (
              <Box>
                <Typography variant="body1" gutterBottom>
                  您確定要刪除以下批次嗎？此操作無法復原。
                </Typography>
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>批次 ID：</strong>#{batchToDelete.batchId}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>資料集：</strong>{batchToDelete.datasetName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>檔案名稱：</strong>{batchToDelete.sourceFilename}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>資料筆數：</strong>{formatNumber(batchToDelete.totalRows)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>上傳時間：</strong>{formatDate(batchToDelete.createdAt)}
                  </Typography>
                </Box>
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    刪除後將同時移除：
                  </Typography>
                  <Typography variant="body2" component="ul" sx={{ mt: 1, pl: 2 }}>
                    <li>所有上傳的資料行</li>
                    <li>欄位映射設定</li>
                    <li>欄位定義資訊</li>
                    <li>批次記錄</li>
                  </Typography>
                </Alert>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={handleCloseDeleteDialog}
              disabled={deleting}
            >
              取消
            </Button>
            <Button 
              onClick={handleDeleteBatch}
              color="error"
              variant="contained"
              disabled={deleting}
              startIcon={deleting ? <CircularProgress size={16} /> : <Delete />}
            >
              {deleting ? '刪除中...' : '確認刪除'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
