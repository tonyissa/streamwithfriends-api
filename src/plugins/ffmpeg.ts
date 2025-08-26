import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import fastifyPlugin from "fastify-plugin";

const STREAM_URL = 'http://127.0.0.1:8081';

export default fastifyPlugin((server) => {
    server.decorate('ffmpeg', null);

    server.addHook("onReady", () => {
        const RTMP_URL = `${server.ingress!.url}/${server.ingress!.streamKey}`;
        console.log("Spawning ffmpeg child process");
        const ffmpegProcess = spawn("ffmpeg", [
            '-re',
            '-i', STREAM_URL,
            // Video settings
            '-c:v', 'libx264',            // use H.264
            '-preset', 'veryfast',        // encoding speed/efficiency tradeoff
            '-pix_fmt', 'yuv420p',
            '-g', '60',                   // GOP size (2s at 30fps)
            '-r', '30',                   // frame rate
            '-b:v', '2500k',              // video bitrate
            '-maxrate', '2500k',
            '-bufsize', '5000k',

            // Audio settings
            '-c:a', 'aac',                // AAC audio
            '-ar', '44100',               // sample rate
            '-b:a', '128k',               // audio bitrate
            '-ac', '2',    
            "-filter:a", "aresample=async=1:min_hard_comp=0.100:first_pts=0",

            // Output
            '-f', 'flv',
            RTMP_URL
        ]);
        
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