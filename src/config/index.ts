import dotenv from "dotenv";

dotenv.config();

const port = parseInt(process.env.PORT || "5000", 10);
const nodeEnv = process.env.NODE_ENV || "development";
const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
const adminUrl = process.env.ADMIN_URL || "http://localhost:3001";
const mongoUri =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/abc_db";
const jwtSecret =
  process.env.JWT_SECRET || "abc_secret_jwt_key_development_only";
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "7d";
const resendApiKey = process.env.RESEND_API_KEY || "";
const emailFrom = process.env.EMAIL_FROM || "ABC Typing <onboarding@resend.dev>";

export const config = {
  port,
  nodeEnv,
  isProduction: nodeEnv === "production",
  clientUrl,
  adminUrl,
  mongoUri,
  jwtSecret,
  jwtExpiresIn,
  resendApiKey,
  emailFrom,
  allowedOrigins: [clientUrl, adminUrl],
};

export default config;
