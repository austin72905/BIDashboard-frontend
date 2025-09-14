# 多階段建置
FROM node:20-alpine AS builder

WORKDIR /app

# 複製 package 檔案
COPY package*.json ./

# 安裝依賴
RUN npm ci

# 複製原始碼
COPY . .

# 建立應用
RUN npm run build

# 生產階段
FROM nginx:alpine

# 複製建置結果到 nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# 複製 nginx 配置（如果有的話）
# COPY nginx.conf /etc/nginx/nginx.conf

# 暴露 port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]