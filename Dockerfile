FROM node:lts-alpine AS frontend-builder
WORKDIR /app/frontend
RUN npm install -g corepack@latest
RUN corepack enable pnpm
COPY frontend/package.json frontend/pnpm-lock.yaml ./
ARG TURNSTILE_SITE_KEY="1x00000000000000000000AA"
RUN pnpm install
COPY frontend ./
RUN VITE_TURNSTILE_SITE_KEY=${TURNSTILE_SITE_KEY} pnpm build

FROM node:lts-alpine AS production-runner
WORKDIR /app/backend
RUN npm install -g corepack@latest
RUN corepack enable pnpm
ENV NODE_ENV=production
COPY backend/package.json backend/pnpm-lock.yaml ./
RUN pnpm install --prod
COPY backend/src ./src
COPY --from=frontend-builder /app/frontend/dist ./public
ENV PORT=3300
ENV GCS_S3_ENDPOINT=https://storage.googleapis.com
ENV TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
EXPOSE ${PORT}
CMD ["node", "src/index.js"]