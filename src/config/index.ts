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
const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "1346616208536806";
const whatsappBusinessAccountId =
  process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "1818235275834743";
const whatsappVerifyToken =
  process.env.WHATSAPP_VERIFY_TOKEN || "abc_whatsapp_verify_token_secure";

// Google Analytics 4 Configuration
const gaPropertyId = process.env.GA_PROPERTY_ID || "557168604";
const gaKeyFile = process.env.GA_KEY_FILE || "abc-analytics-510416-c1909bf0e532.json";
const gaCredentialsJson = process.env.GA_CREDENTIALS_JSON || "";

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
  whatsappBusinessAccountId,
  whatsappVerifyToken,
  gaPropertyId,
  gaKeyFile,
  gaCredentialsJson,
  allowedOrigins: [clientUrl, adminUrl],
};

export default config;
