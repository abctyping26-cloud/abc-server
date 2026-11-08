import { Schema, model, type Document } from "mongoose";

export interface IClinicHsnCode extends Document {
  hsnCode: string;
  category: string;
  description: string;
  gstRate: number;
  createdAt: Date;
  updatedAt: Date;
}

const clinicHsnCodeSchema = new Schema<IClinicHsnCode>(
  {
    hsnCode: { type: String, required: true, unique: true, trim: true, index: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    gstRate: { type: Number, required: true, default: 12 },
  },
  { timestamps: true, collection: "hsncodes-preth" }
);

export const DEFAULT_HSN_CODES = [
  {
    hsnCode: "30043110",
    category: "Medicaments",
    description: "Insulin injections and related fertility management formulations",
    gstRate: 5,
  },
  {
    hsnCode: "30043200",
    category: "Medicaments",
    description: "Medicaments containing corticosteroid hormones or their derivatives",
    gstRate: 12,
  },
  {
    hsnCode: "30043912",
    category: "Medicaments",
    description: "Gonadotrophins or LH-FSH stimulation injections (Gonal-F Menopur Cetrotide)",
    gstRate: 12,
  },
  {
    hsnCode: "30043919",
    category: "Medicaments",
    description: "Other hormones like Progesterone and Estrogen formulations or IVF triggers",
    gstRate: 12,
  },
  {
    hsnCode: "30049099",
    category: "Medicaments",
    description: "General oral fertility tablets and vitamins (Clomiphene / Clomid / Letrozole)",
    gstRate: 12,
  },
  {
    hsnCode: "30066010",
    category: "Contraceptives",
    description: "Chemical contraceptive preparations based on hormones (for down-regulation cycles)",
    gstRate: 0,
  },
  {
    hsnCode: "38221900",
    category: "Lab Consumables",
    description: "IVF Culture Media and diagnostic reagents used to grow embryos in the lab",
    gstRate: 18,
  },
  {
    hsnCode: "90189029",
    category: "Surgical Equipment",
    description: "Oocyte retrieval needles and embryo transfer catheters",
    gstRate: 12,
  },
  {
    hsnCode: "90189044",
    category: "Surgical Equipment",
    description: "Endosurgery equipment and laparoscopy specialized surgical instruments",
    gstRate: 12,
  },
  {
    hsnCode: "90181200",
    category: "Medical Equipment",
    description: "Ultrasound scanning apparatus used for follicular monitoring",
    gstRate: 12,
  },
];

export const ClinicHsnCode = model<IClinicHsnCode>("ClinicHsnCode", clinicHsnCodeSchema);
export default ClinicHsnCode;
