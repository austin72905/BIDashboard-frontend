import type { DashboardStats, AllMetrics } from '../types/Dashboard';
import type { UploadHistory } from '../types/UploadHistory';
import type { ColumnMappingInfo, DataColumnWithMapping, UpsertMappingsRequest, UserDatasetsResponse } from './dashboardApi';

// 模擬數據服務
export const mockDashboardStats: DashboardStats = {
  ageDistribution: {
    "18-25": 45,
    "26-35": 78,
    "36-45": 65,
    "46-55": 42,
    "56-65": 28,
    "65+": 15,
  },
  genderDistribution: {
    male: 0.52, // 52% 男性
    female: 0.48, // 48% 女性
  },
  revenueData: {
    monthly: {
      "2024-01": 158000,
      "2024-02": 167000,
      "2024-03": 145000,
      "2024-04": 189000,
      "2024-05": 201000,
      "2024-06": 195000,
      "2024-07": 223000,
      "2024-08": 215000,
      "2024-09": 234000,
      "2024-10": 245000,
      "2024-11": 267000,
      "2024-12": 289000,
    },
    total: 2428000,
    growth: 15.3,
  },
  regionDistribution: {
    "台北": 25.2,  // 百分比
    "新北": 19.5,
    "台中": 16.7,
    "台南": 11.1,
    "高雄": 14.9,
    "桃園": 12.1,
    "其他": 9.0,
  },
  productCategories: {
    "電子產品": 125,
    "服飾配件": 89,
    "美妝保養": 156,
    "居家用品": 98,
    "運動健身": 67,
    "書籍文具": 45,
  },
  customerMetrics: {
    totalCustomers: 2847,
    returningCustomers: 2424,
    averageOrderValue: 1245,
  },
  salesMetrics: {
    totalOrders: 1956,
    completedOrders: 1834,
    pendingOrders: 89,
    cancelledOrders: 33,
  },
};

// 模擬 API 延遲
const simulateDelay = (ms: number = 800) => 
  new Promise(resolve => setTimeout(resolve, ms));

// 模擬獲取儀表板統計數據
export const getMockDashboardStats = async (): Promise<DashboardStats> => {
  await simulateDelay();
  
  // 隨機變化數據，讓每次載入都稍有不同
  const variance = () => Math.floor(Math.random() * 10) - 5; // -5 到 +5 的隨機變化
  const revenueVariance = () => Math.floor(Math.random() * 10000) - 5000; // 營收變化
  
  return {
    ageDistribution: {
      "18-25": Math.max(1, mockDashboardStats.ageDistribution["18-25"] + variance()),
      "26-35": Math.max(1, mockDashboardStats.ageDistribution["26-35"] + variance()),
      "36-45": Math.max(1, mockDashboardStats.ageDistribution["36-45"] + variance()),
      "46-55": Math.max(1, mockDashboardStats.ageDistribution["46-55"] + variance()),
      "56-65": Math.max(1, mockDashboardStats.ageDistribution["56-65"] + variance()),
      "65+": Math.max(1, mockDashboardStats.ageDistribution["65+"] + variance()),
    },
    genderDistribution: {
      male: Math.max(0.1, Math.min(0.9, mockDashboardStats.genderDistribution.male + (Math.random() * 0.1 - 0.05))), // 比例值 (0.1-0.9)
      female: Math.max(0.1, Math.min(0.9, mockDashboardStats.genderDistribution.female + (Math.random() * 0.1 - 0.05))), // 比例值 (0.1-0.9)
    },
    revenueData: {
      monthly: Object.fromEntries(
        Object.entries(mockDashboardStats.revenueData.monthly).map(([month, revenue]) => [
          month,
          Math.max(10000, revenue + revenueVariance())
        ])
      ),
      total: mockDashboardStats.revenueData.total + revenueVariance() * 12,
      growth: Math.max(0, mockDashboardStats.revenueData.growth + (Math.random() * 4 - 2)),
    },
    regionDistribution: Object.fromEntries(
      Object.entries(mockDashboardStats.regionDistribution).map(([region, count]) => [
        region,
        Math.max(1, count + variance())
      ])
    ),
    productCategories: Object.fromEntries(
      Object.entries(mockDashboardStats.productCategories).map(([category, sales]) => [
        category,
        Math.max(1, sales + variance() * 2)
      ])
    ),
    customerMetrics: {
      totalCustomers: Math.max(100, mockDashboardStats.customerMetrics.totalCustomers + variance() * 10),
      returningCustomers: Math.max(50, mockDashboardStats.customerMetrics.returningCustomers + variance() * 8),
      averageOrderValue: Math.max(100, mockDashboardStats.customerMetrics.averageOrderValue + variance() * 10),
    },
    salesMetrics: {
      totalOrders: Math.max(100, mockDashboardStats.salesMetrics.totalOrders + variance() * 5),
      completedOrders: Math.max(80, mockDashboardStats.salesMetrics.completedOrders + variance() * 4),
      pendingOrders: Math.max(0, mockDashboardStats.salesMetrics.pendingOrders + variance()),
      cancelledOrders: Math.max(0, mockDashboardStats.salesMetrics.cancelledOrders + Math.floor(variance() / 2)),
    },
  };
};

