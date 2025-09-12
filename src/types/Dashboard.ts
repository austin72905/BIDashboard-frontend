export interface DashboardStats {
  ageDistribution: Record<string, number>; // { "20-29": 50, "30-39": 30 }
  genderDistribution: {
    male: number; // 男性比例 (0-1)
    female: number; // 女性比例 (0-1)
  };
  revenueData: {
    monthly: Record<string, number>; // { "2024-01": 150000, "2024-02": 180000 }
    total: number;
    growth: number; // 成長率百分比
  };
  regionDistribution: Record<string, number>; // { "台北": 45.2, "台中": 30.1, "高雄": 24.7 } - 百分比值
  productCategories: Record<string, number>; // { "電子產品": 40, "服飾": 25, "食品": 35 }
  customerMetrics: {
    totalCustomers: number;
    returningCustomers: number;
    averageOrderValue: number;
  };
  salesMetrics: {
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    cancelledOrders: number;
  };
}

// 後端指標數據類型定義
export interface AllMetrics {
  datasetId: number;
  kpiSummary: KpiSummary;
  ageDistribution: AgeDistribution;
  genderShare: GenderShare;
  monthlyRevenueTrend: MonthlyRevenueTrend;
  regionDistribution: RegionDistribution;
  productCategorySales: ProductCategorySales;
  updatedAt: string;
}

export interface KpiSummary {
  datasetId: number;
  totalRevenue: number;
  totalCustomers: number;
  totalOrders: number;
  avgOrderValue: number;
  returningCustomers: number;
  pendingOrders: number;
  updatedAt: string;
}

export interface AgeDistribution {
  datasetId: number;
  points: AgeDistributionPoint[];
  unit?: string;
}

export interface AgeDistributionPoint {
  bucket: string;
  value: number;
}

export interface GenderShare {
  datasetId: number;
  male: number; // 男性比例 (0-1)
  female: number; // 女性比例 (0-1)
  other: number; // 其他比例 (0-1)
}

export interface MonthlyRevenueTrend {
  datasetId: number;
  points: TrendPoint[];
  unit?: string;
}

export interface TrendPoint {
  period: string;
  value: number;
}

export interface RegionDistribution {
  datasetId: number;
  points: RegionDistributionPoint[];
  unit?: string;
}

export interface RegionDistributionPoint {
  name: string;
  value: number;
}

export interface ProductCategorySales {
  datasetId: number;
  points: ProductCategorySalesPoint[];
  unit?: string;
}

export interface ProductCategorySalesPoint {
  category: string;
  qty: number;
}
  