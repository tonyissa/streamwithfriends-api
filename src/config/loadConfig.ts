import path from "path";
import dotenv from "dotenv";

export default function loadConfig() {
    const envPath = path.join(__dirname, "..", "..", ".env")
    const result = dotenv.config();

    if (result.error)
        throw new Error(`Failed to load .env file from path: ${envPath}: ${result.error.message}`);
}