// 模擬 CSV 上傳
export const mockUploadCsv = async (file: File): Promise<void> => {
  await simulateDelay(1200);
  
  // 簡單驗證檔案類型
  if (!file.name.endsWith('.csv')) {
    throw new Error('只支援 CSV 檔案格式');
  }
  
  // 模擬上傳成功
  console.log(`模擬上傳檔案: ${file.name}, 大小: ${file.size} bytes`);
};

// 模擬上傳歷史數據
const mockUploadHistoryData: UploadHistory[] = [
  {
    batchId: 1,
    datasetId: 1,
    datasetName: "客戶資料集",
    sourceFilename: "customers_2024_01.csv",
    totalRows: 1250,
    status: "Succeeded",
    errorMessage: undefined,
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:35:00Z",
    columns: [
      { sourceName: "name", dataType: "text", isNullable: false, systemField: "CustomerName" },
      { sourceName: "age", dataType: "integer", isNullable: true, systemField: "Age" },
      { sourceName: "gender", dataType: "text", isNullable: false, systemField: "Gender" },
      { sourceName: "email", dataType: "text", isNullable: true, systemField: "Email" },
      { sourceName: "phone", dataType: "text", isNullable: true, systemField: undefined }
    ]
  },
  {
    batchId: 2,
    datasetId: 2,
    datasetName: "訂單資料集",
    sourceFilename: "orders_2024_01.csv",
    totalRows: 890,
    status: "Processing",
    errorMessage: undefined,
    createdAt: "2024-01-16T14:20:00Z",
    updatedAt: "2024-01-16T14:25:00Z",
    columns: [
      { sourceName: "order_id", dataType: "text", isNullable: false, systemField: "OrderId" },
      { sourceName: "customer_id", dataType: "integer", isNullable: false, systemField: "CustomerId" },
      { sourceName: "amount", dataType: "decimal", isNullable: false, systemField: "Amount" },
      { sourceName: "order_date", dataType: "date", isNullable: false, systemField: "OrderDate" },
      { sourceName: "status", dataType: "text", isNullable: false, systemField: "Status" }
    ]
  },
  {
    batchId: 3,
    datasetId: 3,
    datasetName: "產品資料集",
    sourceFilename: "products_2024_01.csv",
    totalRows: 450,
    status: "Failed",
    errorMessage: "檔案格式錯誤：缺少必要的欄位 'product_name'",
    createdAt: "2024-01-17T09:15:00Z",
    updatedAt: "2024-01-17T09:18:00Z",
    columns: [
      { sourceName: "id", dataType: "integer", isNullable: false, systemField: "ProductId" },
      { sourceName: "price", dataType: "decimal", isNullable: false, systemField: "Price" },
      { sourceName: "category", dataType: "text", isNullable: true, systemField: "Category" }
    ]
  },
  {
    batchId: 4,
    datasetId: 4,
    datasetName: "銷售資料集",
    sourceFilename: "sales_2024_01.csv",
    totalRows: 2100,
    status: "Mapped",
    errorMessage: undefined,
    createdAt: "2024-01-18T16:45:00Z",
    updatedAt: "2024-01-18T16:50:00Z",
    columns: [
      { sourceName: "sales_id", dataType: "text", isNullable: false, systemField: "SalesId" },
      { sourceName: "product_id", dataType: "integer", isNullable: false, systemField: "ProductId" },
      { sourceName: "quantity", dataType: "integer", isNullable: false, systemField: "Quantity" },
      { sourceName: "unit_price", dataType: "decimal", isNullable: false, systemField: "UnitPrice" },
      { sourceName: "total_amount", dataType: "decimal", isNullable: false, systemField: "TotalAmount" },
      { sourceName: "sales_date", dataType: "date", isNullable: false, systemField: "SalesDate" }
    ]
  },
  {
    batchId: 5,
    datasetId: 5,
    datasetName: "員工資料集",
    sourceFilename: "employees_2024_01.csv",
    totalRows: 320,
    status: "Pending",
    errorMessage: undefined,
    createdAt: "2024-01-19T11:30:00Z",
    updatedAt: "2024-01-19T11:30:00Z",
    columns: [
      { sourceName: "employee_id", dataType: "integer", isNullable: false, systemField: "EmployeeId" },
      { sourceName: "name", dataType: "text", isNullable: false, systemField: "EmployeeName" },
      { sourceName: "department", dataType: "text", isNullable: false, systemField: "Department" },
      { sourceName: "position", dataType: "text", isNullable: true, systemField: "Position" },
      { sourceName: "hire_date", dataType: "date", isNullable: false, systemField: "HireDate" }
    ]
  }
];

