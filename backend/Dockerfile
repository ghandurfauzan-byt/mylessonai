# ExplainMyLesson AI - Backend Dockerfile
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install build dependencies if needed
RUN apk add --no-cache curl python3 make g++

# Salin package.json dan package-lock.json
COPY package*.json tsconfig.json ./

# Install dependensi
RUN npm install

# Salin source code backend dan shared
COPY backend ./backend
COPY shared ./shared

# Ekspos port backend API
EXPOSE 4000

# Environment defaults
ENV NODE_ENV=production
ENV PORT=4000

# Jalankan backend Express menggunakan tsx
CMD ["npx", "tsx", "backend/server/index.ts"]
