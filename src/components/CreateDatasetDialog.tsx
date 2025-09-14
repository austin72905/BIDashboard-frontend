import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Typography,
  Chip
} from '@mui/material';
import { Add, Info } from '@mui/icons-material';
import { useDashboardStore } from '../stores/useDashboardStore';

interface CreateDatasetDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateDatasetDialog({ open, onClose }: CreateDatasetDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { createDataset, isLoading, error, setError, userDatasets } = useDashboardStore();
  
  const currentDatasetCount = userDatasets.length;
  const maxDatasets = 2;
  const canCreateMore = currentDatasetCount < maxDatasets;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('資料集名稱不能為空');
      return;
    }

    if (!canCreateMore) {
      setError(`您已達到資料集數量上限（${maxDatasets} 個），無法創建更多資料集`);
      return;
    }

    try {
      await createDataset({
        name: name.trim(),
        description: description.trim() || undefined
      });
      
      // 重置表單
      setName('');
      setDescription('');
      setError(null);
      onClose();
    } catch (error) {
      // 錯誤已經在 store 中處理
      console.error('創建資料集失敗:', error);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setName('');
      setDescription('');
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Add color="primary" />
          創建新資料集
        </Box>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {/* 顯示資料集數量限制信息 */}
          <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Info color="info" fontSize="small" />
              <Typography variant="body2" color="text.secondary">
                資料集數量限制
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Chip 
                label={`${currentDatasetCount}/${maxDatasets}`}
                color={canCreateMore ? "success" : "error"}
                size="small"
              />
              <Typography variant="body2" color="text.secondary">
                每個用戶最多可創建 {maxDatasets} 個資料集
              </Typography>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <TextField
            autoFocus
            margin="dense"
            label="資料集名稱"
            fullWidth
            variant="outlined"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
            required
            helperText="請輸入資料集的名稱"
          />
          
          <TextField
            margin="dense"
            label="描述（可選）"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading}
            helperText="為您的資料集添加描述，方便日後識別"
          />
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={handleClose} 
            disabled={isLoading}
            color="inherit"
          >
            取消
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={isLoading || !name.trim() || !canCreateMore}
            startIcon={isLoading ? <CircularProgress size={20} /> : <Add />}
          >
            {isLoading ? '創建中...' : '創建資料集'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
