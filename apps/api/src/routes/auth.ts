import { FastifyInstance } from "fastify";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { pool } from "../db.js";
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

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [payload.email]);
    if (existing.rows.length > 0) {
      return fail(request, reply, "EMAIL_EXISTS", "Email already registered.", 400);
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const id = nanoid();
    const name = payload.name ?? "New User";

    await pool.query(
      "INSERT INTO users (id, email, password_hash, role, name) VALUES ($1, $2, $3, $4, $5)",
      [id, payload.email, passwordHash, "buyer", name]
    );

    const token = await reply.jwtSign({ id, role: "buyer" });

    return ok(request, {
      token,
      user: { id, email: payload.email, name, role: "buyer" },
    });
  });

  app.post("/login", async (request, reply) => {
    const payload = loginSchema.parse(request.body);

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [payload.email]);
    const user = result.rows[0];

    if (!user) {
      return fail(request, reply, "INVALID_CREDENTIALS", "Invalid credentials.", 401);
    }

    const valid = await bcrypt.compare(payload.password, user.password_hash);
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
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [request.user?.id]);
    const user = result.rows[0];
    if (!user) {
      return fail(request, reply, "NOT_FOUND", "User not found.", 404);
    }
    return ok(request, { id: user.id, email: user.email, name: user.name, role: user.role });
  });
}
