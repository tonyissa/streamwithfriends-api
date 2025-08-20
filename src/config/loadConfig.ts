import path from "path";
import dotenv from "dotenv";

export default function loadConfig() {
    const envPath = path.join(__dirname, "..", "..", ".env")
    const result = dotenv.config();

    if (result.error)
        throw new Error(`Failed to load .env file from path: ${envPath}: ${result.error.message}`);

    var { DATABASE_URL, JWT_SECRET, NGROK_TOKEN } = process.env;

    if (!DATABASE_URL || !JWT_SECRET || !NGROK_TOKEN)
        throw new Error('Failed to load some environmental variables.')
}

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            DATABASE_URL: string;
            JWT_SECRET: string;
            NGROK_TOKEN: string;
        }
    }
}