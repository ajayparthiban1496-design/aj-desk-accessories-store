import { defineConfig, loadEnv } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

const isProduction = process.env.NODE_ENV === "production"

// Local development origins. Production origins come from STORE_CORS /
// ADMIN_CORS / AUTH_CORS (the live domain, e.g. https://aj-desk-accessories-store.vercel.app).
const DEV_STORE_CORS = "http://localhost:5173,http://localhost:4173"
const DEV_ADMIN_CORS = "http://localhost:5174,http://localhost:9000"

// Upstash on Vercel provides KV_URL / REDIS_URL. Without Redis, admin sessions
// live in one container's memory and are lost when Vercel restarts it.
const redisUrl = process.env.REDIS_URL || process.env.KV_URL

// Files (Admin image uploads, product import/export CSVs). Default: stored in
// Postgres and served from /files/<key>, because the container disk on Vercel
// is temporary. Set S3_* to use S3 / Cloudflare R2 instead.
const fileModule = {
  resolve: "@medusajs/medusa/file",
  options: {
    providers: [
      process.env.S3_BUCKET
        ? {
            resolve: "@medusajs/medusa/file-s3",
            id: "s3",
            options: {
              file_url: process.env.S3_FILE_URL,
              access_key_id: process.env.S3_ACCESS_KEY_ID,
              secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
              region: process.env.S3_REGION,
              bucket: process.env.S3_BUCKET,
              endpoint: process.env.S3_ENDPOINT,
            },
          }
        : {
            resolve: "./src/modules/database-file",
            id: "database",
            // Production: root-relative /files/<key> URLs (same domain as the site).
            // Locally the storefront runs on another port, so use the backend URL.
            options: {
              base_url: process.env.FILE_BASE_URL || (isProduction ? "" : "http://localhost:9000"),
            },
          },
    ],
  },
}

module.exports = defineConfig({
  projectConfig: {
    // Neon gives a pooled DATABASE_URL and a direct DATABASE_URL_UNPOOLED. Medusa
    // is a long-running server and migrations need a direct connection.
    databaseUrl: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL,
    redisUrl,
    workerMode: (process.env.MEDUSA_WORKER_MODE as "shared" | "worker" | "server") || "shared",
    http: {
      storeCors: process.env.STORE_CORS || DEV_STORE_CORS,
      adminCors: process.env.ADMIN_CORS || DEV_ADMIN_CORS,
      authCors: process.env.AUTH_CORS || `${DEV_STORE_CORS},${DEV_ADMIN_CORS}`,
      jwtSecret: process.env.JWT_SECRET || (isProduction ? "" : "dev_only_jwt_secret_aj_desk"),
      cookieSecret: process.env.COOKIE_SECRET || (isProduction ? "" : "dev_only_cookie_secret_aj_desk"),
    },
    cookieOptions: {
      secure: process.env.COOKIE_SECURE === "true" || isProduction,
      sameSite: "lax",
    },
  },
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
  },
  modules: [
    fileModule,
    { resolve: "./src/modules/contact" },
    // Redis-backed event bus, workflow engine and locking. Off by default: on a
    // single container they add nothing, and the queue's constant polling would
    // use up Upstash's free command allowance. Set MEDUSA_REDIS_MODULES=true when
    // running separate server and worker instances.
    ...(redisUrl && process.env.MEDUSA_REDIS_MODULES === "true"
      ? [
          { resolve: "@medusajs/medusa/event-bus-redis", options: { redisUrl } },
          { resolve: "@medusajs/medusa/workflow-engine-redis", options: { redis: { redisUrl } } },
          {
            resolve: "@medusajs/medusa/locking",
            options: {
              providers: [{ resolve: "@medusajs/medusa/locking-redis", id: "locking-redis", is_default: true, options: { redisUrl } }],
            },
          },
        ]
      : []),
  ],
})
