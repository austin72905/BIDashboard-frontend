// 上傳歷史紀錄相關的類型定義

export interface UploadHistoryColumn {
  sourceName: string;
  dataType: string;
  isNullable: boolean;
  systemField?: string; // 對應的系統欄位名稱
}

export interface UploadHistory {
  batchId: number;
  datasetId: number;
  datasetName: string;
  sourceFilename: string;
  totalRows: number;
  status: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  columns: UploadHistoryColumn[];
}

export interface UploadHistoryResponse {
  data: UploadHistory[];
  total?: number;
  limit: number;
  offset: number;
}

// 批次狀態的枚舉
export enum BatchStatus {
  PENDING = 'Pending',
  MAPPED = 'Mapped', 
  PROCESSING = 'Processing',
  SUCCEEDED = 'Succeeded',
  FAILED = 'Failed'
}

// 狀態對應的中文標籤和顏色
export const BatchStatusConfig = {
  [BatchStatus.PENDING]: { label: '等待中', color: 'warning' as const },
  [BatchStatus.MAPPED]: { label: '已映射', color: 'info' as const },
  [BatchStatus.PROCESSING]: { label: '處理中', color: 'primary' as const },
  [BatchStatus.SUCCEEDED]: { label: '成功', color: 'success' as const },
  [BatchStatus.FAILED]: { label: '失敗', color: 'error' as const }
};
