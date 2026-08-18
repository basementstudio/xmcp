export const fastifyTypeDefinition = `
import type { FastifyRequest, FastifyReply } from 'fastify';
export declare function xmcpHandler(request: FastifyRequest, reply: FastifyReply): Promise<void>;
`;
