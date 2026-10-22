# Stage 1: Build React application
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package manifests and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and config
COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts index.html postcss.config.js tailwind.config.js ./
COPY src/ ./src/
COPY public/ ./public/

# Build optimized production bundle
RUN npm run build

# Stage 2: Serve with lightweight Nginx
FROM nginx:alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
