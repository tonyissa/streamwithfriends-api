import type { FastifyInstance } from "fastify";
import { requireAuth } from "../middlewares/auth";
import type { LoginRequest, RegisterRequest } from "../schemas/User";
import * as authController from "../controllers/auth.controller";

export default async function authRouter(server: FastifyInstance) {
    server.get('/verify', { preHandler: requireAuth }, (req, reply) => reply.code(200).send({
        username: req.currentUser.username,
        role: req.currentUser.role
    }));

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