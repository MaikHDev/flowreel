import { type Config } from "drizzle-kit";

import { env } from "~/env";
const isDocker = process.env.IS_DOCKER === 'true';

export default {
  schema: "./src/server/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    // url: env.DATABASE_URL,
    host: isDocker ? 'db' : 'localhost',
    user: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    database: env.POSTGRES_DATABASE,
    port: env.POSTGRES_PORT,
    ssl: false,
  },
  tablesFilter: ["flowreel_*"],
} satisfies Config;
