import "server-only";
import path from "node:path";

export const uploadDir = () => path.resolve(process.env.UPLOAD_DIR ?? "./uploads");
