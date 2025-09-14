import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Card,
  CardContent
} from '@mui/material';
import {
  Save,
  Cancel,
  Settings
} from '@mui/icons-material';
import { 
  getColumnMappingInfo, 
  upsertMappings,
  SystemFieldEnum,
  type ColumnMappingInfo,
  type DataColumnWithMapping,
  type ColumnMapping
} from '../services/dashboardApi';

interface ColumnMappingDialogProps {
  open: boolean;
  onClose: () => void;
  batchId: number;
  batchName: string;
  onSuccess?: () => void;
}

export default function ColumnMappingDialog({
  open,
  onClose,
  batchId,
  batchName,
  onSuccess
}: ColumnMappingDialogProps) {
  const [mappingInfo, setMappingInfo] = useState<ColumnMappingInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mappings, setMappings] = useState<Record<string, number>>({});

  // 載入映射資訊
  const loadMappingInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const info = await getColumnMappingInfo(batchId);
      setMappingInfo(info);
      
      // 初始化映射狀態
      const initialMappings: Record<string, number> = {};
      info.dataColumns.forEach(column => {
        if (column.mappedSystemField !== null) {
          initialMappings[column.sourceName] = column.mappedSystemField;
        } else {
          // 未映射的欄位設置為 -1 (None)
          initialMappings[column.sourceName] = -1;
        }
      });
      setMappings(initialMappings);
    } catch (err: any) {
      setError(err.message || '載入映射資訊失敗');
      console.error('載入映射資訊錯誤:', err);
    } finally {
      setLoading(false);
    }
  };

  // 處理映射變更
  const handleMappingChange = (sourceColumn: string, systemField: number) => {
    setMappings(prev => ({
      ...prev,
      [sourceColumn]: systemField
    }));
  };

  // 清除映射
  const clearMapping = (sourceColumn: string) => {
    setMappings(prev => {
      const newMappings = { ...prev };
      delete newMappings[sourceColumn];
      return newMappings;
    });
  };

  // 保存映射
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // 轉換映射格式（包含 None = -1 的未映射狀態）
      const mappingList: ColumnMapping[] = Object.entries(mappings)
        .filter(([_, systemField]) => systemField !== undefined && systemField !== null)
        .map(([sourceColumn, systemField]) => ({
          sourceColumn,
          systemField
        }));

      await upsertMappings({
        batchId,
        mappings: mappingList
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || '保存映射失敗');
      console.error('保存映射錯誤:', err);
    } finally {
      setSaving(false);
    }
  };

  // 重置映射
  const handleReset = () => {
    if (mappingInfo) {
      const initialMappings: Record<string, number> = {};
      mappingInfo.dataColumns.forEach(column => {
        if (column.mappedSystemField !== null) {
          initialMappings[column.sourceName] = column.mappedSystemField;
        } else {
          // 未映射的欄位設置為 -1 (None)
          initialMappings[column.sourceName] = -1;
        }
      });
      setMappings(initialMappings);
    }
  };

  // 當對話框打開時載入數據
  useEffect(() => {
    if (open) {
      loadMappingInfo();
    }
  }, [open, batchId]);

  // 獲取已使用的系統欄位（排除 None = -1）
  const getUsedSystemFields = () => {
    return Object.values(mappings).filter(field => field !== undefined && field !== null && field !== -1);
  };

  // 檢查是否有變更
  const hasChanges = () => {
    if (!mappingInfo) return false;
    
    const originalMappings: Record<string, number> = {};
    mappingInfo.dataColumns.forEach(column => {
      if (column.mappedSystemField !== null) {
        originalMappings[column.sourceName] = column.mappedSystemField;
      } else {
        originalMappings[column.sourceName] = -1; // None
      }
    });

    const currentKeys = Object.keys(mappings).sort();
    const originalKeys = Object.keys(originalMappings).sort();
    
    if (currentKeys.length !== originalKeys.length) return true;
    
    for (const key of currentKeys) {
      if (mappings[key] !== originalMappings[key]) return true;
    }
    
    return false;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { 
          minHeight: '70vh',
          zIndex: 1300
        }
      }}
      sx={{
        '& .MuiBackdrop-root': {
          zIndex: 1299
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Settings />
          欄位映射設定 - {batchName}
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : mappingInfo ? (
          <Box>
            {/* 系統欄位說明 */}
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  系統欄位說明
                </Typography>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: {
                    xs: 'repeat(2, 1fr)',
                    sm: 'repeat(3, 1fr)', 
                    md: 'repeat(4, 1fr)'
                  },
                  gap: 2 
                }}>
                  {Object.entries(mappingInfo.systemFields).slice(0, 12).map(([key, value]) => (
                    <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={key}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Typography variant="body2" color="text.secondary">
                        {value.fieldName}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                {Object.keys(mappingInfo.systemFields).length > 12 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    還有 {Object.keys(mappingInfo.systemFields).length - 12} 個系統欄位...
                  </Typography>
                )}
              </CardContent>
            </Card>

            <Divider sx={{ my: 2 }} />

            {/* 映射表格 */}
            <Typography variant="h6" gutterBottom>
              欄位映射設定
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>來源欄位</TableCell>
                    <TableCell>資料型別</TableCell>
                    <TableCell>系統欄位對應</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mappingInfo.dataColumns.map((column) => (
                    <TableRow key={column.sourceName}>
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
                        <FormControl fullWidth size="small">
                          <Select
                            value={mappings[column.sourceName] || ''}
                            onChange={(e) => handleMappingChange(column.sourceName, e.target.value)}
                            displayEmpty
                            MenuProps={{
                              PaperProps: {
                                style: {
                                  maxHeight: 300,
                                  zIndex: 9999
                                }
                              },
                              anchorOrigin: {
                                vertical: 'bottom',
                                horizontal: 'left'
                              },
                              transformOrigin: {
                                vertical: 'top',
                                horizontal: 'left'
                              }
                            }}
                          >
                            <MenuItem value={-1}>
                              <em>未對應</em>
                            </MenuItem>
                            {Object.entries(SystemFieldEnum)
                              .filter(([key]) => key !== 'None') // 排除 None，因為它已經作為"未對應"選項
                              .map(([key, value]) => {
                              const isUsed = getUsedSystemFields().includes(value) && mappings[column.sourceName] !== value;
                              return (
                                <MenuItem 
                                  key={key} 
                                  value={value}
                                  disabled={isUsed}
                                >
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2">
                                      {key}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      ({value})
                                    </Typography>
                                    {isUsed && (
                                      <Chip
                                        label="已使用"
                                        size="small"
                                        color="warning"
                                        variant="outlined"
                                      />
                                    )}
                                  </Box>
                                </MenuItem>
                              );
                            })}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        {mappings[column.sourceName] && (
                          <Button
                            size="small"
                            onClick={() => clearMapping(column.sourceName)}
                          >
                            清除
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* 映射統計 */}
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                已映射欄位：{Object.keys(mappings).length} / {mappingInfo.dataColumns.length}
              </Typography>
            </Box>
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button
          onClick={onClose}
          disabled={saving}
        >
          取消
        </Button>
        <Button
          onClick={handleReset}
          disabled={saving || !hasChanges()}
        >
          重置
        </Button>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} /> : <Save />}
          onClick={handleSave}
          disabled={saving || !hasChanges()}
        >
          {saving ? '保存中...' : '保存映射'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
