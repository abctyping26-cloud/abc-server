import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { CommercialUser } from "../models/commercialUser.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";

const runTest = async () => {
  console.log("🧪 Testing Walk-In Client 6-Digit PIN Auth & Password Hashing...\n");

  await connectDatabase();
  console.log("✅ 1. Connected to MongoDB");

  const testPhone = "971500001122";
  const testPin = "654321";

  // Clean up previous test record
  await CommercialUser.deleteMany({
    $or: [{ identifier: testPhone }, { phone: testPhone }, { phone: `+${testPhone}` }],
  });

  // Step 1: Simulate walk-in client creation with 6-digit PIN
  console.log("\n--- Step 1: Create walk-in client with 6-digit PIN ---");
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(testPin, salt);

  const client = await CommercialUser.create({
    identifier: testPhone,
    phone: `+${testPhone}`,
    password: hashedPassword,
    name: "Walk-In Test Customer",
    source: "manual",
    completed: false,
    files: [
      {
        public_id: "test_doc_1",
        url: "https://res.cloudinary.com/demo/image/upload/sample.pdf",
        fileName: "Trade_License_Draft.pdf",
        fileType: "application/pdf",
        fileSize: 102400,
        uploadedAt: new Date(),
      },
    ],
  });

  console.log("✅ Client created:");
  console.log("   • ID:", client._id.toString());
  console.log("   • Name:", client.name);
  console.log("   • Phone:", client.phone);
  console.log("   • Hashed Password in DB:", client.password?.substring(0, 20) + "...");

  // Step 2: Verify bcrypt check
  console.log("\n--- Step 2: Verify 6-digit PIN comparison ---");
  const isMatch = await bcrypt.compare(testPin, client.password!);
  if (!isMatch) {
    throw new Error("❌ PIN comparison failed!");
  }
  console.log("✅ PIN '654321' successfully matches stored bcrypt hash!");

  const isWrongMatch = await bcrypt.compare("000000", client.password!);
  if (isWrongMatch) {
    throw new Error("❌ Wrong PIN should not match!");
  }
  console.log("✅ Incorrect PIN '000000' correctly rejected!");

  // Step 3: Test JWT issuance and verification
  console.log("\n--- Step 3: Test JWT payload for commercial client ---");
  const token = jwt.sign(
    { id: client._id.toString(), identifier: client.identifier, type: "commercial" },
    config.jwtSecret,
    { expiresIn: "7d" }
  );

  const decoded = jwt.verify(token, config.jwtSecret) as any;
  if (decoded.type !== "commercial" || decoded.id !== client._id.toString()) {
    throw new Error("❌ Token decoded properties do not match commercial user!");
  }
  console.log("✅ Commercial client JWT verified successfully:", decoded);

  // Clean up
  await CommercialUser.deleteMany({ _id: client._id });
  console.log("✅ Cleaned up test record.");

  await disconnectDatabase();
  console.log("\n🎉 Walk-in Client Auth tests PASSED!");
};

runTest().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
