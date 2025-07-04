FROM oven/bun:alpine AS builder
FROM builder AS frontend
WORKDIR /app
COPY frontend ./
RUN bun i
ARG TURNSTILE_SITE_KEY="1x00000000000000000000AA"
RUN VITE_TURNSTILE_SITE_KEY=${TURNSTILE_SITE_KEY} bunx --bun vite build
FROM builder AS backend
WORKDIR /app
COPY backend ./
RUN bun i
ENV PORT=3300
ENV S3_ENDPOINT=https://storage.googleapis.com
ENV TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
RUN bun build --compile --minify --sourcemap ./src/index.ts --outfile run
FROM alpine:3.20 AS server
WORKDIR /app
RUN apk add --no-cache libgcc libstdc++
COPY --from=backend /app/run ./
COPY --from=frontend /app/dist ./public
ENV PORT=3300
EXPOSE ${PORT}
CMD ["./run"]