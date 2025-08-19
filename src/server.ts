import fastifyJwt from "@fastify/jwt";
import fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import type { FastifyJWTOptions } from "@fastify/jwt";
import prisma from "./plugins/db";
import auth from "./plugins/auth";
import fastifyCookie from "@fastify/cookie";
import loadConfig from "./config/loadConfig";

loadConfig();

const server = fastify({ logger: true });

server.register(fastifyCookie);
server.register(fastifyJwt, { secret: process.env.DATABASE_URL } as FastifyJWTOptions);
server.register(prisma)
server.register(auth);

server.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        await request.jwtVerify();
    } catch (err) {
        reply.code(401).send({ message: "Unauthorized" });
    }
});

const start = async () => {
    try {
        await server.listen({ port: 3000 });
        console.log("Server running at http://localhost:3000");
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
  
start();