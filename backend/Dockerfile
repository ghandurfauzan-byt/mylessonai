# ExplainMyLesson AI - Lightweight Backend Dockerfile
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Salin package.json backend
COPY backend/package.json ./package.json
COPY tsconfig.json ./tsconfig.json

# Install dependensi backend secara cepat (pure JS, no native build needed)
RUN npm install --omit=dev && npm install -g tsx typescript

# Salin source code backend dan shared
COPY backend ./backend
COPY shared ./shared

# Ekspos port backend API
EXPOSE 4000

# Environment defaults
ENV NODE_ENV=production
ENV PORT=4000

# Jalankan backend Express menggunakan tsx
CMD ["tsx", "backend/server/index.ts"]
