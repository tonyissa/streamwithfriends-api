import { FastifyReply, FastifyRequest } from "fastify";
import generateCode from "../utils/generateCode";
import { DeleteRequest } from "../schemas/Admin";

export const generateInvite = async (req: FastifyRequest, reply: FastifyReply) => {
    while (true) {
        let generatedCode = generateCode();

        if (await req.server.prisma.invite.findUnique({ where: { code: generatedCode } }))
            continue;

        await req.server.prisma.invite.create({
            data: {
                code: generatedCode
            }
        })

        return reply.code(200).send({ code: generatedCode });
    }
}

export const deleteAccount = async (req: FastifyRequest<{ Body: DeleteRequest }>, reply: FastifyReply) => {
    let banID = req.body.id;
    let banned = await req.server.prisma.user.delete({ where: { id: banID } });

    if (banned)
        return reply.code(200).send({ id: banned.id });
    else
        return reply.code(404).send({ message: "User not found" });
}