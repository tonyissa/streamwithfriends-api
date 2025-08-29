import { ChildProcessWithoutNullStreams } from "child_process";
import { FastifyInstance } from "fastify";
import fastifyPlugin from "fastify-plugin";
import ffmpegManager from "../utils/ffmpegManager";

function ffmpegPlugin(server: FastifyInstance) {
    server.addHook('onReady', async () => {
        const ingress = await server.getIngress();
        const whipURL = `${ingress.url}/${ingress!.streamKey}`;
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