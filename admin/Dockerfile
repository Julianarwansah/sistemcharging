# ============================================================
# SistemCharging Admin Panel - Hugging Face Spaces Dockerfile
# ============================================================

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json .npmrc* ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build argument for API URL (set when building)
ARG VITE_API_URL=https://your-username-sistemcharging-backend.hf.space/api/v1
ENV VITE_API_URL=$VITE_API_URL

# Build the app
RUN npm run build

# ============================================================
# Run stage - serve with nginx
# ============================================================
FROM nginx:alpine

# Copy built app
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Hugging Face Spaces requires port 7860
EXPOSE 7860

CMD ["nginx", "-g", "daemon off;"]
