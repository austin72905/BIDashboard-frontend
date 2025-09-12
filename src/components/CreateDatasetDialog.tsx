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
  CircularProgress
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { useDashboardStore } from '../stores/useDashboardStore';

interface CreateDatasetDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateDatasetDialog({ open, onClose }: CreateDatasetDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { createDataset, isLoading, error, setError } = useDashboardStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('資料集名稱不能為空');
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
            disabled={isLoading || !name.trim()}
            startIcon={isLoading ? <CircularProgress size={20} /> : <Add />}
          >
            {isLoading ? '創建中...' : '創建資料集'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
