# ExplainMyLesson AI - Frontend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Next.js pada Alpine butuh libc6-compat
RUN apk add --no-cache libc6-compat

# Salin package.json dan konfigurasi build
COPY frontend/package.json ./package.json
COPY tsconfig.json ./tsconfig.json
COPY postcss.config.mjs ./postcss.config.mjs
COPY tailwind.config.ts ./tailwind.config.ts
COPY next.config.mjs ./next.config.mjs

# Install dependensi frontend
RUN npm install

# Salin kode frontend dan shared
COPY frontend ./frontend
COPY shared ./shared

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=development
ENV BACKEND_URL=http://backend:4000

CMD ["npx", "next", "dev", "frontend", "--webpack", "-H", "0.0.0.0", "-p", "3000"]
