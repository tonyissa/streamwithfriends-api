import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { FastifyInstance } from "fastify";

export default async function ffmpegManager(server: FastifyInstance, streamURL: string, rtmpsURL: string) {
    const realArgs = getRealArgs(streamURL, rtmpsURL);
    const blankArgs = getBlankArgs(rtmpsURL);

    let ff: ffProcess = {
        type: "blank",
        process: spawn("ffmpeg", blankArgs)
    }
    let timerOptimization = false;

    while (true) {
        if (ff.type === "blank") {
            const streamExists = await checkStream(streamURL, server);
            if (streamExists) {
                ff.process.kill("SIGINT");
                ff = {
                    type: "real",
                    process: spawn("ffmpeg", realArgs)
                };

                ff.process.on("exit", () => {
                    ff = {
                        type: "blank",
                        process: spawn("ffmpeg", blankArgs)
                    };
                    
                    timerOptimization = true;
                })
            }
        }
        
        if (timerOptimization) {
            timerOptimization = false;
            continue;
        }

        await new Promise((resolve) => setTimeout(resolve, 5000));
    }
}

async function checkStream(streamURL: string, server: FastifyInstance): Promise<boolean> {
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
            server.log.error("ffprobe error: " + error.message)
            resolve(false);
        })
    })
}

const getRealArgs = (streamURL: string, rtmpsURL: string) => [
    '-i', streamURL,
    '-c:v', 'libx264',
    '-c:a', 'aac',
    '-g', '60',             // GOP size (2s at 30fps)
    '-r', '30',             // frame rate
    '-preset', 'veryfast',  // veryfast, fast, medium
    '-b:v', '2500k',        // 3500k, 4000k, 4500k
    '-maxrate', '2500k',    // 3500k, 4000k, 4500k
    '-bufsize', '7000k',    // 7500k, 8000k, 8500k
    '-ar', '44100',         // 44100, 48000
    '-b:a', '128k',         // 128k, 160k, 220k
    '-f', 'flv',
    rtmpsURL
];

const getBlankArgs = (rtmpsURL: string) => [
    "-f", "lavfi",
    "-i", "color=c=black:s=1280x720:r=30",
    "-f", "lavfi",
    "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
    "-c:v", "libvpx",
    "-c:a", "libopus",
    "-f", "flv",
    rtmpsURL
];

interface ffProcess {
    type: "blank" | "real";
    process: ChildProcessWithoutNullStreams;
}