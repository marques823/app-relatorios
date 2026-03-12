# Build stage
FROM node:20 AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM node:20

WORKDIR /app

# Install dependencies (including native ones)
COPY package*.json ./
RUN npm install --omit=dev

# Copy built assets and server file
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.ts ./
COPY --from=build /app/tsconfig.json ./

# Install tsx globally in the production image
RUN npm install -g tsx

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE $PORT

CMD ["tsx", "server.ts"]
