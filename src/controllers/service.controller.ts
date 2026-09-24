import type { Request, Response } from "express";
import { Service } from "../models/service.model.js";
import { ensureServicesSeeded } from "../services/serviceSeed.service.js";
import { getServiceDetail } from "../data/defaultServices.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";

/**
 * GET /api/v1/admin/services or GET /api/v1/client/services
 * Retrieves all services from MongoDB with optional search, category, and status filtering.
 */
export const getServices = async (req: Request, res: Response): Promise<void> => {
  try {
    // Ensure database is populated with all 69 services
    await ensureServicesSeeded();

    const { search, category, status } = req.query;

    const filter: Record<string, unknown> = {};

    if (category && typeof category === "string" && category !== "all") {
      filter["category.id"] = category;
    }

    if (status === "customized") {
      filter["isCustomized"] = true;
    } else if (status === "default") {
      filter["isCustomized"] = false;
    }

    if (search && typeof search === "string" && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [
        { name: regex },
        { slug: regex },
        { "category.name": regex },
        { "category.shortName": regex },
        { tagline: regex },
        { "requiredDocuments.title": regex },
      ];
    }

    const services = await Service.find(filter)
      .sort({ order: 1, name: 1 })
      .populate("updatedBy", "name identifier role");

    res.status(200).json({
      success: true,
      count: services.length,
      data: { services },
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch services from database",
    });
  }
};

/**
 * GET /api/v1/admin/services/:slug or GET /api/v1/client/services/:slug
 * Retrieves a single service by slug.
 */
export const getServiceBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawSlug = req.params.slug;
    const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
    if (!slug || typeof slug !== "string") {
      res.status(400).json({ success: false, message: "Service slug is required" });
      return;
    }

    const cleanSlug = slug.toLowerCase().trim();
    let service = await Service.findOne({ slug: cleanSlug }).populate(
      "updatedBy",
      "name identifier role"
    );

    if (!service) {
      // If service is in default catalog, seed it on-demand
      const detail = getServiceDetail(cleanSlug);
      if (detail && detail.id) {
        await ensureServicesSeeded();
        service = await Service.findOne({ slug: cleanSlug }).populate(
          "updatedBy",
          "name identifier role"
        );
      }
    }

    if (!service) {
      res.status(404).json({
        success: false,
        message: `Service with slug '${cleanSlug}' not found`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { service },
    });
  } catch (error) {
    console.error("Error fetching service by slug:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch service details",
    });
  }
};

/**
 * PUT /api/v1/admin/services/:slug
 * Updates a service's required documents, tagline, and FAQs in MongoDB.
 */
export const updateService = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const rawSlug = req.params.slug;
    const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
    const cleanSlug = typeof slug === "string" ? slug.toLowerCase().trim() : "";

    let service = await Service.findOne({ slug: cleanSlug });
    if (!service) {
      await ensureServicesSeeded();
      service = await Service.findOne({ slug: cleanSlug });
    }

    if (!service) {
      res.status(404).json({
        success: false,
        message: `Service with slug '${cleanSlug}' not found`,
      });
      return;
    }

    const { tagline, requiredDocuments, faqs } = req.body;

    if (tagline !== undefined && typeof tagline === "string") {
      service.tagline = tagline.trim();
    }

    if (requiredDocuments !== undefined) {
      if (!Array.isArray(requiredDocuments)) {
        res.status(400).json({
          success: false,
          message: "requiredDocuments must be an array of documents",
        });
        return;
      }

      // Validate documents
      const validatedDocs = [];
      for (let i = 0; i < requiredDocuments.length; i++) {
        const item = requiredDocuments[i];
        if (!item.title || typeof item.title !== "string" || !item.title.trim()) {
          res.status(400).json({
            success: false,
            message: `Document at position ${i + 1} must have a non-empty title`,
          });
          return;
        }

        validatedDocs.push({
          title: item.title.trim(),
          description: typeof item.description === "string" ? item.description.trim() : "",
          mandatory: Boolean(item.mandatory),
        });
      }

      service.requiredDocuments = validatedDocs as unknown as typeof service.requiredDocuments;
    }

    if (faqs !== undefined && Array.isArray(faqs)) {
      service.faqs = faqs
        .filter((f) => f && f.question && f.question.trim())
        .map((f) => ({
          question: f.question.trim(),
          answer: typeof f.answer === "string" ? f.answer.trim() : "",
        })) as unknown as typeof service.faqs;
    }

    service.isCustomized = true;
    if (req.admin?.id) {
      service.updatedBy = req.admin.id as unknown as typeof service.updatedBy;
    }

    await service.save();

    const populated = await Service.findById(service._id).populate(
      "updatedBy",
      "name identifier role"
    );

    res.status(200).json({
      success: true,
      message: "Service documentation updated successfully",
      data: { service: populated },
    });
  } catch (error) {
    console.error("Error updating service:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update service documentation in database",
    });
  }
};

