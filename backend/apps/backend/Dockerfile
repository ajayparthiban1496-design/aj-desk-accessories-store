# Medusa backend image. Vercel builds it with the build context set to the
# backend/ workspace root (vercel.json -> services.medusa), so paths below are
# relative to backend/.
FROM node:24-bookworm-slim

WORKDIR /app

# The app's package.json must be present before `npm ci`, otherwise the
# @dtc/backend workspace (and the `medusa` CLI) is not installed.
COPY package.json package-lock.json .npmrc ./
COPY apps/backend/package.json apps/backend/package.json
RUN npm ci --no-audit --no-fund

COPY . .

WORKDIR /app/apps/backend
RUN NODE_OPTIONS=--max-old-space-size=4096 npx medusa build

# `medusa start` serves the Admin from ./public/admin, but `medusa build` writes
# it (with src/admin customisations such as the Messages page) to
# .medusa/server/public/admin. Copy it into place so customisations ship.
RUN rm -rf public/admin && mkdir -p public && cp -r .medusa/server/public/admin public/admin

ENV NODE_ENV=production
EXPOSE 80

# Migrations are run separately (npx medusa db:migrate), not on every boot.
CMD ["sh", "-c", "if [ -z \"$DATABASE_URL\" ] || [ -z \"$JWT_SECRET\" ] || [ -z \"$COOKIE_SECRET\" ]; then echo 'Missing required environment variables: DATABASE_URL, JWT_SECRET, COOKIE_SECRET' >&2; exit 1; fi; exec npx medusa start --host 0.0.0.0 --port \"${PORT:-80}\""]
