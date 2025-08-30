import { ChildProcessWithoutNullStreams } from "child_process";
import { FastifyInstance } from "fastify";
import fastifyPlugin from "fastify-plugin";
import ffmpegManager from "../utils/ffmpegManager";

function ffmpegPlugin(server: FastifyInstance) {
    server.addHook('onReady', async () => {
        ffmpegManager(server)
            .catch(err => server.log.error(err));
    })
}

export default fastifyPlugin(ffmpegPlugin);

declare module "fastify" {
    interface FastifyInstance {
        ffmpeg: ChildProcessWithoutNullStreams | null;
    }
}