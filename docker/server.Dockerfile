# ── Build Stage ───────────────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# ── Production Stage ─────────────────────────────────
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder --chown=expressjs:nodejs /app/dist ./dist

USER expressjs

EXPOSE 4000

CMD ["node", "dist/index.js"]
