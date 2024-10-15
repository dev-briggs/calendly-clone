import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// async function main() {
//   const sql = neon(process.env.DATABASE_URL!);
//   const db = drizzle(sql, { schema });
// }

// main();

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
