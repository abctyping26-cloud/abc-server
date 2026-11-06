import { Schema, model, type Document } from "mongoose";

export interface IClinicInventoryItem extends Document {
  itemName: string;
  searchName: string;
  genericName?: string;
  category: string;
  hsnCode: string;
  gstRate: number;
  costPrice: number; // 1. Getting Amount (Purchase/Procurement cost)
  mrp: number; // 2. Selling Amount (MRP / Base selling rate)
  defaultBilledPrice: number; // 3. Invoice Entering Amount (Billed rate)
  packSize?: string;
  manufacturer?: string;
  usageCount: number;
  lastUsedAt: Date;
  source: "seed" | "promoted_from_master" | "manual";
  createdAt: Date;
  updatedAt: Date;
}

const clinicInventoryItemSchema = new Schema<IClinicInventoryItem>(
  {
    itemName: { type: String, required: true, trim: true, index: true },
    searchName: { type: String, required: true, lowercase: true, trim: true, index: true },
    genericName: { type: String, trim: true, default: "" },
    category: { type: String, required: true, default: "Medicaments" },
    hsnCode: { type: String, required: true, trim: true, index: true },
    gstRate: { type: Number, required: true, default: 12 },
    costPrice: { type: Number, required: true, default: 0 },
    mrp: { type: Number, required: true, default: 0 },
    defaultBilledPrice: { type: Number, required: true, default: 0 },
    packSize: { type: String, default: "" },
    manufacturer: { type: String, default: "" },
    usageCount: { type: Number, default: 0, index: true },
    lastUsedAt: { type: Date, default: Date.now },
    source: {
      type: String,
      enum: ["seed", "promoted_from_master", "manual"],
      default: "manual",
    },
  },
  { timestamps: true }
);

clinicInventoryItemSchema.index({ searchName: "text", genericName: "text", hsnCode: "text" });

