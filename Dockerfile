# syntax=docker/dockerfile:1

FROM node:20-alpine AS base

# ---- deps stage: install all dependencies ----
FROM base AS deps
WORKDIR /app
COPY package*.json ./
# prisma/schema.prisma must be present before npm ci — postinstall runs "prisma generate"
COPY prisma ./prisma
# HUSKY=0 prevents husky from running inside Docker (no .git directory)
# DATABASE_URL is a dummy value — prisma generate (postinstall) validates the env var
# is present but does not connect to the database during build.
RUN HUSKY=0 DATABASE_URL="postgresql://localhost/dummy" npm ci

# ---- dev stage: used by docker-compose for local development ----
FROM base AS dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# Source is mounted as a volume at runtime — no COPY needed
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ---- migrator stage: runs prisma migrate deploy as a k8s init container ----
FROM base AS migrator
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma
CMD ["npx", "prisma", "migrate", "deploy"]

# ---- builder stage: production build ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- runner stage: minimal production image ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
