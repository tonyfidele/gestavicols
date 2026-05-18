export * from "./generated/api";
export * from "./generated/types";
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL missing");
}

const client = postgres(process.env.DATABASE_URL, {
  ssl: "require",
});

export const db = drizzle(client);