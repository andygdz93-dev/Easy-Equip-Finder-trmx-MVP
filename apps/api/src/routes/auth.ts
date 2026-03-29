import { FastifyInstance } from "fastify";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { users } from "../store.js";
import { getUserByEmail, getUserById } from "../auth.js";
import { fail, ok } from "../response.js";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export default async function authRoutes(app: FastifyInstance) {
  app.post("/register", async (request, reply) => {
    const payload = registerSchema.parse(request.body);
    if (getUserByEmail(payload.email)) {
      return fail(request, reply, "EMAIL_EXISTS", "Email already registered.", 400);
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const user = {
      id: nanoid(),
      email: payload.email,
      name: payload.name ?? "New User",
      role: "buyer" as const,
      passwordHash,
    };
    users.push(user);

    const token = await reply.jwtSign({ id: user.id, role: user.role });

    return ok(request, {
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  });

  app.post("/login", async (request, reply) => {
    const payload = loginSchema.parse(request.body);
    const user = getUserByEmail(payload.email);
    if (!user) {
      return fail(request, reply, "INVALID_CREDENTIALS", "Invalid credentials.", 401);
    }

    if (!user.passwordHash) {
      return fail(request, reply, "INVALID_CREDENTIALS", "Invalid credentials.", 401);
    }

    const valid = await bcrypt.compare(payload.password, user.passwordHash);
    if (!valid) {
      return fail(request, reply, "INVALID_CREDENTIALS", "Invalid credentials.", 401);
    }

    const token = await reply.jwtSign({ id: user.id, role: user.role });

    return ok(request, {
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  });

  app.get("/me", { preHandler: app.authenticate }, async (request, reply) => {
    const user = getUserById(request.user.id);
    if (!user) {
      return fail(request, reply, "NOT_FOUND", "User not found.", 404);
    }
    return ok(request, { id: user.id, email: user.email, name: user.name, role: user.role });
  });
}
