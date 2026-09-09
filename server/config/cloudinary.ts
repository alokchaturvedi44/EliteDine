import { v2 as cloudinary } from "cloudinary";
import "dotenv/config";

cloudinary.config();

console.log("Cloudinary configured:", {
  cloud_name: cloudinary.config().cloud_name,
  api_key: cloudinary.config().api_key,
});

export default cloudinary;