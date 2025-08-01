# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["npm", "start"] 