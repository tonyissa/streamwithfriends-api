import type { FastifyReply, FastifyRequest } from "fastify";
import type { LoginRequest, RegisterRequest } from "../schemas/User";
import bcrypt from "bcrypt"

// For later use ZOD for validation
export const register = async (req: FastifyRequest<{ Body: RegisterRequest }>, reply: FastifyReply) => {
    const { username, password, inviteCode } = req.body;
    var invite = await req.server.prisma.invite.findUnique({ where: { code: inviteCode, used: false } });

    if (!invite)
        return reply.code(400).send({ message: "Invalid invite code" })

    var hashed = await bcrypt.hash(password, 10);
    var user = await req.server.prisma.user.create({
        data: {
            username,
            password: hashed,
        }
    });

    if (!user)
        return reply.code(400).send({ message: "There was an error with this request" });

    const token = req.server.jwt.sign({ id: user.id, username: user.username, role: user.role });
    const oneMonthLater = 60 * 60 * 24 * 30;

    return reply
        .setCookie('token', token, { httpOnly: true, secure: true, sameSite: "none", maxAge: oneMonthLater, path: "/" })
        .code(200)
        .send({ username: user.username, role: user.role });
}

export const login = async (req: FastifyRequest<{ Body: LoginRequest }>, reply: FastifyReply) => {
    const { username: loginUsername, password: loginPassword } = req.body;
    var user = await req.server.prisma.user.findUnique({ where: { username: loginUsername } });

    if (!user)
        return reply.code(400).send({ message: "Login request failed" });

    var validPassword = await bcrypt.compare(loginPassword, user.password);

    if (!validPassword)
        return reply.code(400).send({ message: "Login request failed" });

    const token = req.server.jwt.sign({ id: user.id, username: user.username, role: user.role });
    const oneMonthLater = 60 * 60 * 24 * 30;

    return reply
        .setCookie('token', token, { httpOnly: true, secure: true, sameSite: "none", maxAge: oneMonthLater, path: "/" })
        .code(200)
        .send({ username: user.username, role: user.role });
}

export const requestWatchAccess = async (req: FastifyRequest, reply: FastifyReply) => {
    const viewerToken = await req.server.livekit.createAccessToken(req.currentUser.username);
    req.server.log.info(`Watch request granted to user ${req.currentUser.username}`);
    return reply.code(200).send({ viewerToken });
}