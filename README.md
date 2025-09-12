# BI 數據儀表板 MVP

一個基於 React + TypeScript + Material-UI 構建的商業智慧（BI）儀表板，提供數據視覺化和分析功能。

## ✨ 功能特色

- 📊 **互動式圖表**: 使用 Chart.js 和 react-chartjs-2 創建美觀的年齡分布和性別比例圖表
- 📈 **統計卡片**: 即時顯示關鍵指標和百分比統計
- 📁 **CSV 檔案上傳**: 支援 CSV 檔案上傳和數據更新
- 🎨 **現代化 UI**: 使用 Material-UI 組件和自定義主題
- 📱 **響應式設計**: 適配各種螢幕尺寸
- 🔄 **狀態管理**: 使用 Zustand 進行輕量級狀態管理
- 🛠️ **錯誤處理**: 完善的載入狀態和錯誤提示
- 🎯 **模擬數據**: 內建模擬數據服務，無需後端即可展示功能

## 🚀 快速開始

### 安裝依賴

```bash
npm install
```

### 啟動開發伺服器

```bash
npm run dev
```

應用將在 `http://localhost:5173` 運行

### 建置生產版本

```bash
npm run build
```

### 預覽生產版本

```bash
npm run preview
```

## 📁 專案結構

```
src/
├── components/          # 可重用組件
├── charts/             # 圖表組件
│   ├── AgeDistributionChart.tsx
│   └── GenderPieChart.tsx
├── services/           # API 和數據服務
│   ├── axios.ts
│   ├── dashboardApi.ts
│   └── mockData.ts
├── stores/             # Zustand 狀態管理
│   └── useDashboardStore.ts
├── types/              # TypeScript 型別定義
│   └── Dashboard.ts
├── theme.ts            # Material-UI 主題配置
├── App.tsx             # 主要應用組件
└── main.tsx            # 應用入口點
```

## 🎨 主要組件

### 儀表板功能
- **統計卡片**: 顯示總人數、性別比例、年齡組數等關鍵指標
- **年齡分布圖表**: 橫向柱狀圖顯示各年齡組人數分布
- **性別比例圖表**: 圓餅圖顯示男女比例
- **檔案上傳**: 支援 CSV 格式數據上傳

### 技術特色
- **TypeScript**: 提供類型安全和更好的開發體驗
- **Material-UI**: 現代化的 React UI 框架
- **Chart.js**: 強大的圖表庫
- **Zustand**: 輕量級狀態管理
- **響應式設計**: 適配手機、平板、桌面等設備

## 🔧 環境配置

### 開發模式
應用預設使用模擬數據，無需後端即可運行。

### 連接真實後端
設定環境變數 `VITE_USE_MOCK=false` 或部署到生產環境時，應用會嘗試連接真實的 API 端點：

- `GET /dashboard/stats` - 獲取儀表板統計數據
- `POST /dashboard/upload` - 上傳 CSV 檔案

## 📊 數據格式

CSV 檔案應包含以下欄位：
- 年齡相關欄位（用於年齡分布統計）
- 性別欄位（male/female 或 男/女）

範例數據格式：
```csv
age,gender
25,male
32,female
45,male
...
```

## 🛠️ 開發工具

- **Vite**: 快速的建置工具
- **ESLint**: 代碼品質檢查
- **Prettier**: 代碼格式化
- **TypeScript**: 靜態類型檢查

## 📝 授權

此專案使用 MIT 授權條款。