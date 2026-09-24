import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { Service } from "../models/service.model.js";
import { ensureServicesSeeded } from "../services/serviceSeed.service.js";

async function verify() {
  console.log("🔍 Testing MongoDB connection and Services seeding...");
  await connectDatabase();

  await ensureServicesSeeded();

  const count = await Service.countDocuments();
  console.log(`📊 Total services in MongoDB 'services' collection: ${count}`);

  const familyVisa = await Service.findOne({ slug: "uae-family-visa" });
  if (familyVisa) {
    console.log(`✅ Found 'uae-family-visa':`);
    console.log(`   Name: ${familyVisa.name}`);
    console.log(`   Category: ${familyVisa.category?.name}`);
    console.log(`   Documents count: ${familyVisa.requiredDocuments.length}`);
    familyVisa.requiredDocuments.forEach((doc, idx) => {
      console.log(`     ${idx + 1}. [${doc.mandatory ? "MANDATORY" : "OPTIONAL"}] ${doc.title}`);
    });
  } else {
    console.error("❌ 'uae-family-visa' not found in database!");
  }

  await disconnectDatabase();
}

verify().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
