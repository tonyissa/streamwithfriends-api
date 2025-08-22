import type { FastifyPluginAsync } from "fastify";
import fastifyPlugin from "fastify-plugin";

const authPlugin: FastifyPluginAsync = async (server) => {
    server.decorate("currentUser", null);
    server.addHook("onRequest", async (req) => {
        try {
            req.currentUser = await req.jwtVerify()
        } catch (e) { }
    })
}

export default fastifyPlugin(authPlugin);

declare module "fastify" {
    interface FastifyRequest {
        currentUser: { id: number, username: string, role: string };
    }
}