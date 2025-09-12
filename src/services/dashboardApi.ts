import axiosInstance from "./axios";
import type { DashboardStats, AllMetrics } from "../types/Dashboard";
import type { UploadHistory } from "../types/UploadHistory";
import { getMockDashboardStats, mockUploadCsv, getMockUploadHistory, getMockBatchDetails, getMockColumnMappingInfo, mockUpsertMappings, getMockAllMetrics, getMockUserDatasets } from "./mockData";

// 模擬延遲函數
const simulateDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// 用戶 Dataset 相關類型定義
export interface UserDataset {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  totalBatches: number;
  totalRows: number;
}

// 後端實際返回的格式：直接返回 ID 數組
export type UserDatasetIds = number[];

// 創建資料集的請求類型
export interface CreateDatasetRequest {
  name: string;
  description?: string;
}

// 創建資料集的響應類型
export interface CreateDatasetResponse {
  datasetId: number;
  name: string;
  description?: string;
  createdAt: string;
}

// 前端內部使用的格式（包含完整信息）
export interface UserDatasetsResponse {
  datasets: UserDataset[];
  total: number;
}

// 將 AllMetrics 轉換為 DashboardStats 格式（向後兼容）
export const convertAllMetricsToDashboardStats = (allMetrics: AllMetrics): DashboardStats => {
  // 轉換年齡分布
  const ageDistribution: Record<string, number> = {};
  allMetrics.ageDistribution.points.forEach(point => {
    ageDistribution[point.bucket] = point.value;
  });

  // 轉換性別分布（直接使用比例值）
  const genderDistribution = {
    male: allMetrics.genderShare.male, // 男性比例 (0-1)
    female: allMetrics.genderShare.female // 女性比例 (0-1)
  };

  // 轉換月營收數據
  const monthlyRevenue: Record<string, number> = {};
  allMetrics.monthlyRevenueTrend.points.forEach(point => {
    monthlyRevenue[point.period] = point.value;
  });

  // 計算總營收和成長率
  const totalRevenue = allMetrics.kpiSummary.totalRevenue;
  const revenueValues = allMetrics.monthlyRevenueTrend.points.map(p => p.value);
  const currentMonth = revenueValues[revenueValues.length - 1] || 0;
  const previousMonth = revenueValues[revenueValues.length - 2] || 0;
  const growth = previousMonth > 0 ? ((currentMonth - previousMonth) / previousMonth) * 100 : 0;

  // 轉換地區分布
  const regionDistribution: Record<string, number> = {};
  allMetrics.regionDistribution.points.forEach(point => {
    regionDistribution[point.name] = point.value;
  });

  // 轉換產品類別
  const productCategories: Record<string, number> = {};
  allMetrics.productCategorySales.points.forEach(point => {
    productCategories[point.category] = point.qty;
  });

  return {
    ageDistribution,
    genderDistribution,
    revenueData: {
      monthly: monthlyRevenue,
      total: totalRevenue,
      growth: growth
    },
    regionDistribution,
    productCategories,
    customerMetrics: {
      totalCustomers: allMetrics.kpiSummary.totalCustomers,
      returningCustomers: allMetrics.kpiSummary.returningCustomers,
      averageOrderValue: allMetrics.kpiSummary.avgOrderValue
    },
    salesMetrics: {
      totalOrders: allMetrics.kpiSummary.totalOrders,
      completedOrders: allMetrics.kpiSummary.totalOrders - allMetrics.kpiSummary.pendingOrders,
      pendingOrders: allMetrics.kpiSummary.pendingOrders,
      cancelledOrders: 0 // 後端沒有提供此數據，設為 0
    }
  };
};

// 是否使用模擬數據（可通過環境變數控制）
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK === 'true';

export const getDashboardStats = async (): Promise<DashboardStats> => {
  if (USE_MOCK_DATA) {
    console.log('🔄 使用模擬數據');
    return getMockDashboardStats();
  }
  
  try {
    const res = await axiosInstance.get<DashboardStats>("/dashboard/stats");
    return res.data;
  } catch (error) {
    console.warn('⚠️  後端連接失敗，切換至模擬數據', error);
    return getMockDashboardStats();
  }
};

