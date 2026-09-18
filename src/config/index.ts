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
const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME || "";
const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY || "";
const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET || "";

// WhatsApp Cloud API Configuration
const whatsappToken = process.env.WHATSAPP_TOKEN || "";
const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
const whatsappVerifyToken =
  process.env.WHATSAPP_VERIFY_TOKEN || "abc_whatsapp_verify_token_secure";

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
  cloudinaryCloudName,
  cloudinaryApiKey,
  cloudinaryApiSecret,
  whatsappToken,
  whatsappPhoneNumberId,
  whatsappVerifyToken,
  allowedOrigins: [clientUrl, adminUrl],
};

export default config;