// 模擬獲取上傳歷史
export const getMockUploadHistory = async (): Promise<UploadHistory[]> => {
  await simulateDelay(600);
  return [...mockUploadHistoryData];
};

// 模擬獲取批次詳細資訊
export const getMockBatchDetails = async (batchId: number): Promise<UploadHistory> => {
  await simulateDelay(400);
  
  const batch = mockUploadHistoryData.find(b => b.batchId === batchId);
  if (!batch) {
    throw new Error(`找不到批次 ID: ${batchId}`);
  }
  
  return { ...batch };
};

// 模擬系統欄位字典 - 使用後端 SystemField 枚舉值
const mockSystemFields = {
  "Name": { fieldName: "Name", expectedType: "string" },
  "Email": { fieldName: "Email", expectedType: "string" },
  "Phone": { fieldName: "Phone", expectedType: "string" },
  "Gender": { fieldName: "Gender", expectedType: "string" },
  "BirthDate": { fieldName: "BirthDate", expectedType: "string" },
  "Age": { fieldName: "Age", expectedType: "string" },
  "CustomerId": { fieldName: "CustomerId", expectedType: "string" },
  "OrderId": { fieldName: "OrderId", expectedType: "string" },
  "OrderDate": { fieldName: "OrderDate", expectedType: "string" },
  "OrderAmount": { fieldName: "OrderAmount", expectedType: "string" },
  "OrderStatus": { fieldName: "OrderStatus", expectedType: "string" },
  "Region": { fieldName: "Region", expectedType: "string" },
  "ProductCategory": { fieldName: "ProductCategory", expectedType: "string" }
};

