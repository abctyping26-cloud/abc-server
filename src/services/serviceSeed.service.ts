import { Service } from "../models/service.model.js";
import { CATEGORIES, getServiceDetail, slugify } from "../data/defaultServices.js";

/**
 * Ensures that all 69 default services are seeded into the MongoDB 'services' collection.
 * Existing records are preserved. Any missing services are automatically inserted.
 */
export const ensureServicesSeeded = async (): Promise<void> => {
  try {
    const totalExisting = await Service.countDocuments();
    if (totalExisting >= 69) {
      return;
    }

    let order = 0;
    let createdCount = 0;

    for (const category of CATEGORIES) {
      for (const item of category.services) {
        order++;
        const slug = slugify(item.name);
        const existing = await Service.findOne({ slug });

        if (!existing) {
          const detail = getServiceDetail(slug);
          await Service.create({
            slug,
            serviceId: item.id,
            name: item.name,
            category: {
              id: category.id,
              name: category.name,
              shortName: category.shortName,
            },
            tagline: detail.tagline,
            requiredDocuments: detail.requiredDocuments.map((doc) => ({
              title: doc.title,
              description: doc.description || "",
              mandatory: Boolean(doc.mandatory),
            })),
            faqs: (detail.faqs || []).map((faq) => ({
              question: faq.question,
              answer: faq.answer,
            })),
            isCustomized: false,
            order,
          });
          createdCount++;
        }
      }
    }

    if (createdCount > 0) {
      console.log(`✅ Seeded ${createdCount} services into MongoDB 'services' collection.`);
    }
  } catch (error) {
    console.error("⚠️ Failed to ensure services seeded:", error);
  }
};
