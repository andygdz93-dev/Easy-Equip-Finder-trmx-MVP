import { Listing, User } from "./types.js";

const states = ["CA", "AZ", "TX", "IA", "NV", "CO", "WA", "OR"];
const categories = [
  "Excavator",
  "Bulldozer",
  "Wheel Loader",
  "Crawler Crane",
  "Telehandler",
  "Articulated Dump Truck",
];

export const demoUsers: User[] = [
  {
    id: "demo-user",
    email: "demo@easyfinder.ai",
    name: "Demo User",
    role: "demo",
  },
  {
    id: "buyer-user",
    email: "buyer@easyfinder.ai",
    name: "Buyer User",
    role: "buyer",
  },
  {
    id: "seller-user",
    email: "seller@easyfinder.ai",
    name: "Seller User",
    role: "seller",
  },
  {
    id: "admin-user",
    email: "admin@easyfinder.ai",
    name: "Admin User",
    role: "admin"
  },
];

const categoryQueries: Record<string, string[]> = {
  Excavator: [
    "excavator digging",
    "crawler excavator",
    "hydraulic excavator",
    "excavator heavy equipment",
    "excavator worksite",
    "excavator boom",
  ],
  Bulldozer: [
    "bulldozer pushing dirt",
    "dozer blade",
    "track dozer",
    "bulldozer construction",
    "bulldozer grading",
    "bulldozer earthmoving",
  ],
  "Wheel Loader": [
    "wheel loader",
    "front end loader",
    "loader bucket",
    "wheel loader quarry",
    "loader construction site",
    "wheel loader equipment",
  ],
  "Crawler Crane": [
    "crawler crane",
    "mobile crane",
    "construction crane",
    "crane lifting",
    "crane boom",
    "crane heavy equipment",
  ],
  Telehandler: [
    "telehandler",
    "telehandler lifting",
    "telescopic handler",
    "telehandler boom",
    "telehandler construction",
    "telehandler forks",
  ],
  "Articulated Dump Truck": [
    "articulated dump truck",
    "dump truck hauling",
    "off road dump truck",
    "dump truck mining",
    "haul truck",
    "construction dump truck",
  ],
};

const buildImages = (category: string, seed: number, count = 4) => {
  const queries = categoryQueries[category] ?? [category.toLowerCase()];
  return Array.from({ length: count }).map((_, index) => {
    const query = queries[(seed + index) % queries.length];
    return `https://source.unsplash.com/featured/1200x800/?${encodeURIComponent(
      query
    )}&sig=${seed + index}`;
  });
};

export const generateListings = (count = 40): Listing[] =>
  Array.from({ length: count }).map((_, index) => {
    const state = states[index % states.length];
    const category = categories[index % categories.length];
    const price = 65000 + (index % 9) * 22000 + (index % 4) * 8000;
    const hours = 900 + (index % 10) * 520;
    const images = buildImages(category, index * 7 + 1);
    return {
      id: `listing-${index + 1}`,
      title: `${state} ${category} ${index + 1}`,
      description: `Late-model ${category.toLowerCase()} with documented service history.`,
      state,
      price,
      hours,
      operable: index % 17 !== 0,
      category,
      imageUrl: images[0],
      images,
      source: index % 2 === 0 ? "auctionplanet" : "ironplanet",
      createdAt: new Date(Date.now() - index * 86400000).toISOString(),
    };
  });

export const demoListings = generateListings(40);