// 模擬獲取欄位映射資訊
export const getMockColumnMappingInfo = async (batchId: number): Promise<ColumnMappingInfo> => {
  await simulateDelay(400);
  
  // 根據 batchId 返回不同的映射資訊
  const mockDataColumns: DataColumnWithMapping[] = (() => {
    const now = new Date().toISOString();
    switch (batchId) {
      case 1: // 客戶資料集
        return [
          { id: 1, batchId: 1, sourceName: "name", dataType: "text", sampleValue: "John Doe", createdAt: now, updatedAt: now, mappedSystemField: 0, mappingId: 1, mappingCreatedAt: now }, // Name
          { id: 2, batchId: 1, sourceName: "age", dataType: "integer", sampleValue: "25", createdAt: now, updatedAt: now, mappedSystemField: 5, mappingId: 2, mappingCreatedAt: now }, // Age
          { id: 3, batchId: 1, sourceName: "gender", dataType: "text", sampleValue: "Male", createdAt: now, updatedAt: now, mappedSystemField: 3, mappingId: 3, mappingCreatedAt: now }, // Gender
          { id: 4, batchId: 1, sourceName: "email", dataType: "text", sampleValue: "john@example.com", createdAt: now, updatedAt: now, mappedSystemField: 1, mappingId: 4, mappingCreatedAt: now }, // Email
          { id: 5, batchId: 1, sourceName: "phone", dataType: "text", sampleValue: "123-456-7890", createdAt: now, updatedAt: now, mappedSystemField: 2, mappingId: 5, mappingCreatedAt: now } // Phone
        ];
      case 2: // 訂單資料集
        return [
          { id: 6, batchId: 2, sourceName: "order_id", dataType: "text", sampleValue: "ORD001", createdAt: now, updatedAt: now, mappedSystemField: 7, mappingId: 6, mappingCreatedAt: now }, // OrderId
          { id: 7, batchId: 2, sourceName: "customer_id", dataType: "integer", sampleValue: "123", createdAt: now, updatedAt: now, mappedSystemField: 6, mappingId: 7, mappingCreatedAt: now }, // CustomerId
          { id: 8, batchId: 2, sourceName: "amount", dataType: "decimal", sampleValue: "99.99", createdAt: now, updatedAt: now, mappedSystemField: 9, mappingId: 8, mappingCreatedAt: now }, // OrderAmount
          { id: 9, batchId: 2, sourceName: "order_date", dataType: "date", sampleValue: "2024-01-01", createdAt: now, updatedAt: now, mappedSystemField: 8, mappingId: 9, mappingCreatedAt: now }, // OrderDate
          { id: 10, batchId: 2, sourceName: "status", dataType: "text", sampleValue: "Completed", createdAt: now, updatedAt: now, mappedSystemField: 10, mappingId: 10, mappingCreatedAt: now } // OrderStatus
        ];
      case 3: // 產品資料集
        return [
          { id: 11, batchId: 3, sourceName: "id", dataType: "integer", sampleValue: "123", createdAt: now, updatedAt: now, mappedSystemField: 6, mappingId: 11, mappingCreatedAt: now }, // CustomerId
          { id: 12, batchId: 3, sourceName: "price", dataType: "decimal", sampleValue: "29.99", createdAt: now, updatedAt: now, mappedSystemField: 9, mappingId: 12, mappingCreatedAt: now }, // OrderAmount
          { id: 13, batchId: 3, sourceName: "category", dataType: "text", sampleValue: "Electronics", createdAt: now, updatedAt: now, mappedSystemField: 12, mappingId: 13, mappingCreatedAt: now } // ProductCategory
        ];
      case 4: // 銷售資料集
        return [
          { id: 14, batchId: 4, sourceName: "sales_id", dataType: "text", sampleValue: "SALE001", createdAt: now, updatedAt: now, mappedSystemField: 7, mappingId: 14, mappingCreatedAt: now }, // OrderId
          { id: 15, batchId: 4, sourceName: "product_id", dataType: "integer", sampleValue: "456", createdAt: now, updatedAt: now, mappedSystemField: 6, mappingId: 15, mappingCreatedAt: now }, // CustomerId
          { id: 16, batchId: 4, sourceName: "quantity", dataType: "integer", sampleValue: "5", createdAt: now, updatedAt: now, mappedSystemField: null, mappingId: null, mappingCreatedAt: null },
          { id: 17, batchId: 4, sourceName: "unit_price", dataType: "decimal", sampleValue: "29.99", createdAt: now, updatedAt: now, mappedSystemField: 9, mappingId: 16, mappingCreatedAt: now }, // OrderAmount
          { id: 18, batchId: 4, sourceName: "total_amount", dataType: "decimal", sampleValue: "149.95", createdAt: now, updatedAt: now, mappedSystemField: 9, mappingId: 17, mappingCreatedAt: now }, // OrderAmount
          { id: 19, batchId: 4, sourceName: "sales_date", dataType: "date", sampleValue: "2024-01-01", createdAt: now, updatedAt: now, mappedSystemField: 8, mappingId: 18, mappingCreatedAt: now } // OrderDate
        ];
      case 5: // 員工資料集
        return [
          { id: 20, batchId: 5, sourceName: "employee_id", dataType: "integer", sampleValue: "123", createdAt: now, updatedAt: now, mappedSystemField: 6, mappingId: 19, mappingCreatedAt: now }, // CustomerId
          { id: 21, batchId: 5, sourceName: "name", dataType: "text", sampleValue: "John Doe", createdAt: now, updatedAt: now, mappedSystemField: 0, mappingId: 20, mappingCreatedAt: now }, // Name
          { id: 22, batchId: 5, sourceName: "department", dataType: "text", sampleValue: "IT", createdAt: now, updatedAt: now, mappedSystemField: 11, mappingId: 21, mappingCreatedAt: now }, // Region
          { id: 23, batchId: 5, sourceName: "position", dataType: "text", sampleValue: "Developer", createdAt: now, updatedAt: now, mappedSystemField: null, mappingId: null, mappingCreatedAt: null },
          { id: 24, batchId: 5, sourceName: "hire_date", dataType: "date", sampleValue: "2020-01-01", createdAt: now, updatedAt: now, mappedSystemField: 4, mappingId: 22, mappingCreatedAt: now } // BirthDate
        ];
      default:
        return [
          { id: 25, batchId: batchId, sourceName: "id", dataType: "integer", sampleValue: "123", createdAt: now, updatedAt: now, mappedSystemField: null, mappingId: null, mappingCreatedAt: null },
          { id: 26, batchId: batchId, sourceName: "name", dataType: "text", sampleValue: "Sample", createdAt: now, updatedAt: now, mappedSystemField: 0, mappingId: 23, mappingCreatedAt: now }, // Name
          { id: 27, batchId: batchId, sourceName: "value", dataType: "decimal", sampleValue: "99.99", createdAt: now, updatedAt: now, mappedSystemField: 9, mappingId: 24, mappingCreatedAt: now } // OrderAmount
        ];
    }
  })();
  
  return {
    systemFields: mockSystemFields,
    dataColumns: mockDataColumns
  };
};

