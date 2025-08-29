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
const ingressOpts = {
    name: "movie-ingress",
    roomName: "movie-room",
    participantIdentity: "movie-stream",
    participantName: "Movie Stream",
    enableTranscoding: false
}

const livekitPlugin: FastifyPluginAsync = async (server) => {
    server.decorate("getIngress");
    server.addHook("onReady", async () => {
        await roomService.createRoom({ name: "movie-room", emptyTimeout: 60 * 5, departureTimeout: 60 * 5 });
        server.log.info("Livekit room 'movie-room' created");
        const ingress = await ingressClient.createIngress(IngressInput.WHIP_INPUT, ingressOpts);
        server.log.info("Livekit ingress 'movie-ingress' created");
        server.getIngress = async () => {
            const ingresses = await ingressClient.listIngress("movie-room");
            return ingresses.find(i => i.ingressId === ingress.ingressId)!;
        }
    });

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
        const ingress = await server.getIngress();
        await ingressClient.deleteIngress(ingress.ingressId);
        server.log.info("Livekit ingress closed");
        await roomService.deleteRoom("movie-room");
        server.log.info("Livekit 'movie-room' deleted");
    })
};

export default fastifyPlugin(livekitPlugin);

declare module "fastify" {
    interface FastifyInstance {
        livekit: {
            createAccessToken: (identity: string) => Promise<string>;
        };
        getIngress: () => Promise<IngressInfo>;
    }
}