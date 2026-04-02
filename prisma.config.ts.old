import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
    schema: "prisma/schema.prisma",
    datasource: {
        url: process.env.DATABASE_URL,
        // @ts-ignore - Prisma 7 config types might be lagging for directUrl
        directUrl: process.env.DIRECT_URL,
    },
});
