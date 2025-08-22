import type { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from "fastify";

export function requireAuth(req: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) {
    if (!req.currentUser) 
        return reply.status(401).send({ message: "Unauthorized" });

    done();
}

export function requireAdmin(req: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) {
    if (req.currentUser.role !== "admin")
        return reply.status(403).send({ message: "Forbidden" });

    done();
}