import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import fastifyPlugin from "fastify-plugin";

const STREAM_URL = 'http://127.0.0.1:8081';

export default fastifyPlugin((server) => {
    server.decorate('ffmpeg', null);

    server.addHook("onReady", () => {
        const RTMPS_URL = `${server.ingress!.url}/${server.ingress!.streamKey}`;
        const ffmpegArgs = [
            // Input 1: Try to grab the live HTTP stream
            // '-reconnect', '1',
            // '-reconnect_streamed', '1',
            // '-reconnect_delay_max', '2',
            '-i', STREAM_URL,

            // Input 2: Black video filler
            '-f', 'lavfi',
            '-i', 'color=size=1280x720:rate=30:color=black',

            // Input 3: Silent audio filler
            '-f', 'lavfi',
            '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',

            // Choose which inputs to overlay: if main video is missing, fallback
            '-filter_complex',
            '[0:v]scale=1280:720:force_original_aspect_ratio=decrease[pv];' +
            '[1:v][pv]overlay=shortest=1:format=auto[outv];' +
            '[0:a][2:a]amix=inputs=2:dropout_transition=3[outa]',

            // Map final outputs
            '-map', '[outv]',
            '-map', '[outa]',

            // Encoding
            '-c:v', 'libx264',
            '-c:a', 'aac',
            // '-g', '60',             // GOP size (2s at 30fps)
            // '-r', '30',             // frame rate
            '-preset', 'veryfast',  // veryfast, fast, medium
            '-b:v', '2500k',        // 3500k, 4000k, 4500k
            '-maxrate', '2500k',    // 3500k, 4000k, 4500k
            '-bufsize', '7000k',    // 7500k, 8000k, 8500k
            '-ar', '44100',         // 44100, 48000
            '-b:a', '128k',         // 128k, 160k, 220k

            // Output to RTMP server
            '-f', 'flv',
            RTMPS_URL
        ];

        console.log("Spawning ffmpeg child process");
        const ffmpegProcess = spawn("ffmpeg", ffmpegArgs);
        
        ffmpegProcess.stdout.on('data', (data) => {
            console.log('FFmpeg stdout:', data.toString());
        });        
        ffmpegProcess.stderr.on('data', (data) => {
            console.log('FFmpeg stderr:', data.toString());
        });

        server.ffmpeg = ffmpegProcess;
    })

    server.addHook("onClose", () => {
        server.ffmpeg!.kill("SIGINT");
        console.log('FFmpeg process kill signal sent')
    });
})

declare module "fastify" {
    interface FastifyInstance {
        ffmpeg: ChildProcessWithoutNullStreams | null;
    }
}