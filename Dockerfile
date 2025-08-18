# =================================================================
# BUILDER STAGE
# =================================================================
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --ignore-scripts

COPY . .

RUN npx prisma generate

ENV DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public"
RUN npm run build

RUN npm prune --production


# =================================================================
# PRODUCTION STAGE
# =================================================================
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache git

RUN addgroup -g 1001 -S nodejs && adduser -S flora -u 1001

COPY --from=builder --chown=flora:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=flora:nodejs /app/dist ./dist
COPY --from=builder --chown=flora:nodejs /app/prisma ./prisma
COPY --from=builder --chown=flora:nodejs /app/package.json ./package.json

ENV DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public"
RUN npx prisma generate

USER flora

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["node", "dist/src/main.js"]
