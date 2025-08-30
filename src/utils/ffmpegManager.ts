import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { FastifyInstance } from "fastify";

const { INGRESS_STREAM_URL, EGRESS_STREAM_URL } = process.env;

const realArgs = [
    "-re",
    '-i', INGRESS_STREAM_URL,
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-tune", "zerolatency",
    "-c:a", "libopus",
    "-ar", "44100",
    "-b:a", "128k",
    "-ac", "2",
    "-f",  "mpegts",
    EGRESS_STREAM_URL
];

const blankArgs = [
    "-re",
    "-f", "lavfi",
    "-i", "color=size=1920x1080:rate=30:color=black",
    "-f", "lavfi",
    "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-tune", "zerolatency",
    "-c:a", "libopus",
    "-ar", "44100",
    "-b:a", "128k",
    "-ac", "2",
    "-shortest",
    "-f", "mpegts",
    EGRESS_STREAM_URL
];

let ff: ffContainer;

export default async function ffmpegManager(server: FastifyInstance) {
    await startBlankStream();
    await tryStartRealStream();
}

async function startBlankStream() {
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

                ff.process.on("exit", async () => {
                    ff = {
                        type: "blank",
                        process: spawn("ffmpeg", blankArgs)
                    };
                    await tryStartRealStream();
                });
                break;
            }
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
}

async function checkStream(): Promise<boolean> {
    return new Promise((resolve) => {
        const probe = spawn("ffprobe", [
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            INGRESS_STREAM_URL
        ])

        probe.on('close', (code) => {
            resolve(code === 0);
        })

        probe.on('error', (error) => {
            console.error(error)
            resolve(false);
        })
    })
}

interface ffContainer {
    type: "blank" | "real";
    process: ChildProcessWithoutNullStreams;
}