/**
 * POST /api/v1/admin/services/:slug/reset
 * Resets a customized service back to default catalog settings in MongoDB.
 */
export const resetService = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const rawSlug = req.params.slug;
    const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
    const cleanSlug = typeof slug === "string" ? slug.toLowerCase().trim() : "";

    const service = await Service.findOne({ slug: cleanSlug });
    if (!service) {
      res.status(404).json({
        success: false,
        message: `Service with slug '${cleanSlug}' not found`,
      });
      return;
    }

    const defaultDetail = getServiceDetail(cleanSlug);

    service.tagline = defaultDetail.tagline;
    service.requiredDocuments = defaultDetail.requiredDocuments.map((doc) => ({
      title: doc.title,
      description: doc.description || "",
      mandatory: Boolean(doc.mandatory),
    })) as unknown as typeof service.requiredDocuments;

    service.faqs = (defaultDetail.faqs || []).map((faq) => ({
      question: faq.question,
      answer: faq.answer,
    })) as unknown as typeof service.faqs;

    service.isCustomized = false;
    if (req.admin?.id) {
      service.updatedBy = req.admin.id as unknown as typeof service.updatedBy;
    }

    await service.save();

    const populated = await Service.findById(service._id).populate(
      "updatedBy",
      "name identifier role"
    );

    res.status(200).json({
      success: true,
      message: "Service documentation reset to default catalog settings",
      data: { service: populated },
    });
  } catch (error) {
    console.error("Error resetting service:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset service documentation",
    });
  }
};

/**
 * POST /api/v1/admin/services
 * Creates a new service in MongoDB database.
 */
export const createService = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, category, tagline, slug: customSlug, requiredDocuments } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({
        success: false,
        message: "Service name is required",
      });
      return;
    }

    const trimmedName = name.trim();
    const generatedSlug = (customSlug && typeof customSlug === "string" && customSlug.trim())
      ? customSlug.toLowerCase().trim().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-")
      : trimmedName.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");

    // Check if slug already exists
    const existing = await Service.findOne({ slug: generatedSlug });
    if (existing) {
      res.status(400).json({
        success: false,
        message: `A service with slug '${generatedSlug}' already exists. Please choose a different name.`,
      });
      return;
    }

    // Determine category object
    let categoryObj = {
      id: "general",
      name: "General Services",
      shortName: "General",
    };

    if (category && typeof category === "object" && category.id) {
      categoryObj = {
        id: category.id || "general",
        name: category.name || "General Services",
        shortName: category.shortName || category.name || "General",
      };
    } else if (typeof category === "string" && category.trim()) {
      categoryObj = {
        id: category.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        name: category.trim(),
        shortName: category.trim(),
      };
    }

    const highestOrderService = await Service.findOne().sort({ order: -1 });
    const nextOrder = (highestOrderService?.order || 0) + 1;
    const generatedServiceId = `SVC-${Date.now().toString().slice(-6)}`;

    const newService = await Service.create({
      slug: generatedSlug,
      serviceId: generatedServiceId,
      name: trimmedName,
      category: categoryObj,
      tagline: tagline && typeof tagline === "string" ? tagline.trim() : "",
      requiredDocuments: Array.isArray(requiredDocuments) ? requiredDocuments : [],
      faqs: [],
      isCustomized: true,
      order: nextOrder,
      updatedBy: req.admin?.id ? req.admin.id : undefined,
    });

    res.status(201).json({
      success: true,
      message: "Service created successfully in database",
      data: {
        service: newService,
      },
    });
  } catch (error) {
    console.error("Error creating service:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create service in database",
    });
  }
};
