import { FastifyReply, FastifyRequest } from "fastify";
import { ApiResponse } from "@easyfinderai/shared";

export const ok = <T>(request: FastifyRequest, data: T): ApiResponse<T> => ({
  data,
  requestId: request.requestId,
});

export const fail = (
  request: FastifyRequest,
  reply: FastifyReply,
  code: string,
  message: string,
  status = 400
): ApiResponse<never> => {
  reply.status(status);
  return {
    error: { code, message },
    requestId: request.requestId,
  };
};
