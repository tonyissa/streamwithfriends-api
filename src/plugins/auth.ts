import type { FastifyPluginAsync } from "fastify";
import fastifyPlugin from "fastify-plugin";

const authPlugin: FastifyPluginAsync = async (server) => {
    server.decorate("user", null);
    server.addHook("preHandler", async (req) => {
        try {
            req.user = await req.jwtVerify<{ id: string, role: string }>()
        } catch (e) { }
    })
}

export default fastifyPlugin(authPlugin);

declare module "fastify" {
    interface fastifyJwt {
        user: { id: string, role: string };
    }
}