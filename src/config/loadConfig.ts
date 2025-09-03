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
        LOCAL_STREAM_URL,
        OUT_AUDIO_STREAM,
        OUT_VIDEO_STREAM
    } = process.env;

    if (
        !DATABASE_URL || 
        !JWT_SECRET || 
        !NGROK_TOKEN || 
        !NGROK_STATIC_URL || 
        !LIVEKIT_HOST_URL || 
        !LIVEKIT_API_KEY || 
        !LIVEKIT_API_SECRET || 
        !LOCAL_STREAM_URL ||
        !OUT_AUDIO_STREAM ||
        !OUT_VIDEO_STREAM
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
            LOCAL_STREAM_URL: string;
            OUT_AUDIO_STREAM: string;
            OUT_VIDEO_STREAM: string;
        }
    }
}