import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { CommercialUser } from "../models/commercialUser.model.js";
import { WhatsAppSession } from "../models/whatsappSession.model.js";
import { handleWhatsAppAutomation } from "../services/whatsappAutomation.service.js";

const runVerification = async () => {
  console.log("🚀 Starting WhatsApp Automation Verification Test...\n");

  await connectDatabase();
  console.log("✅ 1. Connected to MongoDB Atlas");

  const testSenderPhone = "919999900001";
  const testClientPhone = "9999911111";

  // Clean up any stale test data first
  await WhatsAppSession.deleteOne({ senderPhone: testSenderPhone });
  await CommercialUser.deleteMany({ phone: testClientPhone });

  console.log("\n--- Step 1: Send '.' to START session ---");
  await handleWhatsAppAutomation({
    senderPhone: testSenderPhone,
    msgType: "text",
    text: ".",
  });

  let session = await WhatsAppSession.findOne({ senderPhone: testSenderPhone });
  if (!session || !session.isActive) {
    throw new Error("❌ Failed: Session should be active after sending '.'");
  }
  console.log("✅ Session successfully started. Active:", session.isActive);

  console.log("\n--- Step 2: Send 'N: Automate Client' (Out-of-order Name before Phone) ---");
  await handleWhatsAppAutomation({
    senderPhone: testSenderPhone,
    msgType: "text",
    text: "N: Automate Client",
  });

  session = await WhatsAppSession.findOne({ senderPhone: testSenderPhone });
  if (session?.tempName !== "Automate Client") {
    throw new Error(`❌ Failed: tempName should be 'Automate Client', got '${session?.tempName}'`);
  }
  console.log("✅ Name buffered in session:", session.tempName);

  console.log("\n--- Step 3: Send Media/File (Out-of-order File before Phone) ---");
  await handleWhatsAppAutomation({
    senderPhone: testSenderPhone,
    msgType: "image",
    text: "Here is client photo",
    media: {
      mediaUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      mediaMimeType: "image/jpeg",
      mediaFileName: "sample_id.jpg",
      mediaFileSize: 102400,
    },
  });

  session = await WhatsAppSession.findOne({ senderPhone: testSenderPhone });
  if (!session?.pendingFiles || session.pendingFiles.length !== 1) {
    throw new Error("❌ Failed: pendingFiles should contain 1 file");
  }
  console.log("✅ File buffered in session pendingFiles:", session.pendingFiles[0].fileName);

  console.log("\n--- Step 4: Send 10-digit Phone Number to create client ---");
  await handleWhatsAppAutomation({
    senderPhone: testSenderPhone,
    msgType: "text",
    text: testClientPhone,
  });

  session = await WhatsAppSession.findOne({ senderPhone: testSenderPhone });
  if (!session?.clientId) {
    throw new Error("❌ Failed: session should be linked to created clientId");
  }

  const createdClient = await CommercialUser.findById(session.clientId);
  if (!createdClient) {
    throw new Error("❌ Failed: CommercialUser was not found in database");
  }

  console.log("✅ Client created in MongoDB!");
  console.log("   • Name:", createdClient.name);
  console.log("   • Phone:", createdClient.phone);
  console.log("   • Files attached count:", createdClient.files.length);
  console.log("   • File Name:", createdClient.files[0]?.fileName);

  if (createdClient.name !== "Automate Client") {
    throw new Error(`❌ Expected client name 'Automate Client', got '${createdClient.name}'`);
  }
  if (createdClient.files.length !== 1) {
    throw new Error(`❌ Expected 1 attached file, got ${createdClient.files.length}`);
  }

  console.log("\n--- Step 5: Send '.' to CLOSE session ---");
  await handleWhatsAppAutomation({
    senderPhone: testSenderPhone,
    msgType: "text",
    text: ".",
  });

  session = await WhatsAppSession.findOne({ senderPhone: testSenderPhone });
  if (session?.isActive) {
    throw new Error("❌ Failed: Session should be inactive after sending '.'");
  }
  console.log("✅ Session successfully closed. Active:", session?.isActive);

  console.log("\n--- Step 6: Start NEW session and send EXISTING phone number ---");
  await handleWhatsAppAutomation({
    senderPhone: testSenderPhone,
    msgType: "text",
    text: ".",
  });

  await handleWhatsAppAutomation({
    senderPhone: testSenderPhone,
    msgType: "text",
    text: testClientPhone,
  });

  session = await WhatsAppSession.findOne({ senderPhone: testSenderPhone });
  if (!session?.clientId || session.clientId.toString() !== createdClient._id.toString()) {
    throw new Error("❌ Failed: Existing client should be selected in session");
  }
  console.log("✅ Existing client successfully identified and selected in new session!");

  // Close session
  await handleWhatsAppAutomation({
    senderPhone: testSenderPhone,
    msgType: "text",
    text: ".",
  });

  // Cleanup test data
  console.log("\n🧹 Cleaning up test records...");
  await WhatsAppSession.deleteOne({ senderPhone: testSenderPhone });
  await CommercialUser.deleteMany({ phone: testClientPhone });
  console.log("✅ Test data cleaned up.");

  await disconnectDatabase();
  console.log("\n🎉 ALL VERIFICATION TESTS PASSED SUCCESSFULLY!");
};

runVerification().catch((err) => {
  console.error("\n❌ Verification failed:", err);
  process.exit(1);
});
