import path from "path";
import dotenv from "dotenv";

export default function loadConfig() {
    const envPath = path.join(__dirname, "..", "..", ".env")
    const result = dotenv.config();

    if (result.error)
        throw new Error(`Failed to load .env file from path: ${envPath}: ${result.error.message}`);

    const {
        DATABASE_URL, 
        JWT_SECRET, 
        NGROK_TOKEN, 
        NGROK_STATIC_URL, 
        LIVEKIT_HOST_URL, 
        LIVEKIT_API_KEY, 
        LIVEKIT_API_SECRET, 
        LOCAL_STREAM_PORT,
        OUT_AUDIO_PORT,
        OUT_VIDEO_PORT,
        PION_SERVER_PORT
    } = process.env;

    if (
        !DATABASE_URL || 
        !JWT_SECRET || 
        !NGROK_TOKEN || 
        !NGROK_STATIC_URL || 
        !LIVEKIT_HOST_URL || 
        !LIVEKIT_API_KEY || 
        !LIVEKIT_API_SECRET || 
        !LOCAL_STREAM_PORT ||
        !OUT_AUDIO_PORT ||
        !OUT_VIDEO_PORT ||
        !PION_SERVER_PORT
    ) throw new Error('Failed to load some environmental variables.')
}

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            DATABASE_URL: string;
            JWT_SECRET: string;
            NGROK_TOKEN: string;
            ADMIN_USERNAME: string;
            ADMIN_PASS: string;
            NGROK_STATIC_URL: string;
            LIVEKIT_HOST_URL: string;
            LIVEKIT_API_KEY: string;
            LIVEKIT_API_SECRET: string;
            LOCAL_STREAM_PORT: string;
            OUT_AUDIO_PORT: string;
            OUT_VIDEO_PORT: string;
            PION_SERVER_PORT: string;
        }
    }
}