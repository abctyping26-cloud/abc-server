import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { CommercialUser } from "../models/commercialUser.model.js";
import { uploadStreamToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";

const verify = async () => {
  console.log("🚀 Starting End-to-End Client & Cloudinary Integration Verification...");

  await connectDatabase();
  console.log("✅ 1. Connected to MongoDB Atlas");

  // Create a sparse client (only name provided)
  const testId = `test_client_${Date.now()}`;
  const client = await CommercialUser.create({
    identifier: testId,
    name: "Verification Test Client",
    completed: false,
    source: "manual",
    files: [],
  });
  console.log("✅ 2. Created sparse client in 'user-commercial' collection. ID:", client._id.toString());
  console.log("      Initial completed status:", client.completed);

  // In-memory buffer streaming to Cloudinary
  const testBuffer = Buffer.from("Verification test document contents for ABC Commercial Client.");
  console.log("📤 3. Streaming test file to Cloudinary in-memory...");
  const cloudUpload = await uploadStreamToCloudinary(testBuffer, {
    folder: `abc_clients/${client._id}/documents`,
    resource_type: "raw",
    public_id: `test_doc_${Date.now()}`,
  });
  console.log("✅ 4. File stored in Cloudinary! Secure URL:", cloudUpload.secure_url);
  console.log("      Cloudinary Public ID:", cloudUpload.public_id);

  // Attach file record to client in MongoDB
  client.files.push({
    public_id: cloudUpload.public_id,
    url: cloudUpload.secure_url,
    fileName: "verification_test_file.txt",
    fileType: "text/plain",
    fileSize: testBuffer.length,
    uploadedAt: new Date(),
  });
  await client.save();
  console.log("✅ 5. File metadata saved to MongoDB. Total files attached:", client.files.length);

  // Test toggling completed status
  client.completed = true;
  await client.save();
  const refreshed = await CommercialUser.findById(client._id);
  console.log("✅ 6. Toggled service status to Completed. DB value:", refreshed?.completed);

  // Clean up file in Cloudinary
  console.log("🗑️  7. Cleaning up test file from Cloudinary...");
  const destroyResult = await deleteFromCloudinary(cloudUpload.public_id, "raw");
  console.log("✅ 8. Cloudinary deletion result:", destroyResult?.result);

  // Clean up client in MongoDB
  await CommercialUser.findByIdAndDelete(client._id);
  console.log("✅ 9. Test client cleaned up from MongoDB.");

  await disconnectDatabase();
  console.log("🎉 All 9 verification steps completed successfully with real MongoDB and Cloudinary!");
  process.exit(0);
};

verify().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
