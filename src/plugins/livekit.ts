import { RoomServiceClient, AccessToken } from "livekit-server-sdk";
import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";

const roomService = new RoomServiceClient(
    process.env.LIVEKIT_HOST_URL!,
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!
);

const livekit: FastifyPluginAsync = async (server) => {
    server.addHook("onReady", async () => {
        await roomService.createRoom({ name: "movie-room" });
        server.log.info("Livekit 'movie-room' created");
    })

    server.decorate("livekit", {
        createAccessToken: async (identity: string) => {
            const token = new AccessToken(
                process.env.LIVEKIT_API_KEY,
                process.env.LIVEKIT_API_SECRET,
                { identity }
            );
            token.addGrant({ roomJoin: true, room: "movie-room" });
            return await token.toJwt();
        },
    });

    server.addHook("onClose", async () => {
        await roomService.deleteRoom("movie-room");
        server.log.info("Livekit 'movie-room' deleted");
    })
};

export default fp(livekit);

declare module "fastify" {
    interface FastifyInstance {
        livekit: {
            createAccessToken: (identity: string) => Promise<string>;
      };
    }
  }