export const uploadCsv = async (file: File, datasetId: number): Promise<void> => {
  if (USE_MOCK_DATA) {
    console.log('🔄 使用模擬上傳');
    return mockUploadCsv(file);
  }
  
  try {
    console.log('🔄 上傳 CSV 檔案到後端...', {
      filename: file.name,
      size: file.size,
      datasetId: datasetId,
      endpoint: '/uploads/csv'
    });

    const formData = new FormData();
    formData.append("File", file);  // 注意：後端期望的欄位名稱是 "File"（大寫）
    
    // 構建 URL，datasetId 是必需參數
    const url = `/uploads/csv?datasetId=${datasetId}`;
    
    const response = await axiosInstance.post(url, formData, {
      headers: { 
        "Content-Type": "multipart/form-data" 
      },
    });
    
    console.log('✅ CSV 上傳成功:', response.data);
  } catch (error: any) {
    console.error('❌ CSV 上傳失敗:', error);
    
    // 如果是認證錯誤，拋出具體錯誤
    if (error.response?.status === 401) {
      throw new Error('認證失敗，請重新登入');
    }
    
    // 如果是其他後端錯誤，顯示具體訊息
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    
    // 生產環境下不要切換到模擬上傳，而是拋出錯誤
    if (!USE_MOCK_DATA) {
      throw new Error('檔案上傳失敗，請檢查網路連接和檔案格式');
    }
    
    // 只在開發環境下才切換到模擬上傳
    console.warn('⚠️  後端連接失敗，使用模擬上傳', error);
    return mockUploadCsv(file);
  }
};

// 獲取上傳歷史紀錄
export const getUploadHistory = async (datasetId: number, limit: number = 50, offset: number = 0): Promise<UploadHistory[]> => {
  if (USE_MOCK_DATA) {
    console.log('🔄 使用模擬上傳歷史數據');
    return getMockUploadHistory();
  }
  
  try {
    console.log('🔄 從後端獲取上傳歷史...', { datasetId, limit, offset });
    
    const response = await axiosInstance.get<UploadHistory[]>("/uploads/history", {
      params: { datasetId, limit, offset }
    });
    
    console.log('✅ 上傳歷史獲取成功:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ 獲取上傳歷史失敗:', error);
    
    // 如果是認證錯誤，拋出具體錯誤
    if (error.response?.status === 401) {
      throw new Error('認證失敗，請重新登入');
    }
    
    // 如果是其他後端錯誤，顯示具體訊息
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    
    // 生產環境下不要切換到模擬數據，而是拋出錯誤
    if (!USE_MOCK_DATA) {
      throw new Error('獲取上傳歷史失敗，請檢查網路連接');
    }
    
    // 只在開發環境下才切換到模擬數據
    console.warn('⚠️  後端連接失敗，使用模擬上傳歷史', error);
    return getMockUploadHistory();
  }
};

// 獲取批次詳細資訊
export const getBatchDetails = async (batchId: number): Promise<UploadHistory> => {
  if (USE_MOCK_DATA) {
    console.log('🔄 使用模擬批次詳細數據');
    return getMockBatchDetails(batchId);
  }
  
  try {
    console.log('🔄 從後端獲取批次詳細資訊...', { batchId });
    
    const response = await axiosInstance.get<UploadHistory>(`/uploads/${batchId}/details`);
    
    console.log('✅ 批次詳細資訊獲取成功:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ 獲取批次詳細資訊失敗:', error);
    
    // 如果是認證錯誤，拋出具體錯誤
    if (error.response?.status === 401) {
      throw new Error('認證失敗，請重新登入');
    }
    
    // 如果是 404 錯誤
    if (error.response?.status === 404) {
      throw new Error('找不到指定的批次資料');
    }
    
    // 如果是其他後端錯誤，顯示具體訊息
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    
    // 生產環境下不要切換到模擬數據，而是拋出錯誤
    if (!USE_MOCK_DATA) {
      throw new Error('獲取批次詳細資訊失敗，請檢查網路連接');
    }
    
    // 只在開發環境下才切換到模擬數據
    console.warn('⚠️  後端連接失敗，使用模擬批次詳細數據', error);
    return getMockBatchDetails(batchId);
  }
};

