import type { FastifyInstance } from "fastify";
import { requireAuth } from "../middlewares/auth";
import { LoginRequest, RegisterRequest } from "../schemas/User";
import * as authController from "../controllers/auth.controller";

export default async function authRouter(server: FastifyInstance) {
    server.get('/verify', { preHandler: requireAuth }, (_req, reply) => reply.code(200))

    server.post<{ Body: RegisterRequest }>('/register', {
        schema: {
            body: {
                type: "object",
                properties: {
                    username: { type: 'string' },
                    password: { type: 'string' },
                    inviteCode: { type: 'string' }
                },
                required: ["username", "password", "inviteCode"]
            }
        },
    }, authController.register)

    server.post<{ Body: LoginRequest }>('/login', {
        schema: {
            body: {
                type: "object",
                properties: {
                    username: { type: 'string' },
                    password: { type: 'string' }
                },
                required: ["username", "password"]
            }
        },
    }, authController.login)
}