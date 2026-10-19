FROM node:20-alpine

WORKDIR /app

COPY server.js ./server.js

EXPOSE 11434

ENV NODE_ENV=production
ENV PORT=11434

CMD ["node", "server.js"]
