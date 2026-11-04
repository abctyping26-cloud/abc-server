import type { Response, NextFunction } from "express";
import mongoose, { Types } from "mongoose";
import { PretheekshaUser } from "../models/pretheekshaUser.model.js";
import { PretheekshaCouple } from "../models/pretheekshaCouple.model.js";
import { PretheekshaRegistration } from "../models/pretheekshaRegistration.model.js";
import { generatePatientCode } from "../utils/patientCode.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";

/**
 * Standardize an Indian or international phone number to E.164 format
 */
export const normalizePhone = (phoneInput: string): string => {
  if (!phoneInput) return "";
  const cleaned = phoneInput.trim().replace(/[\s\-()]/g, "");
  if (cleaned.startsWith("+")) {
    return cleaned;
  }
  // Standard 10-digit Indian phone fallback
  if (cleaned.length === 10 && /^\d{10}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return `+${cleaned}`;
  }
  return `+${cleaned}`;
};

/**
 * Normalize search string (lowercase, trimmed)
 */
export const normalizeSearchName = (name: string): string => {
  return (name || "").trim().toLowerCase();
};

/**
 * Register a Single Patient or a Couple atomically
 * POST /api/v1/clinic/patients/register
 */
export const registerPatientOrCouple = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const idempotencyKey = req.header("Idempotency-Key");

    // 1. Check existing idempotent record
    if (idempotencyKey) {
      const existing = await PretheekshaRegistration.findOne({ key: idempotencyKey });
      if (existing) {
        res.status(200).json({
          status: "success",
          message: "Registration retrieved from idempotency cache",
          data: existing.result,
        });
        return;
      }
    }

    const { mode, singlePatient, wifeData, husbandData, confirmNotDuplicate, linkToPatientId } = req.body;

    if (mode === "couple" && (!wifeData || !husbandData)) {
      res.status(400).json({
        status: "fail",
        message: "Both wife and husband data are required for couple registration",
      });
      return;
    }

    if (mode !== "couple" && !singlePatient) {
      res.status(400).json({
        status: "fail",
        message: "Patient data is required for registration",
      });
      return;
    }

    // Optional: Validate existing partner patient if linking to an existing record
    let existingPatientDoc: any = null;
    if (linkToPatientId) {
      if (Types.ObjectId.isValid(linkToPatientId)) {
        existingPatientDoc = await PretheekshaUser.findOne({ _id: linkToPatientId, deletedAt: null });
      } else {
        existingPatientDoc = await PretheekshaUser.findOne({
          code: String(linkToPatientId).trim().toUpperCase(),
          deletedAt: null,
        });
      }

      if (!existingPatientDoc) {
        res.status(404).json({
          status: "fail",
          message: "The patient to link partner with was not found",
        });
        return;
      }

      const alreadyInCouple = await PretheekshaCouple.findOne({
        "members.patient": existingPatientDoc._id,
        status: "active",
      });
      if (alreadyInCouple) {
        res.status(400).json({
          status: "fail",
          message: "This patient is already linked in an active couple record",
        });
        return;
      }
    }

    // 2. Duplicate phone check (warning flow rather than hard block)
    const primaryPhone =
      mode === "couple"
        ? normalizePhone(wifeData.phone || husbandData.phone)
        : normalizePhone(singlePatient.phone);

    if (primaryPhone) {
      const existingMatches = await PretheekshaUser.find({
        "phones.e164": primaryPhone,
        deletedAt: null,
      }).select("code fullName phones dateOfBirth");

      if (existingMatches.length > 0 && !confirmNotDuplicate) {
        res.status(409).json({
          status: "fail",
          code: "POTENTIAL_DUPLICATE_PHONE",
          message: "A patient with this phone number is already registered.",
          matches: existingMatches.map((m) => ({
            code: m.code,
            fullName: m.fullName,
            phone: primaryPhone,
            dateOfBirth: m.dateOfBirth,
          })),
        });
        return;
      }
    }

    const createdBy = req.admin?.id && Types.ObjectId.isValid(req.admin.id)
      ? new Types.ObjectId(req.admin.id)
      : undefined;

    let responseData: any = {};

    // 3. Execution (Single or Couple)
    if (mode === "couple") {
      const wifePhone = normalizePhone(wifeData.phone || husbandData.phone);
      const husbandPhone = normalizePhone(husbandData.phone || wifeData.phone);

      const wifeId = new Types.ObjectId();
      const husbandId = new Types.ObjectId();

      let wifeCode = generatePatientCode();
      let husbandCode = generatePatientCode();
      let coupleCode = generatePatientCode();

      // Ensure codes are distinct
      while (husbandCode === wifeCode) {
        husbandCode = generatePatientCode();
      }

      const wifeDoc = new PretheekshaUser({
        _id: wifeId,
        code: wifeCode,
        fullName: wifeData.fullName.trim(),
        searchName: normalizeSearchName(wifeData.fullName),
        dateOfBirth: new Date(wifeData.dateOfBirth),
        sex: "female",
        bloodGroup: wifeData.bloodGroup || "",
        phones: [{ e164: wifePhone, isPrimary: true, label: "mobile" }],
        email: wifeData.email ? wifeData.email.trim().toLowerCase() : "",
        address: wifeData.address || {
          line1: "",
          city: "",
          state: "",
          pin: "",
        },
        allergies: wifeData.allergies || [],
        medicalHistory: wifeData.medicalHistory || "",
        createdBy,
      });

      const husbandDoc = new PretheekshaUser({
        _id: husbandId,
        code: husbandCode,
        fullName: husbandData.fullName.trim(),
        searchName: normalizeSearchName(husbandData.fullName),
        dateOfBirth: new Date(husbandData.dateOfBirth),
        sex: "male",
        bloodGroup: husbandData.bloodGroup || "",
        phones: [{ e164: husbandPhone, isPrimary: true, label: "mobile" }],
        email: husbandData.email ? husbandData.email.trim().toLowerCase() : "",
        address: husbandData.address || wifeData.address || {
          line1: "",
          city: "",
          state: "",
          pin: "",
        },
        allergies: husbandData.allergies || [],
        medicalHistory: husbandData.medicalHistory || "",
        createdBy,
      });

      const coupleDoc = new PretheekshaCouple({
        code: coupleCode,
        members: [
          { patient: wifeId, role: "intended_mother", since: new Date() },
          { patient: husbandId, role: "intended_father", since: new Date() },
        ],
        status: "active",
        createdBy,
      });

      // Try running in session transaction; fallback to sequential if standalone mongo
      let session: mongoose.ClientSession | null = null;
      try {
        session = await mongoose.startSession();
        await session.withTransaction(async () => {
          await wifeDoc.save({ session });
          await husbandDoc.save({ session });
          await coupleDoc.save({ session });
        });
      } catch (txnError) {
        // Fallback for standalone mongo instances without replica set
        await wifeDoc.save();
        await husbandDoc.save();
        await coupleDoc.save();
      } finally {
        if (session) {
          await session.endSession();
        }
      }

      responseData = {
        mode: "couple",
        coupleCode,
        wife: {
          id: wifeDoc._id,
          code: wifeDoc.code,
          fullName: wifeDoc.fullName,
          phone: wifePhone,
          dateOfBirth: wifeDoc.dateOfBirth,
        },
        husband: {
          id: husbandDoc._id,
          code: husbandDoc.code,
          fullName: husbandDoc.fullName,
          phone: husbandPhone,
          dateOfBirth: husbandDoc.dateOfBirth,
        },
      };
    } else {
      // Single Patient Registration
      const patientPhone = normalizePhone(singlePatient.phone);
      const patientCode = generatePatientCode();

      const patientDoc = new PretheekshaUser({
        code: patientCode,
        fullName: singlePatient.fullName.trim(),
        searchName: normalizeSearchName(singlePatient.fullName),
        dateOfBirth: new Date(singlePatient.dateOfBirth),
        sex: singlePatient.sex || "female",
        bloodGroup: singlePatient.bloodGroup || "",
        phones: [{ e164: patientPhone, isPrimary: true, label: "mobile" }],
        email: singlePatient.email ? singlePatient.email.trim().toLowerCase() : "",
        address: singlePatient.address || {
          line1: "",
          city: "",
          state: "",
          pin: "",
        },
        allergies: singlePatient.allergies || [],
        medicalHistory: singlePatient.medicalHistory || "",
        createdBy,
      });

      await patientDoc.save();

      let coupleInfo: any = null;
      if (existingPatientDoc) {
        const coupleCode = generatePatientCode();

        const roleExisting =
          existingPatientDoc.sex === "female"
            ? "intended_mother"
            : existingPatientDoc.sex === "male"
            ? "intended_father"
            : "partner";

        const roleNew =
          patientDoc.sex === "female"
            ? "intended_mother"
            : patientDoc.sex === "male"
            ? "intended_father"
            : "partner";

        const coupleDoc = new PretheekshaCouple({
          code: coupleCode,
          members: [
            { patient: existingPatientDoc._id, role: roleExisting, since: new Date() },
            { patient: patientDoc._id, role: roleNew, since: new Date() },
          ],
          status: "active",
          createdBy,
        });

        await coupleDoc.save();

        coupleInfo = {
          code: coupleCode,
          partnerId: existingPatientDoc._id,
          partnerCode: existingPatientDoc.code,
        };
      }

      responseData = {
        mode: "single",
        patient: {
          id: patientDoc._id,
          code: patientDoc.code,
          fullName: patientDoc.fullName,
          phone: patientPhone,
          sex: patientDoc.sex,
          dateOfBirth: patientDoc.dateOfBirth,
        },
        couple: coupleInfo,
      };
    }

    // 4. Save to idempotency store if key was provided
    if (idempotencyKey) {
      try {
        await PretheekshaRegistration.create({
          key: idempotencyKey,
          result: responseData,
        });
      } catch {
        // Ignore duplicate idempotency save error
      }
    }

    res.status(201).json({
      status: "success",
      message:
        mode === "couple"
          ? "Couple registered successfully"
          : "Patient registered successfully",
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List patients with fast prefix search, phone lookup, and spouse details
 * GET /api/v1/clinic/patients
 */
export const getPatients = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { deletedAt: null };

    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const digits = q.replace(/\D/g, "");

      const orConditions: any[] = [
        { code: new RegExp("^" + escaped, "i") },
        { searchName: new RegExp("^" + escaped.toLowerCase(), "i") },
      ];

      if (digits.length >= 4) {
        orConditions.push({ "phones.e164": new RegExp(digits) });
      }

      filter.$or = orConditions;
    }

    const [total, patients] = await Promise.all([
      PretheekshaUser.countDocuments(filter),
      PretheekshaUser.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    // Attach active couple & spouse info for each patient
    const patientIds = patients.map((p) => p._id);
    const couples = await PretheekshaCouple.find({
      "members.patient": { $in: patientIds },
      status: "active",
    })
      .populate("members.patient", "code fullName sex phones")
      .lean();

    const patientListWithSpouse = patients.map((patient: any) => {
      const activeCouple = couples.find((c) =>
        c.members.some(
          (m: any) => m.patient?._id?.toString() === patient._id.toString()
        )
      );

      let spouseInfo = null;
      if (activeCouple) {
        const spouseMember = activeCouple.members.find(
          (m: any) => m.patient?._id?.toString() !== patient._id.toString()
        );
        if (spouseMember && spouseMember.patient) {
          const sp: any = spouseMember.patient;
          spouseInfo = {
            id: sp._id,
            code: sp.code,
            fullName: sp.fullName,
            role: spouseMember.role,
            phone: sp.phones?.[0]?.e164 || "",
          };
        }
      }

      return {
        ...patient,
        coupleCode: activeCouple?.code || null,
        spouse: spouseInfo,
      };
    });

    res.status(200).json({
      status: "success",
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: patientListWithSpouse,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get detailed patient profile by ID or Crockford Code
 * GET /api/v1/clinic/patients/:id
 */
export const getPatientById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : (rawId || "");
    let patient;

    if (Types.ObjectId.isValid(id)) {
      patient = await PretheekshaUser.findOne({ _id: id, deletedAt: null }).lean();
    } else {
      patient = await PretheekshaUser.findOne({ code: id.trim().toUpperCase(), deletedAt: null }).lean();
    }

    if (!patient) {
      res.status(404).json({
        status: "fail",
        message: "Patient not found",
      });
      return;
    }

    // Look up active couple
    const activeCouple = await PretheekshaCouple.findOne({
      "members.patient": patient._id,
      status: "active",
    })
      .populate("members.patient", "code fullName sex phones dateOfBirth bloodGroup")
      .lean();

    let spouseInfo = null;
    if (activeCouple) {
      const spouseMember = activeCouple.members.find(
        (m: any) => m.patient?._id?.toString() !== patient._id.toString()
      );
      if (spouseMember && spouseMember.patient) {
        const sp: any = spouseMember.patient;
        spouseInfo = {
          id: sp._id,
          code: sp.code,
          fullName: sp.fullName,
          role: spouseMember.role,
          phone: sp.phones?.[0]?.e164 || "",
          dateOfBirth: sp.dateOfBirth,
          bloodGroup: sp.bloodGroup,
        };
      }
    }

    res.status(200).json({
      status: "success",
      data: {
        ...patient,
        coupleCode: activeCouple?.code || null,
        spouse: spouseInfo,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update patient clinical info (blood group, protocol, allergies, medical history)
 * PATCH /api/v1/clinic/patients/:id
 */
export const updatePatientClinicalInfo = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : (rawId || "");
    const { bloodGroup, protocol, allergies, medicalHistory } = req.body;

    const filter: any = Types.ObjectId.isValid(id)
      ? { _id: id, deletedAt: null }
      : { code: id.trim().toUpperCase(), deletedAt: null };

    const updateFields: any = {};
    if (bloodGroup !== undefined) updateFields.bloodGroup = String(bloodGroup).trim();
    if (protocol !== undefined) updateFields.protocol = String(protocol).trim();
    if (allergies !== undefined) {
      updateFields.allergies = Array.isArray(allergies)
        ? allergies.map((s: any) => String(s).trim()).filter(Boolean)
        : String(allergies)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
    }
    if (medicalHistory !== undefined) updateFields.medicalHistory = String(medicalHistory).trim();

    const updated = await PretheekshaUser.findOneAndUpdate(
      filter,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      res.status(404).json({
        status: "fail",
        message: "Patient not found",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      data: updated,
      message: "Patient clinical info updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Link two existing patients together into an active PretheekshaCouple
 * POST /api/v1/clinic/patients/link-partner
 */
export const linkPatientsAsCouple = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { patientId1, patientId2 } = req.body;

    if (!patientId1 || !patientId2) {
      res.status(400).json({
        status: "fail",
        message: "Both patient records are required to link partners",
      });
      return;
    }

    if (patientId1 === patientId2) {
      res.status(400).json({
        status: "fail",
        message: "Cannot link a patient with themselves",
      });
      return;
    }

    const p1 = Types.ObjectId.isValid(patientId1)
      ? await PretheekshaUser.findOne({ _id: patientId1, deletedAt: null })
      : await PretheekshaUser.findOne({ code: String(patientId1).trim().toUpperCase(), deletedAt: null });

    const p2 = Types.ObjectId.isValid(patientId2)
      ? await PretheekshaUser.findOne({ _id: patientId2, deletedAt: null })
      : await PretheekshaUser.findOne({ code: String(patientId2).trim().toUpperCase(), deletedAt: null });

    if (!p1 || !p2) {
      res.status(404).json({
        status: "fail",
        message: "One or both patient records could not be found",
      });
      return;
    }

    // Verify neither already has an active couple
    const activeCouple = await PretheekshaCouple.findOne({
      "members.patient": { $in: [p1._id, p2._id] },
      status: "active",
    });

    if (activeCouple) {
      res.status(400).json({
        status: "fail",
        message: "One of the patients is already linked in an active couple record",
      });
      return;
    }

    const coupleCode = generatePatientCode();

    const role1 =
      p1.sex === "female"
        ? "intended_mother"
        : p1.sex === "male"
        ? "intended_father"
        : "partner";

    const role2 =
      p2.sex === "female"
        ? "intended_mother"
        : p2.sex === "male"
        ? "intended_father"
        : "partner";

    const createdBy =
      req.admin?.id && Types.ObjectId.isValid(req.admin.id)
        ? new Types.ObjectId(req.admin.id)
        : undefined;

    const coupleDoc = new PretheekshaCouple({
      code: coupleCode,
      members: [
        { patient: p1._id, role: role1, since: new Date() },
        { patient: p2._id, role: role2, since: new Date() },
      ],
      status: "active",
      createdBy,
    });

    await coupleDoc.save();

    res.status(200).json({
      status: "success",
      message: "Partners linked successfully as a couple",
      data: {
        coupleCode,
        members: [
          { id: p1._id, code: p1.code, fullName: p1.fullName, role: role1 },
          { id: p2._id, code: p2.code, fullName: p2.fullName, role: role2 },
        ],
      },
    });
  } catch (error) {
    next(error);
  }
};
