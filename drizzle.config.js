/** @type { import("drizzle-kit").Config } */
export default {
    schema: "./utils/schema.js",
    dialect: 'postgresql',
    dbCredentials: {
      url: 'postgresql://neondb_owner:npg_ZL2EM1JpvhFV@ep-empty-violet-a56qxcm0-pooler.us-east-2.aws.neon.tech/mockmate?sslmode=require',
    }
  }; 