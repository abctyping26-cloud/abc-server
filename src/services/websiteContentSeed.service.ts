import { TopMarqueeConfig } from "../models/websiteContent.model.js";

export const DEFAULT_MARQUEE_ITEMS = [
  {
    badgeText: "NEW",
    message:
      "UAE Pass Biometric & Kiosk Support in Musaffah — Lost SIM Recovery, Facial Recognition & TAMM Digital Signatures",
    ctaText: "Explore",
    linkUrl: "/services/uae-pass-assistance",
  },
  {
    badgeText: "NEW",
    message:
      "Instant Kiosk Fingerprint Verification, ICP Mobile Number Update & Corporate Profile Linking",
    ctaText: "Explore",
    linkUrl: "/services/uae-pass-assistance",
  },
];

export const DEFAULT_MARQUEE_CONFIG = {
  key: "top_marquee",
  isActive: true,
  speedSeconds: 32,
  items: DEFAULT_MARQUEE_ITEMS,
};

/**
 * Ensures that the default top marquee announcement config exists in MongoDB 'website-contents' collection.
 */
export const ensureWebsiteContentSeeded = async (): Promise<void> => {
  try {
    const existing = await TopMarqueeConfig.findOne({ key: "top_marquee" });
    if (!existing) {
      await TopMarqueeConfig.create(DEFAULT_MARQUEE_CONFIG);
      console.log("✅ Seeded default Top Marquee config in 'website-contents' collection.");
    }
  } catch (error) {
    console.error("⚠️ Failed to ensure website content seeded:", error);
  }
};
