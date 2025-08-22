import type { FastifyReply, FastifyRequest } from "fastify";

export function requireAuth(req: FastifyRequest, reply: FastifyReply) {
    if (!req.currentUser) 
        return reply.status(401).send({ message: "Unauthorized" });
}

export function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
    if (req.currentUser.role !== "admin")
        return reply.status(403).send({ message: "Forbidden" });
}