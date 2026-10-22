# Stage 1: Build TypeScript application
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Install all dependencies (including devDependencies for tsc)
RUN npm install

# Copy source code and database migrations
COPY tsconfig.json ./
COPY src/ ./src/

# Compile TypeScript to dist/
RUN npm run build

# Stage 2: Production runtime
FROM node:22-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Copy package manifests and install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled JavaScript output and database assets
COPY --from=builder /app/dist ./dist
COPY src/database/schema.sql ./dist/database/schema.sql

# Create persistent data directory for SQLite
RUN mkdir -p /app/data

EXPOSE 5000

CMD ["node", "dist/server.js"]
