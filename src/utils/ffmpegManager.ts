import { ChildProcessWithoutNullStreams, spawn } from "child_process";

const { LOCAL_STREAM_URL, OUT_AUDIO_STREAM, OUT_VIDEO_STREAM } = process.env;

const realArgs = [
    '-re',
    '-i', LOCAL_STREAM_URL,
    '-c:v', 'libx264', '-preset', 'veryfast', '-tune', 'zerolatency', '-g', '60', '-b:v', '3500k',
    '-c:a', 'libopus', '-b:a', '128k', '-ar', '48000', '-ac', '2',
    '-f', 'rtp', '-payload_type', '96', OUT_VIDEO_STREAM,
    '-f', 'rtp', '-payload_type', '111', OUT_AUDIO_STREAM
];

const blankArgs = [
    '-re',
    '-f', 'lavfi', '-i', 'color=size=1280x720:rate=30:color=black',
    '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
    '-c:v', 'libx264', '-preset', 'veryfast', '-tune', 'zerolatency', '-g', '60', '-b:v', '1500k',
    '-f', 'rtp', '-payload_type', '96', OUT_VIDEO_STREAM,
    '-c:a', 'libopus', '-b:a', '96k', '-ar', '48000', '-ac', '2',
    '-f', 'rtp', '-payload_type', '111', OUT_AUDIO_STREAM
];

let ff: ffContainer;

export default async function startFFmpegManager() {
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
            LOCAL_STREAM_URL
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