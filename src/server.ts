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

loadConfig();
const server = fastify({ logger: true });

server.register(cors, {
  credentials: true,
  origin: (origin, cb) => {
    const allowed = [
      "https://streamwithfriends.vercel.app",
      "http://localhost:5173"
    ];
    const ngrokRegex = /^https:\/\/[a-z0-9-]+\.ngrok-free\.app$/;
    if (!origin) {
      cb(null, true);
      return;
    }
    if (allowed.includes(origin) || ngrokRegex.test(origin)) {
      cb(null, origin);
    } else {
      cb(new Error("Not allowed"), false);
    }
  }
});
server.register(fastifyCookie);
server.register(fastifyJwt, { secret: process.env.JWT_SECRET, cookie: { cookieName: "token", signed: false } });
server.register(prisma);
server.register(auth);

server.register(adminRouter, { prefix: '/api/admin' })
server.register(authRouter, { prefix: '/api/auth' })

server.setErrorHandler((error, _request, reply) => {
    server.log.error(error);
    reply.status(500).send({ error: 'Something went wrong' });
});

server.get("/api/health", (_req, reply) => reply.code(200));

const start = async () => {
    try {
        await server.listen({ port: 3000 });
        console.log("Server running at http://localhost:3000");
        const session = await new ngrok.SessionBuilder().authtoken(process.env.NGROK_TOKEN).connect();
        const listener = await session.httpEndpoint().listen();
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