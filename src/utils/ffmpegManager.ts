import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { FastifyInstance } from "fastify";

const { LOCAL_STREAM_PORT } = process.env;

let realArgs: string[];
let blankArgs: string[];
let ff: ffProcess;
let streamURL: string;
let rtmpsURL: string;

export default async function ffmpegManager(server: FastifyInstance) {
    const ing = await server.getIngress();
    streamURL = `http://localhost:${LOCAL_STREAM_PORT}`;
    rtmpsURL = `${ing.url}/${ing.streamKey}`;
    realArgs = getRealArgs(streamURL, rtmpsURL);
    blankArgs = getBlankArgs(rtmpsURL);

    startBlankStream();
    await tryStartRealStream();
}

function startBlankStream() {
    ff = {
        type: "blank",
        process: spawn("ffmpeg", blankArgs)
    }
}

async function tryStartRealStream() {
    while (true) {
        if (ff.type === "blank") {
            const streamExists = await checkStream();
            if (streamExists) {
                ff.process.kill("SIGINT");
                ff = {
                    type: "real",
                    process: spawn("ffmpeg", realArgs)
                };

                ff.process.on("exit", () => {
                    startBlankStream();
                    tryStartRealStream();
                })
                break;
            }
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
    }
}

async function checkStream(): Promise<boolean> {
    return new Promise((resolve) => {
        const probe = spawn("ffprobe", [
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            streamURL
        ])

        probe.on('close', (code) => {
            resolve(code === 0);
        })

        probe.on('error', (error) => {
            console.error("ffprobe error: " + error.message)
            resolve(false);
        })
    })
}

const getRealArgs = (streamURL: string, rtmpsURL: string) => [
    '-re',
    '-i', streamURL,
    '-c:v', 'copy',
    '-c:a', 'copy',
    // '-c:v', 'libx264',
    // '-c:a', 'aac',
    // '-g', '60',             // GOP size (2s at 30fps)
    // '-r', '30',             // frame rate
    // '-preset', 'veryfast',  // veryfast, fast, medium
    // '-b:v', '2500k',        // 3500k, 4000k, 4500k
    // '-maxrate', '2500k',    // 3500k, 4000k, 4500k
    // '-bufsize', '7000k',    // 7500k, 8000k, 8500k
    // '-ar', '44100',         // 44100, 48000
    // '-b:a', '128k',         // 128k, 160k, 220k
    '-f', 'flv',
    rtmpsURL
];

const getBlankArgs = (rtmpsURL: string) => [
    "-f", "lavfi",
    "-i", "color=c=black:s=1280x720:r=30",
    "-f", "lavfi",
    "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
    "-c:v", "libx264",
    "-c:a", "aac",
    "-f", "flv",
    rtmpsURL
];

interface ffProcess {
    type: "blank" | "real";
    process: ChildProcessWithoutNullStreams;
}