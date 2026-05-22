FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY pnpm-lock.yaml* ./
RUN npm ci || npm install
COPY . .
RUN npm run build && ls -la /app/dist/assets/

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Cleaner nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]