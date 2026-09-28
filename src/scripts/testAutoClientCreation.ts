import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { CommercialUser } from "../models/commercialUser.model.js";
import { handleWhatsAppAutomation } from "../services/whatsappAutomation.service.js";

const runTest = async () => {
  console.log("🧪 Testing Automatic Client Creation & Document Storage via WhatsApp...\n");

  await connectDatabase();
  console.log("✅ 1. Connected to MongoDB");

  const testPhone = "971509998877";
  const testName = "Rashid Al Nuaimi";

  // Clean up any existing test user
  await CommercialUser.deleteMany({
    $or: [{ identifier: testPhone }, { phone: testPhone }, { phone: `+${testPhone}` }],
  });

  console.log("\n--- Step 1: Simulate brand new user sending a text message ---");
  await handleWhatsAppAutomation({
    senderPhone: testPhone,
    senderName: testName,
    msgType: "text",
    text: "Hello, I need help with my visa typing.",
  });

  const createdClient = await CommercialUser.findOne({
    $or: [{ identifier: testPhone }, { phone: `+${testPhone}` }],
  });

  if (!createdClient) {
    throw new Error("❌ Failed: CommercialUser was not automatically created in MongoDB!");
  }
  console.log("✅ Client created automatically!");
  console.log("   • ID:", createdClient._id.toString());
  console.log("   • Name:", createdClient.name);
  console.log("   • Phone:", createdClient.phone);
  console.log("   • PIN:", createdClient.pin);
  console.log("   • Files count:", createdClient.files.length);

  if (createdClient.name !== testName) {
    throw new Error(`❌ Failed: Expected name "${testName}", got "${createdClient.name}"`);
  }
  if (!createdClient.pin || createdClient.pin.length !== 4) {
    throw new Error(`❌ Failed: Expected 4-digit PIN, got "${createdClient.pin}"`);
  }

  console.log("\n--- Step 2: Simulate user sending an Emirates ID / Passport document ---");
  const sampleMediaUrl = "https://res.cloudinary.com/demo/image/upload/v1/sample_emirates_id.jpg";
  await handleWhatsAppAutomation({
    senderPhone: testPhone,
    senderName: testName,
    msgType: "image",
    text: "Here is my Emirates ID",
    media: {
      mediaUrl: sampleMediaUrl,
      mediaMimeType: "image/jpeg",
      mediaFileName: "emirates_id_front.jpg",
      mediaFileSize: 204800,
    },
  });

  const refreshedClient = await CommercialUser.findById(createdClient._id);
  if (!refreshedClient) {
    throw new Error("❌ Failed: Could not re-fetch client");
  }

  if (refreshedClient.files.length !== 1) {
    throw new Error(`❌ Failed: Expected 1 file attached, found ${refreshedClient.files.length}`);
  }

  const attachedFile = refreshedClient.files[0];
  console.log("✅ Document successfully saved to client ID!");
  console.log("   • File Name:", attachedFile.fileName);
  console.log("   • URL:", attachedFile.url);
  console.log("   • File Type:", attachedFile.fileType);
  console.log("   • File Size:", attachedFile.fileSize, "bytes");

  console.log("\n--- Step 3: Simulate sending a second document (PDF) ---");
  const samplePdfUrl = "https://res.cloudinary.com/demo/raw/upload/v1/passport_copy.pdf";
  await handleWhatsAppAutomation({
    senderPhone: testPhone,
    senderName: testName,
    msgType: "document",
    text: "And my passport copy",
    media: {
      mediaUrl: samplePdfUrl,
      mediaMimeType: "application/pdf",
      mediaFileName: "passport_copy.pdf",
      mediaFileSize: 512000,
    },
  });

  const clientWithTwoFiles = await CommercialUser.findById(createdClient._id);
  if (clientWithTwoFiles?.files.length !== 2) {
    throw new Error(`❌ Failed: Expected 2 files attached, found ${clientWithTwoFiles?.files.length}`);
  }
  console.log("✅ Second document appended successfully! Total files:", clientWithTwoFiles.files.length);

  console.log("\n--- Step 4: Verify duplicate prevention ---");
  await handleWhatsAppAutomation({
    senderPhone: testPhone,
    senderName: testName,
    msgType: "document",
    text: "Resending passport copy",
    media: {
      mediaUrl: samplePdfUrl,
      mediaMimeType: "application/pdf",
      mediaFileName: "passport_copy.pdf",
      mediaFileSize: 512000,
    },
  });

  const clientAfterDuplicate = await CommercialUser.findById(createdClient._id);
  if (clientAfterDuplicate?.files.length !== 2) {
    throw new Error(`❌ Failed: Duplicate file was added. Count: ${clientAfterDuplicate?.files.length}`);
  }
  console.log("✅ Duplicate prevention verified (files count remained 2).");

  // Clean up test data
  await CommercialUser.deleteMany({
    $or: [{ identifier: testPhone }, { phone: testPhone }, { phone: `+${testPhone}` }],
  });
  console.log("\n🧹 Cleaned up test data.");

  await disconnectDatabase();
  console.log("🎉 All tests passed successfully!\n");
};

runTest().catch(async (err) => {
  console.error("❌ Test Error:", err);
  await disconnectDatabase();
  process.exit(1);
});
