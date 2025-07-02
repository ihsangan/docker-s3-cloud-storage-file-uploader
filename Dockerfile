FROM oven/bun:alpine AS base
FROM base AS frontend-builder
WORKDIR /app
COPY frontend ./
RUN bun install
ARG TURNSTILE_SITE_KEY="1x00000000000000000000AA"
RUN VITE_TURNSTILE_SITE_KEY=${TURNSTILE_SITE_KEY} bunx --bun vite build

FROM base AS production-runner
WORKDIR /app
COPY backend ./
RUN bun install
COPY --from=frontend-builder /app/dist ./public
ENV PORT=3300
ENV S3_ENDPOINT=https://storage.googleapis.com
ENV TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
EXPOSE ${PORT}
CMD ["bun", "start"]