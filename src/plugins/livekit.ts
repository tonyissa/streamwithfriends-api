import { RoomServiceClient, AccessToken, IngressClient, IngressInput, IngressInfo } from "livekit-server-sdk";
import { FastifyPluginAsync } from "fastify";
import fastifyPlugin from "fastify-plugin";

const identityCache = new Map<string, string>();
const roomService = new RoomServiceClient(
    process.env.LIVEKIT_HOST_URL,
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET
);

const ingressClient = new IngressClient(process.env.LIVEKIT_HOST_URL, process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET);
const ingress = {
    name: "movie-ingress",
    roomName: "movie-room",
    participantIdentity: "movie-stream",
    participantName: "Movie Stream",
    enableTranscoding: false
};

const livekitPlugin: FastifyPluginAsync = async (server) => {
    server.decorate("ingress", null);
    server.addHook("onReady", async () => {
        // (await ingressClient.listIngress()).forEach(async ingress => await ingressClient.deleteIngress(ingress.ingressId));
        await roomService.createRoom({ name: "movie-room", emptyTimeout: 60 * 5, departureTimeout: 60 * 5 });
        server.log.info("Livekit room 'movie-room' created");
        const ingressInfo = await ingressClient.createIngress(IngressInput.WHIP_INPUT, ingress);
        server.log.info("Livekit ingress 'movie-ingress' created");
        server.ingress = ingressInfo;
    })

    server.decorate("livekit", {
        createAccessToken: async (identity: string) => {
            let jwtToken = identityCache.get(identity);
            if (!jwtToken) {
                const token = new AccessToken(
                    process.env.LIVEKIT_API_KEY,
                    process.env.LIVEKIT_API_SECRET,
                    { identity }
                );
                token.addGrant({ roomJoin: true, room: "movie-room", canSubscribe: true });
                jwtToken = await token.toJwt();
                identityCache.set(identity, jwtToken)
            }
            return jwtToken;
        },
    });

    server.addHook("onClose", async () => {
        await roomService.deleteRoom("movie-room");
        server.log.info("Livekit 'movie-room' deleted");
        await ingressClient.deleteIngress(server.ingress!.ingressId);
        server.log.info("Livekit ingress closed");
    })
};

export default fastifyPlugin(livekitPlugin);

declare module "fastify" {
    interface FastifyInstance {
        livekit: {
            createAccessToken: (identity: string) => Promise<string>;
        };
        ingress: IngressInfo | null
    }
}