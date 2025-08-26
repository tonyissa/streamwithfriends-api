import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import fastifyPlugin from "fastify-plugin";

const STREAM_URL = 'http://127.0.0.1:8081';

export default fastifyPlugin((server) => {
    server.decorate('ffmpeg', null);

    server.addHook("onReady", () => {
        const RTMP_URL = `${server.ingress!.url}/${server.ingress!.streamKey}`;
        console.log("Spawning ffmpeg child process");
        const ffmpegProcess = spawn("ffmpeg", [
            "-re",                               // pace to realtime
            "-fflags", "+genpts",                // generate pts if missing
            "-use_wallclock_as_timestamps", "1",
            "-rw_timeout", "15000000",           // 15s read timeout (microseconds)
            "-timeout", "15000000",
            "-reconnect", "1",
            "-reconnect_streamed", "1",
            "-reconnect_at_eof", "1",
            "-i", STREAM_URL,
          
            // --- video encode (H.264 for RTMP) ---
            "-c:v", "libx264",
            "-preset", "medium",               // bump to "medium" if you want more quality + CPU
            "-tune", "zerolatency",
            "-pix_fmt", "yuv420p",
            "-profile:v", "high",
            "-level:v", "4.1",
            "-r", "30",
            "-g", "60",                          // keyframe every 2s @ 30fps
            "-x264opts", "no-scenecut",
            "-b:v", "4500k",                     // target bitrate
            "-maxrate", "4500k",
            "-bufsize", "9000k",
          
            // --- audio encode (AAC; resample & de-jitter) ---
            "-c:a", "aac",
            "-b:a", "160k",
            "-ac", "2",
            "-ar", "48000",
            "-filter:a", "aresample=async=1:min_hard_comp=0.100:first_pts=0",
          
            // --- container/target (LiveKit Ingress via RTMPS) ---
            "-f", "flv",
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