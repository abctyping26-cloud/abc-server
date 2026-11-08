import { HeroTimelineItem } from "../models/heroContent.model.js";

export const DEFAULT_HERO_CONFIG = {
  title: "Standard Hero",
  hook: "From Kerala to the Gulf —\nEvery Document, Every Step.",
  bgImageUrl: "/hero.jpg",
  isActive: true,
  isDefault: true,
  startDate: null,
  endDate: null,
};

/**
 * Ensures that the default standard hero item exists in MongoDB 'hero-timelines' collection.
 */
export const ensureHeroContentSeeded = async (): Promise<void> => {
  try {
    const existingDefault = await HeroTimelineItem.findOne({ isDefault: true });
    if (!existingDefault) {
      // Check if any active exists
      const anyActive = await HeroTimelineItem.findOne({ isActive: true });
      await HeroTimelineItem.create({
        ...DEFAULT_HERO_CONFIG,
        isActive: !anyActive,
      });
      console.log("✅ Seeded default Hero item in 'hero-timelines' collection.");
    }
  } catch (error) {
    console.error("⚠️ Failed to ensure hero content seeded:", error);
  }
};
