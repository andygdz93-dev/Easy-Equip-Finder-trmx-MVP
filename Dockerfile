# syntax=docker/dockerfile:1
FROM node:20-alpine AS build
WORKDIR /repo
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --frozen-lockfile
COPY . .

RUN pnpm --filter @easyfinderai/shared build
RUN pnpm --filter @easyfinderai/api build

# after your build + deploy step:
RUN pnpm --filter @easyfinderai/api deploy --prod /out

# ---- runtime ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# prod deps from pnpm deploy output
COPY --from=build /out/package.json ./package.json
COPY --from=build /out/node_modules ./node_modules

# ✅ compiled app from the real build output
COPY --from=build /repo/apps/api/dist ./dist

EXPOSE 8080
CMD ["node", "dist/src/index.js"]
