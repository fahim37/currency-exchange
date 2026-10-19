import { config } from "dotenv";
config({ path: ".env.local", quiet: true });
config({ quiet: true });
if (!process.env.DATABASE_URL)
  throw new Error(
    "Configure DATABASE_URL in .env.local before running this command.",
  );
