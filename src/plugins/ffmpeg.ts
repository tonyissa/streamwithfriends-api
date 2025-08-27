import { ChildProcessWithoutNullStreams } from "child_process";
import { FastifyInstance } from "fastify";
import fastifyPlugin from "fastify-plugin";
import ffmpegManager from "../utils/ffmpegManager";

function ffmpegPlugin(server: FastifyInstance) {
    server.addHook('onReady', () => {
        const whipURL = `${server.ingress!.url}/${server.ingress!.streamKey}`;
        ffmpegManager(server, process.env.LOCAL_STREAM_URL, whipURL)
            .catch(err => server.log.error(err));
    })
}

export default fastifyPlugin(ffmpegPlugin);

declare module "fastify" {
    interface FastifyInstance {
        ffmpeg: ChildProcessWithoutNullStreams | null;
    }
}