// 欄位映射相關的類型定義
export interface SystemFieldProp {
  fieldName: string;
  expectedType: string;
}

export interface ColumnMappingInfo {
  systemFields: Record<string, SystemFieldProp>;
  dataColumns: DataColumnWithMapping[];
}

export interface DataColumnWithMapping {
  id: number;
  batchId: number;
  sourceName: string;
  dataType: string;
  sampleValue: string | null;
  createdAt: string;
  updatedAt: string;
  mappedSystemField: number | null;
  mappingId: number | null;
  mappingCreatedAt: string | null;
}

export interface UpsertMappingsRequest {
  batchId: number;
  mappings: ColumnMapping[];
}

export interface ColumnMapping {
  sourceColumn: string;
  systemField: number; // 這是 SystemField 枚舉的數字值
}

// SystemField 枚舉值映射（對應後端枚舉）
export const SystemFieldEnum = {
  None: -1,           // 未映射
  Name: 0,
  Email: 1,
  Phone: 2,
  Gender: 3,
  BirthDate: 4,
  Age: 5,
  CustomerId: 6,
  OrderId: 7,
  OrderDate: 8,
  OrderAmount: 9,
  OrderStatus: 10,
  Region: 11,
  ProductCategory: 12
} as const;

// 獲取欄位映射資訊
export const getColumnMappingInfo = async (batchId: number): Promise<ColumnMappingInfo> => {
  if (USE_MOCK_DATA) {
    console.log('🔄 使用模擬欄位映射資訊');
    return getMockColumnMappingInfo(batchId);
  }
  
  try {
    console.log('🔄 從後端獲取欄位映射資訊...', { batchId });
    
    const response = await axiosInstance.get<ColumnMappingInfo>(`/uploads/${batchId}/mapping-info`);
    
    console.log('✅ 欄位映射資訊獲取成功:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ 獲取欄位映射資訊失敗:', error);
    
    // 如果是認證錯誤，拋出具體錯誤
    if (error.response?.status === 401) {
      throw new Error('認證失敗，請重新登入');
    }
    
    // 如果是 404 錯誤
    if (error.response?.status === 404) {
      throw new Error('找不到指定的批次資料');
    }
    
    // 如果是其他後端錯誤，顯示具體訊息
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    
    // 生產環境下不要切換到模擬數據，而是拋出錯誤
    if (!USE_MOCK_DATA) {
      throw new Error('獲取欄位映射資訊失敗，請檢查網路連接');
    }
    
    // 只在開發環境下才切換到模擬數據
    console.warn('⚠️  後端連接失敗，使用模擬欄位映射資訊', error);
    return getMockColumnMappingInfo(batchId);
  }
};

// 更新欄位映射
export const upsertMappings = async (request: UpsertMappingsRequest): Promise<void> => {
  if (USE_MOCK_DATA) {
    console.log('🔄 使用模擬更新映射');
    return mockUpsertMappings(request);
  }
  
  try {
    console.log('🔄 更新欄位映射到後端...', request);
    
    await axiosInstance.put('/uploads/mappings', request);
    
    console.log('✅ 欄位映射更新成功');
  } catch (error: any) {
    console.error('❌ 更新欄位映射失敗:', error);
    
    // 如果是認證錯誤，拋出具體錯誤
    if (error.response?.status === 401) {
      throw new Error('認證失敗，請重新登入');
    }
    
    // 如果是其他後端錯誤，顯示具體訊息
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    
    // 生產環境下不要切換到模擬數據，而是拋出錯誤
    if (!USE_MOCK_DATA) {
      throw new Error('更新欄位映射失敗，請檢查網路連接');
    }
    
    // 只在開發環境下才切換到模擬數據
    console.warn('⚠️  後端連接失敗，使用模擬更新映射', error);
    return mockUpsertMappings(request);
  }
};

