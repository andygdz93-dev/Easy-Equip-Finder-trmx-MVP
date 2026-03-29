import { describe, it, expect, beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import { buildServer } from "../src/server.js";

const app = buildServer();

beforeAll(async () => { await app.ready(); });
afterAll(async ()  => { await app.close(); });

describe("Health", () => {
  it("GET /api/health returns 200", async () => {
    const res = await supertest(app.server).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.service).toBe("easyfinder-api");
  });
});

describe("Auth", () => {
  it("register then login returns JWT", async () => {
    const email = `test-${Date.now()}@easyfinder.ai`;

    const reg = await supertest(app.server)
      .post("/api/auth/register")
      .send({ email, password: "TestPass123!", name: "Tester" });
    expect(reg.status).toBe(200);
    expect(reg.body.data.token).toBeTruthy();

    const login = await supertest(app.server)
      .post("/api/auth/login")
      .send({ email, password: "TestPass123!" });
    expect(login.status).toBe(200);
    expect(login.body.data.token).toBeTruthy();
  });

  it("unauthenticated POST to scoring-configs returns 401", async () => {
    const res = await supertest(app.server)
      .post("/api/scoring-configs")
      .send({
        name: "Demo",
        weights: { price: 0.35, hours: 0.35, location: 0.20, risk: 0.10 },
        preferredStates: ["CA"],
        maxHours: 8000,
        maxPrice: 200000,
      });
    expect(res.status).toBe(401);
  });
});

describe("Scoring configs", () => {
  it("buyer can POST a scoring config", async () => {
    const login = await supertest(app.server)
      .post("/api/auth/login")
      .send({ email: "buyer@easyfinder.ai", password: "BuyerPass123!" });
    const token = login.body.data.token;

    const res = await supertest(app.server)
      .post("/api/scoring-configs")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Buyer Config",
        weights: { price: 0.40, hours: 0.40, location: 0.10, risk: 0.10 },
        preferredStates: ["TX"],
        maxHours: 9000,
        maxPrice: 220000,
      });
    expect(res.status).toBe(200);
    expect(res.body.data.config.name).toBe("Buyer Config");
  });
});

describe("Authorization", () => {
  it("seller endpoint is blocked for buyer role", async () => {
    const login = await supertest(app.server)
      .post("/api/auth/login")
      .send({ email: "buyer@easyfinder.ai", password: "BuyerPass123!" });
    const token = login.body.data.token;

    const res = await supertest(app.server)
      .get("/api/seller/insights")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe("Listings", () => {
  it("GET /api/listings returns scored listings", async () => {
    const res = await supertest(app.server).get("/api/listings");
    expect(res.status).toBe(200);
    expect(res.body.data.listings).toBeInstanceOf(Array);
    expect(res.body.data.listings.length).toBeGreaterThan(0);
    const first = res.body.data.listings[0];
    expect(first.score).toBeDefined();
    expect(first.score.total).toBeGreaterThan(0);
  });
});
