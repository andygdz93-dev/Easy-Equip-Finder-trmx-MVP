import { FastifyInstance } from "fastify";
import { listings } from "../store.js";
import { fail, ok } from "../response.js";

const sellerOnly = new Set(["seller", "admin"]);

export default async function sellerRoutes(app: FastifyInstance) {
  app.get("/insights", { preHandler: app.authenticate }, async (request, reply) => {
    if (!sellerOnly.has(request.user.role)) {
      return fail(request, reply, "FORBIDDEN", "Seller access only.", 403);
    }

    const atRiskListings = listings
      .filter((listing) => listing.hours > 7000 || listing.price > 220000)
      .slice(0, 5);

    const priceBands = listings.slice(0, 4).map((listing) => ({
      listingId: listing.id,
      range: {
        min: listing.price * 0.9,
        max: listing.price * 1.1,
      },
      state: listing.state,
    }));

    const qualityChecklistSummary = {
      total: listings.length,
      missingImages: listings.filter((listing) => !listing.imageUrl).length,
      missingDescriptions: listings.filter((listing) => !listing.description).length,
    };

    return ok(request, {
      atRiskListings,
      priceBands,
      qualityChecklistSummary,
    });
  });
}
