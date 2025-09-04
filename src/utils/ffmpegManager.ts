import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { IngressInfo } from "livekit-server-sdk";
import { startPionService } from "./pion";

const { LOCAL_STREAM_PORT, OUT_AUDIO_PORT, OUT_VIDEO_PORT } = process.env;

const realArgs = [
    '-report',
    '-i', `http://127.0.0.1:${LOCAL_STREAM_PORT}`,
    '-async', '1', '-vsync', '1',
    '-c:v', 'libvpx', '-preset', 'veryfast', '-g', '60', '-keyint_min', '60',
    '-b:v', '3500k', '-maxrate', '3500k', '-bufsize', '7000k',
    '-map', '0:v:0', '-f', 'rtp', '-payload_type', '96', `rtp://127.0.0.1:${OUT_VIDEO_PORT}`,
    '-c:a', 'libopus', '-b:a', '128k', '-ar', '48000', '-ac', '2',
    '-map', '0:a:0', '-f', 'rtp', '-payload_type', '111', `rtp://127.0.0.1:${OUT_AUDIO_PORT}`
];

const blankArgs = [
    '-re',
    '-f', 'lavfi', '-i', 'color=size=1280x720:rate=30:color=black',
    '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
    '-c:v', 'libx264', '-preset', 'veryfast', '-tune', 'zerolatency', '-g', '60', '-b:v', '1500k',
    '-map', '0:v:0', '-f', 'rtp', '-payload_type', '96', `rtp://127.0.0.1:${OUT_VIDEO_PORT}`,
    '-c:a', 'libopus', '-b:a', '96k', '-ar', '48000', '-ac', '2',
    '-map', '1:a:0', '-f', 'rtp', '-payload_type', '111', `rtp://127.0.0.1:${OUT_AUDIO_PORT}`
];

let ff: ffContainer;
let startRequest: StartRequest;

export default async function startFFmpegManager(ing: IngressInfo) {
    startRequest = {
        ingestUrl: `${ing.url}/${ing.streamKey}`,
        audioPort: Number(OUT_AUDIO_PORT),
        videoPort: Number(OUT_VIDEO_PORT)
    };

    await startPionService(startRequest);
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
                    await startBlankStream();
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
            `http://127.0.0.1:${LOCAL_STREAM_PORT}`
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

export interface StartRequest {
    ingestUrl: string;
    audioPort: number;
    videoPort: number;
}