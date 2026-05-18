# ---- Build Stage ----
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src/ src/
RUN npm run build

# ---- Production Stage ----
FROM node:24-alpine

WORKDIR /app

# Combine adduser + wget into one layer for smaller image
RUN apk add --no-cache wget \
    && addgroup -S appgroup \
    && adduser -S appuser -G appgroup

COPY --chown=appuser:appgroup package*.json ./
RUN npm ci --omit=dev

COPY --chown=appuser:appgroup --from=builder /app/dist ./dist

USER appuser

EXPOSE 3000

# CMD instead of ENTRYPOINT: allows `docker run ... sh` for debugging
CMD ["node", "dist/main"]
