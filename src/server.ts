import fastifyJwt from "@fastify/jwt";
import fastify from "fastify";
import prisma from "./plugins/db";
import auth from "./plugins/auth";
import fastifyCookie from "@fastify/cookie";
import loadConfig from "./config/loadConfig";
import adminRouter from "./routes/admin.router";
import authRouter from "./routes/auth.router";
import ngrok from "@ngrok/ngrok";
import cors from "@fastify/cors";
import originCB from "./utils/originCb";
import livekit from "./plugins/livekit";

loadConfig();
const server = fastify({ logger: true, trustProxy: true });

server.register(cors, { credentials: true, origin: originCB, exposedHeaders: "Streamwithfriends" });
server.register(fastifyCookie);
server.register(fastifyJwt, { secret: process.env.JWT_SECRET, cookie: { cookieName: "token", signed: false } });
server.register(prisma);
server.register(auth);
server.register(livekit);

server.register(adminRouter, { prefix: '/api/admin' });
server.register(authRouter, { prefix: '/api/auth' });

server.setErrorHandler((error, _request, reply) => {
    server.log.error(error);
    reply.status(500).send({ message: 'Something went wrong' });
});

server.get("/api/health", (_req, reply) => reply.header("Streamwithfriends", "true").code(200).send());

const start = async () => {
    try {
        await server.listen({ port: 3000 });
        console.log("Server running at http://localhost:3000");
        const session = await new ngrok.SessionBuilder().authtoken(process.env.NGROK_TOKEN).connect();
        const listener = await session.httpEndpoint().domain(process.env.NGROK_STATIC_URL).listen();
        console.log(`Public URL: ${listener.url()}`);
        await listener.forward("localhost:3000");
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();

process.on('SIGINT', async () => {
    await server.close();
    await ngrok.disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await server.close();
    await ngrok.disconnect();
    process.exit(0);
});

process.on('SIGKILL', async () => {
    await server.close();
    await ngrok.disconnect();
    process.exit(0);
});