// 獲取用戶可用的 datasets
export const getUserDatasets = async (): Promise<UserDatasetsResponse> => {
  if (USE_MOCK_DATA) {
    console.log('🔄 使用模擬用戶 datasets');
    return getMockUserDatasets();
  }

  try {
    console.log('🔄 獲取用戶 datasets...');
    
    // 後端返回的是 ID 數組，不是完整的 dataset 對象
    const response = await axiosInstance.get<UserDatasetIds>('/me/datasets');
    console.log('📡 後端響應:', response);
    console.log('📊 響應數據 (ID 數組):', response.data);
    
    // 檢查響應數據結構
    if (!response.data) {
      console.warn('⚠️  後端返回空數據');
      return { datasets: [], total: 0 };
    }
    
    if (!Array.isArray(response.data)) {
      console.warn('⚠️  後端返回數據不是數組格式');
      return { datasets: [], total: 0 };
    }
    
    // 將 ID 數組轉換為 UserDataset 對象數組
    const datasets: UserDataset[] = response.data.map(id => ({
      id: id,
      name: `資料集 ${id}`,
      description: `用戶資料集 ID: ${id}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'Active',
      totalBatches: 0,
      totalRows: 0
    }));
    
    const result: UserDatasetsResponse = {
      datasets: datasets,
      total: datasets.length
    };
    
    console.log('✅ 用戶 datasets 獲取成功:', result);
    return result;
  } catch (error: any) {
    console.error('❌ 獲取用戶 datasets 失敗:', error);
    console.error('❌ 錯誤詳情:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    });
    
    // 如果是認證錯誤，重新拋出
    if (error.response?.status === 401) {
      throw new Error('認證失敗，請重新登入');
    }
    
    // 如果是其他後端錯誤，顯示具體訊息
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    
    // 如果是網路錯誤或後端未響應，返回空數據而不是拋出錯誤
    if (!error.response) {
      console.warn('⚠️  後端未響應，返回空 datasets');
      return { datasets: [], total: 0 };
    }
    
    // 其他錯誤情況
    throw new Error('獲取用戶 datasets 失敗，請檢查網路連接');
  }
};

// 獲取所有指標數據（統一接口）
export const getAllMetrics = async (datasetId: number, months: number = 12): Promise<AllMetrics> => {
  if (USE_MOCK_DATA) {
    console.log('🔄 使用模擬所有指標數據');
    return getMockAllMetrics(datasetId, months);
  }
  
  try {
    console.log('🔄 從後端獲取所有指標數據...', { datasetId, months });
    
    const response = await axiosInstance.get<AllMetrics>(`/metrics/all?datasetId=${datasetId}&months=${months}`);
    
    console.log('✅ 所有指標數據獲取成功:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ 獲取所有指標數據失敗:', error);
    
    // 如果是認證錯誤，拋出具體錯誤
    if (error.response?.status === 401) {
      throw new Error('認證失敗，請重新登入');
    }
    
    // 如果是 404 錯誤
    if (error.response?.status === 404) {
      throw new Error('找不到指定的資料集');
    }
    
    // 如果是其他後端錯誤，顯示具體訊息
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    
    // 生產環境下不要切換到模擬數據，而是拋出錯誤
    if (!USE_MOCK_DATA) {
      throw new Error('獲取所有指標數據失敗，請檢查網路連接');
    }
    
    // 只在開發環境下才切換到模擬數據
    console.warn('⚠️  後端連接失敗，使用模擬所有指標數據', error);
    return getMockAllMetrics(datasetId, months);
  }
};

// 創建新的資料集
export const createDataset = async (request: CreateDatasetRequest): Promise<CreateDatasetResponse> => {
  if (USE_MOCK_DATA) {
    console.log('🔄 使用模擬創建資料集');
    await simulateDelay(500);
    
    const mockResponse: CreateDatasetResponse = {
      datasetId: Math.floor(Math.random() * 1000) + 100,
      name: request.name,
      description: request.description,
      createdAt: new Date().toISOString()
    };
    
    console.log('✅ 模擬創建資料集成功:', mockResponse);
    return mockResponse;
  }
  
  try {
    console.log('🔄 創建新資料集...', request);
    
    const response = await axiosInstance.post<CreateDatasetResponse>('/uploads/dataset', request);
    
    console.log('✅ 資料集創建成功:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ 創建資料集失敗:', error);
    
    // 如果是認證錯誤，拋出具體錯誤
    if (error.response?.status === 401) {
      throw new Error('認證失敗，請重新登入');
    }
    
    // 如果是其他後端錯誤，顯示具體訊息
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    
    // 生產環境下不要切換到模擬數據，而是拋出錯誤
    if (!USE_MOCK_DATA) {
      throw new Error('創建資料集失敗，請檢查網路連接');
    }
    
    // 只在開發環境下才切換到模擬數據
    console.warn('⚠️  後端連接失敗，使用模擬創建資料集', error);
    return {
      datasetId: Math.floor(Math.random() * 1000) + 100,
      name: request.name,
      description: request.description,
      createdAt: new Date().toISOString()
    };
  }
};

// 刪除批次
export const deleteBatch = async (batchId: number): Promise<void> => {
  if (USE_MOCK_DATA) {
    console.log('🔄 使用模擬刪除批次');
    await simulateDelay(500);
    console.log('✅ 模擬刪除批次成功:', { batchId });
    return;
  }
  
  try {
    console.log('🔄 刪除批次...', { batchId });
    
    const response = await axiosInstance.delete(`/uploads/${batchId}`);
    
    console.log('✅ 批次刪除成功:', response.data);
  } catch (error: any) {
    console.error('❌ 刪除批次失敗:', error);
    
    // 如果是認證錯誤，拋出具體錯誤
    if (error.response?.status === 401) {
      throw new Error('認證失敗，請重新登入');
    }
    
    // 如果是 404 錯誤
    if (error.response?.status === 404) {
      throw new Error('找不到指定的批次或您沒有權限刪除該批次');
    }
    
    // 如果是其他後端錯誤，顯示具體訊息
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    
    // 生產環境下不要切換到模擬數據，而是拋出錯誤
    if (!USE_MOCK_DATA) {
      throw new Error('刪除批次失敗，請檢查網路連接');
    }
    
    // 只在開發環境下才切換到模擬數據
    console.warn('⚠️  後端連接失敗，使用模擬刪除批次', error);
  }
};

// 刪除資料集
export const deleteDataset = async (datasetId: number): Promise<void> => {
  if (USE_MOCK_DATA) {
    console.log('🔄 使用模擬刪除資料集');
    await simulateDelay(500);
    console.log('✅ 模擬刪除資料集成功:', { datasetId });
    return;
  }
  
  try {
    console.log('🔄 刪除資料集...', { datasetId });
    
    const response = await axiosInstance.delete(`/uploads/dataset/${datasetId}`);
    
    console.log('✅ 資料集刪除成功:', response.data);
  } catch (error: any) {
    console.error('❌ 刪除資料集失敗:', error);
    
    // 如果是認證錯誤，拋出具體錯誤
    if (error.response?.status === 401) {
      throw new Error('認證失敗，請重新登入');
    }
    
    // 如果是 404 錯誤
    if (error.response?.status === 404) {
      throw new Error('找不到指定的資料集或您沒有權限刪除該資料集');
    }
    
    // 如果是其他後端錯誤，顯示具體訊息
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    
    // 生產環境下不要切換到模擬數據，而是拋出錯誤
    if (!USE_MOCK_DATA) {
      throw new Error('刪除資料集失敗，請檢查網路連接');
    }
    
    // 只在開發環境下才切換到模擬數據
    console.warn('⚠️  後端連接失敗，使用模擬刪除資料集', error);
  }
};