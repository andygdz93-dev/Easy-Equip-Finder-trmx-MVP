import "fastify";
import "@fastify/jwt";
import type { FastifyReply } from "fastify";

declare module "fastify" {
  interface FastifyRequest {
    requestId: string;
    user?: {
      id: string;
      role: "demo" | "buyer" | "seller" | "admin";
    };
  }

  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      id: string;
      role: "demo" | "buyer" | "seller" | "admin";
    };
    user: {
      id: string;
      role: "demo" | "buyer" | "seller" | "admin";
    };
  }
}

export {};