export const DEFAULT_CLINIC_ITEMS = [
  {
    itemName: "Gonal-F 450 IU / 0.75 ml Pen",
    searchName: "gonal-f 450 iu / 0.75 ml pen",
    genericName: "Follitropin alfa (r-hFSH)",
    category: "Medicaments",
    hsnCode: "30043912",
    gstRate: 12,
    costPrice: 8500,
    mrp: 10200,
    defaultBilledPrice: 9500,
    packSize: "1 Pre-filled Pen",
    manufacturer: "Merck Specialities Pvt Ltd",
    source: "seed",
  },
  {
    itemName: "Menopur 75 IU Injection",
    searchName: "menopur 75 iu injection",
    genericName: "Menotrophin (Highly purified HMG)",
    category: "Medicaments",
    hsnCode: "30043912",
    gstRate: 12,
    costPrice: 1200,
    mrp: 1550,
    defaultBilledPrice: 1400,
    packSize: "1 Vial + Solvent",
    manufacturer: "Ferring Pharmaceuticals",
    source: "seed",
  },
  {
    itemName: "Cetrotide 0.25 mg Injection",
    searchName: "cetrotide 0.25 mg injection",
    genericName: "Cetrorelix acetate",
    category: "Medicaments",
    hsnCode: "30043912",
    gstRate: 12,
    costPrice: 2100,
    mrp: 2600,
    defaultBilledPrice: 2400,
    packSize: "1 Vial + Syringe",
    manufacturer: "Merck Serono",
    source: "seed",
  },
  {
    itemName: "Susten 200 mg Capsule",
    searchName: "susten 200 mg capsule",
    genericName: "Natural Micronised Progesterone",
    category: "Medicaments",
    hsnCode: "30043919",
    gstRate: 12,
    costPrice: 420,
    mrp: 580,
    defaultBilledPrice: 520,
    packSize: "Strip of 10 capsules",
    manufacturer: "Sun Pharmaceutical Industries",
    source: "seed",
  },
  {
    itemName: "Ovitrelle 250 mcg / 0.5 ml Pre-filled Syringe",
    searchName: "ovitrelle 250 mcg / 0.5 ml pre-filled syringe",
    genericName: "Choriogonadotropin alfa (r-hCG trigger)",
    category: "Medicaments",
    hsnCode: "30043919",
    gstRate: 12,
    costPrice: 1800,
    mrp: 2300,
    defaultBilledPrice: 2100,
    packSize: "1 Pre-filled Syringe",
    manufacturer: "Merck",
    source: "seed",
  },
  {
    itemName: "Letroz 2.5 mg Tablet",
    searchName: "letroz 2.5 mg tablet",
    genericName: "Letrozole",
    category: "Medicaments",
    hsnCode: "30049099",
    gstRate: 12,
    costPrice: 140,
    mrp: 195,
    defaultBilledPrice: 180,
    packSize: "Strip of 5 tablets",
    manufacturer: "Sun Pharmaceutical Industries",
    source: "seed",
  },
  {
    itemName: "Fertomid 50 mg Tablet",
    searchName: "fertomid 50 mg tablet",
    genericName: "Clomiphene Citrate",
    category: "Medicaments",
    hsnCode: "30049099",
    gstRate: 12,
    costPrice: 85,
    mrp: 120,
    defaultBilledPrice: 110,
    packSize: "Strip of 10 tablets",
    manufacturer: "Cipla Ltd",
    source: "seed",
  },
  {
    itemName: "Ovral L Tablet",
    searchName: "ovral l tablet",
    genericName: "Levonorgestrel & Ethinylestradiol",
    category: "Contraceptives",
    hsnCode: "30066010",
    gstRate: 0,
    costPrice: 65,
    mrp: 92,
    defaultBilledPrice: 90,
    packSize: "Strip of 21 tablets",
    manufacturer: "Pfizer Ltd",
    source: "seed",
  },
  {
    itemName: "IVF Embryo Culture Media (Single Step) 50ml",
    searchName: "ivf embryo culture media (single step) 50ml",
    genericName: "Sequential IVF Culture Media",
    category: "Lab Consumables",
    hsnCode: "38221900",
    gstRate: 18,
    costPrice: 12000,
    mrp: 16000,
    defaultBilledPrice: 15000,
    packSize: "50 ml bottle",
    manufacturer: "Vitrolife / Cook Medical",
    source: "seed",
  },
  {
    itemName: "Oocyte Retrieval Needle 17G Single Lumen",
    searchName: "oocyte retrieval needle 17g single lumen",
    genericName: "Aspiration Needle with tubing",
    category: "Surgical Equipment",
    hsnCode: "90189029",
    gstRate: 12,
    costPrice: 1400,
    mrp: 2100,
    defaultBilledPrice: 1800,
    packSize: "Box of 1 piece sterile",
    manufacturer: "Cook Medical / Wallace",
    source: "seed",
  },
  {
    itemName: "Embryo Transfer Catheter (Soft Ultrasound Visible)",
    searchName: "embryo transfer catheter (soft ultrasound visible)",
    genericName: "Coaxial Embryo Transfer System",
    category: "Surgical Equipment",
    hsnCode: "90189029",
    gstRate: 12,
    costPrice: 2800,
    mrp: 3800,
    defaultBilledPrice: 3500,
    packSize: "1 Set sterile",
    manufacturer: "Wallace / Cook",
    source: "seed",
  },
  {
    itemName: "Follicular Monitoring Ultrasound Scan",
    searchName: "follicular monitoring ultrasound scan",
    genericName: "Transvaginal Ultrasound (TVS)",
    category: "Medical Equipment",
    hsnCode: "90181200",
    gstRate: 12,
    costPrice: 400,
    mrp: 1500,
    defaultBilledPrice: 1200,
    packSize: "Per procedure",
    manufacturer: "Pretheeksha Clinic Imaging",
    source: "seed",
  },
];

export const ClinicInventoryItem = model<IClinicInventoryItem>(
  "ClinicInventoryItem",
  clinicInventoryItemSchema
);
export default ClinicInventoryItem;
