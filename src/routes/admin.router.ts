import type { FastifyInstance } from "fastify";
import { requireAdmin } from "../middlewares/auth.middleware";
import * as adminController from "../controllers/admin.controller";
import { DeleteRequest } from "../schemas/Admin";

export default async function adminRouter(server: FastifyInstance) {
    server.get("/generate-code", { preHandler: requireAdmin }, adminController.generateInvite);

    server.post<{ Body: DeleteRequest }>("/delete-account", {
        schema: {
            body: {
                type: "object",
                properties: {
                    id: { type: 'number' }
                },
                required: ["id"]
            }
        },
        preHandler: requireAdmin
    }, adminController.deleteAccount)
}