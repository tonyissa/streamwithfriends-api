import fastifyPlugin from "fastify-plugin";
import { PrismaClient } from "@prisma/client";
import { FastifyPluginAsync } from "fastify";

const prisma = new PrismaClient();

const prismaPlugin: FastifyPluginAsync = async (server) => {
    server.decorate("prisma", prisma)
    server.addHook("onClose", async (server) => {
        await server.prisma.$disconnect();
    })
}

export default fastifyPlugin(prismaPlugin);

declare module "fastify" {
    interface FastifyInstance {
        prisma: PrismaClient
    }
}