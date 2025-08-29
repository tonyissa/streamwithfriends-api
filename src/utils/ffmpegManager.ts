import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { FastifyInstance } from "fastify";

export default async function ffmpegManager(server: FastifyInstance, streamURL: string, whipURL: string) {
    const realArgs = getRealArgs(streamURL, whipURL);
    const blankArgs = getBlankArgs(whipURL);

    let ff: ffProcess = {
        type: "blank",
        process: spawn("C:\\TEMP\\ffmpeg", blankArgs)
    }
    let timerOptimization = false;

    while (true) {
        const ingress = await server.getIngress();
        console.log(ingress.state);

        if (ff.type === "blank") {
            const streamExists = await checkStream(streamURL, server);
            if (streamExists) {
                ff.process.kill("SIGINT");
                ff = {
                    type: "real",
                    process: spawn("C:\\TEMP\\ffmpeg", realArgs)
                };

                ff.process.on("exit", () => {
                    ff = {
                        type: "blank",
                        process: spawn("C:\\TEMP\\ffmpeg", blankArgs)
                    };
                    
                    timerOptimization = true;
                })

                ff.process.stderr.on("data", (data) => console.log(data));
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
        const probe = spawn("C:\\TEMP\\ffprobe", [
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

const getRealArgs = (streamURL: string, whipURL: string) => [
    "-report",
    "-loglevel", "debug",
    "-re",
    '-i', streamURL,
    "-c:v", "libx264",
    "-profile:v", "baseline",
    "-preset", "veryfast",
    "-level", "3.1",
    "-pix-fmt", "yuv420p",
    "-tune", "zerolatency",
    "-c:a", "libopus",
    "-ar", "48000",
    "-ac", "2",
    "-f", "whip",
    whipURL
];

const getBlankArgs = (whipURL: string) => [
    "-report",
    "-loglevel", "debug",
    "-re",
    "-f", "lavfi",
    "-i", "color=size=1280x720:rate=30:color=black",
    "-f", "lavfi",
    "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-tune", "zerolatency",
    "-c:a", "libopus",
    "-shortest",
    "-f", "whip",
    whipURL
];

interface ffProcess {
    type: "blank" | "real";
    process: ChildProcessWithoutNullStreams;
}