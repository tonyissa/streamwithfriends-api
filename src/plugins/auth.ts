import type { FastifyPluginAsync } from "fastify";
import fastifyPlugin from "fastify-plugin";

const authPlugin: FastifyPluginAsync = async (server) => {
    server.decorate("currentUser", null);
    server.addHook("preHandler", async (req) => {
        try {
            req.currentUser = await req.jwtVerify<{ id: number, role: string }>()
        } catch (e) { }
    })
}

export default fastifyPlugin(authPlugin);

declare module "fastify" {
    interface FastifyRequest {
        currentUser: { id: number, role: string };
    }
}