import fastifyPlugin from "fastify-plugin";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default fastifyPlugin(async (server) => {
    server.decorate("prisma", prisma)
    server.addHook("onClose", async (server) => {
        await server.prisma.$disconnect();
    })
});

declare module "fastify" {
    interface FastifyInstance {
        prisma: PrismaClient
    }
}