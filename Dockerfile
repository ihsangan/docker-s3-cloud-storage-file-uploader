FROM oven/bun:alpine AS base
FROM base AS frontend-builder
WORKDIR /app
COPY frontend ./
RUN bun install
ARG TURNSTILE_SITE_KEY="1x00000000000000000000AA"
RUN VITE_TURNSTILE_SITE_KEY=${TURNSTILE_SITE_KEY} bunx --bun vite build

FROM node:lts-alpine AS production-runner
WORKDIR /app/backend
RUN npm i -g corepack@latest && corepack enable pnpm
COPY backend/package.json backend/pnpm-lock.yaml ./
RUN pnpm i
COPY backend ./
RUN pnpm build
COPY --from=frontend-builder /app/dist ./public
ENV NODE_ENV=production
ENV PORT=3300
ENV S3_ENDPOINT=https://storage.googleapis.com
ENV TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
EXPOSE ${PORT}
CMD ["pnpm", "start"]