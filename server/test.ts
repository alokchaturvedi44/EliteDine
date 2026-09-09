import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";
import path from "path";

cloudinary.config();

async function testUpload() {
  try {
    const filePath = path.resolve("test-image.png");

    const result = await cloudinary.uploader.upload(filePath, {
      folder: "EliteDine",
    });

    console.log("SUCCESS");
    console.log(result.secure_url);
  } catch (err: any) {
  console.log("Status:", err.http_code);
  console.log("Message:", err.message);
  console.log("Full error:");
  console.dir(err, { depth: null });
}
}

testUpload();