// 模擬更新欄位映射
export const mockUpsertMappings = async (request: UpsertMappingsRequest): Promise<void> => {
  await simulateDelay(800);
  
  console.log('模擬更新欄位映射:', {
    batchId: request.batchId,
    mappingsCount: request.mappings.length,
    mappings: request.mappings
  });
  
  // 模擬一些驗證邏輯
  if (request.mappings.length === 0) {
    throw new Error('對應設定不能為空');
  }
  
  // 檢查是否有重複的來源欄位
  const sourceColumns = request.mappings.map(m => m.sourceColumn);
  const duplicateColumns = sourceColumns.filter((col, index) => sourceColumns.indexOf(col) !== index);
  if (duplicateColumns.length > 0) {
    throw new Error(`來源欄位不能重複對應: ${duplicateColumns.join(', ')}`);
  }
  
  // 檢查是否有重複的系統欄位
  const systemFields = request.mappings.map(m => m.systemField);
  const duplicateSystemFields = systemFields.filter((field, index) => systemFields.indexOf(field) !== index);
  if (duplicateSystemFields.length > 0) {
    throw new Error(`系統欄位不能重複對應: ${duplicateSystemFields.join(', ')}`);
  }
  
  console.log('✅ 模擬欄位映射更新成功');
};

// 模擬獲取所有指標數據
export const getMockAllMetrics = async (datasetId: number, months: number = 12): Promise<AllMetrics> => {
  await simulateDelay(800);
  
  const now = new Date().toISOString();
  
  return {
    datasetId,
    kpiSummary: {
      datasetId,
      totalRevenue: 2850000,
      totalCustomers: 1250,
      totalOrders: 3420,
      avgOrderValue: 833.33,
      returningCustomers: 1070,
      pendingOrders: 45,
      updatedAt: now
    },
    ageDistribution: {
      datasetId,
      points: [
        { bucket: "18-25", value: 320 },
        { bucket: "26-35", value: 450 },
        { bucket: "36-45", value: 280 },
        { bucket: "46-55", value: 150 },
        { bucket: "56-65", value: 50 }
      ]
    },
    genderShare: {
      datasetId,
      male: 650,
      female: 580,
      other: 20
    },
    monthlyRevenueTrend: {
      datasetId,
      points: Array.from({ length: months }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (months - 1 - i));
        const month = date.toISOString().slice(0, 7);
        const baseValue = 200000 + Math.random() * 100000;
        return {
          period: month,
          value: Math.round(baseValue)
        };
      })
    },
    regionDistribution: {
      datasetId,
      points: [
        { name: "台北", value: 450 },
        { name: "台中", value: 320 },
        { name: "高雄", value: 280 },
        { name: "台南", value: 150 },
        { name: "桃園", value: 50 }
      ]
    },
    productCategorySales: {
      datasetId,
      points: [
        { category: "電子產品", qty: 1200 },
        { category: "服飾", qty: 850 },
        { category: "食品", qty: 650 },
        { category: "家居用品", qty: 420 },
        { category: "運動用品", qty: 300 }
      ]
    },
    updatedAt: now
  };
};

// 模擬用戶 datasets
export const getMockUserDatasets = async (): Promise<UserDatasetsResponse> => {
  await simulateDelay(300);
  
  const mockDatasets: UserDatasetsResponse = {
    datasets: [
      {
        id: 1,
        name: "客戶訂單資料集",
        description: "包含客戶基本資訊和訂單記錄",
        createdAt: "2024-01-15T10:00:00Z",
        updatedAt: "2024-01-20T15:30:00Z",
        status: "Active",
        totalBatches: 3,
        totalRows: 1250
      },
      {
        id: 2,
        name: "產品銷售資料集",
        description: "產品銷售和庫存數據",
        createdAt: "2024-01-10T09:00:00Z",
        updatedAt: "2024-01-18T12:00:00Z",
        status: "Active",
        totalBatches: 2,
        totalRows: 850
      },
      {
        id: 3,
        name: "員工績效資料集",
        description: "員工工作績效和考評數據",
        createdAt: "2024-01-05T14:00:00Z",
        updatedAt: "2024-01-12T16:45:00Z",
        status: "Active",
        totalBatches: 1,
        totalRows: 120
      }
    ],
    total: 3
  };
  
  return mockDatasets;
};
