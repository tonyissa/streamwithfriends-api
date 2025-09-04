import { StartRequest } from "./ffmpegManager";

const { PION_SERVER_PORT } = process.env;

export async function startPionService(startRequest: StartRequest) {
    const response = await fetch(`http://127.0.0.1:${PION_SERVER_PORT}/start`, {
        method: "POST",
        body: JSON.stringify(startRequest)
    });

    if (!response.ok) {
        console.error(response.body);
        process.exit(1);
    }
}

export async function shutdownPionService() {
    const response = await fetch(`http://127.0.0.1:${PION_SERVER_PORT}/shutdown`);

    if (!response.ok) {
        console.error(response.body);
    }
}