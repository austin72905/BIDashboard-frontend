import { create } from "zustand";
import type { DashboardStats, AllMetrics } from "../types/Dashboard";
import type { UserDataset, CreateDatasetRequest, CreateDatasetResponse } from "../services/dashboardApi";

interface DashboardState {
  stats: DashboardStats | null;
  allMetrics: AllMetrics | null;
  userDatasets: UserDataset[];
  currentDatasetId: number | null;
  isLoading: boolean;
  error: string | null;
  setStats: (data: DashboardStats) => void;
  setAllMetrics: (data: AllMetrics) => void;
  setUserDatasets: (datasets: UserDataset[]) => void;
  setCurrentDatasetId: (datasetId: number | null) => void;
  getCurrentDataset: () => UserDataset | null;
  createDataset: (request: CreateDatasetRequest) => Promise<CreateDatasetResponse>;
  deleteDataset: (datasetId: number) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  stats: null,
  allMetrics: null,
  userDatasets: [],
  currentDatasetId: null,
  isLoading: false,
  error: null,
  setStats: (data) => set({ stats: data }),
  setAllMetrics: (data) => set({ allMetrics: data }),
  setUserDatasets: (datasets) => set({ userDatasets: datasets }),
  setCurrentDatasetId: (datasetId) => set({ currentDatasetId: datasetId }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  getCurrentDataset: () => {
    const { userDatasets, currentDatasetId } = get();
    return userDatasets.find(dataset => dataset.id === currentDatasetId) || null;
  },
  createDataset: async (request) => {
    const { setUserDatasets, setCurrentDatasetId, setLoading, setError } = get();
    
    try {
      setLoading(true);
      setError(null);
      
      // 動態導入 API 函數以避免循環依賴
      const { createDataset: createDatasetApi } = await import('../services/dashboardApi');
      const response = await createDatasetApi(request);
      
      // 創建新的 UserDataset 對象
      const newDataset: UserDataset = {
        id: response.datasetId,
        name: response.name,
        description: response.description,
        createdAt: response.createdAt,
        updatedAt: response.createdAt,
        status: 'Active',
        totalBatches: 0,
        totalRows: 0
      };
      
      // 更新 datasets 列表
      const { userDatasets } = get();
      const updatedDatasets = [...userDatasets, newDataset];
      setUserDatasets(updatedDatasets);
      
      // 自動切換到新創建的 dataset
      setCurrentDatasetId(response.datasetId);
      
      setLoading(false);
      return response;
    } catch (error: any) {
      setError(error.message || '創建資料集失敗');
      setLoading(false);
      throw error;
    }
  },
  deleteDataset: async (datasetId) => {
    const { setUserDatasets, setCurrentDatasetId, setLoading, setError } = get();
    
    try {
      setLoading(true);
      setError(null);
      
      // 動態導入 API 函數以避免循環依賴
      const { deleteDataset: deleteDatasetApi } = await import('../services/dashboardApi');
      await deleteDatasetApi(datasetId);
      
      // 從 datasets 列表中移除
      const { userDatasets, currentDatasetId } = get();
      const updatedDatasets = userDatasets.filter(dataset => dataset.id !== datasetId);
      setUserDatasets(updatedDatasets);
      
      // 如果刪除的是當前選中的資料集，切換到其他資料集或清空
      if (currentDatasetId === datasetId) {
        const nextDataset = updatedDatasets.length > 0 ? updatedDatasets[0] : null;
        setCurrentDatasetId(nextDataset?.id || null);
      }
      
      setLoading(false);
    } catch (error: any) {
      setError(error.message || '刪除資料集失敗');
      setLoading(false);
      throw error;
    }
  },
}));
