FROM node:lts-alpine AS base
FROM base AS frontend-builder
WORKDIR /app/frontend
RUN npm i -g corepack@latest && corepack enable pnpm
COPY frontend/package.json frontend/pnpm-lock.yaml ./
ARG TURNSTILE_SITE_KEY="1x00000000000000000000AA"
RUN pnpm i
COPY frontend ./
RUN VITE_TURNSTILE_SITE_KEY=${TURNSTILE_SITE_KEY} pnpm build

FROM base AS production-runner
WORKDIR /app/backend
RUN npm i -g corepack@latest && corepack enable pnpm
COPY backend/package.json backend/pnpm-lock.yaml ./
RUN pnpm i
RUN pnpm build
COPY backend/dist ./src
COPY --from=frontend-builder /app/frontend/dist ./public
ENV NODE_ENV=production
ENV PORT=3300
ENV S3_ENDPOINT=https://storage.googleapis.com
ENV TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
EXPOSE ${PORT}
CMD ["node", "src/index.js"]