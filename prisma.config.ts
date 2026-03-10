// Prisma 7 配置：url 移到此文件而非 schema.prisma
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// 优先加载 .env.local，再 fallback 到 .env
config({ path: ".env.local", override: true });
config({ path: ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"]!,
  },
});
