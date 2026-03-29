import { env } from "./env.js";

export const config = {
  port:        env.PORT,
  jwtSecret:   env.JWT_SECRET,
  corsOrigins: env.CORS_ORIGINS,
  demoMode:    env.DEMO_MODE,
  nodeEnv:     env.NODE_ENV,
  db: {
    user:     env.DB_USER,
    host:     env.DB_HOST,
    name:     env.DB_NAME,
    password: env.DB_PASSWORD,
    port:     env.DB_PORT,
  },
  stripe: {
    secretKey: env.STRIPE_SECRET_KEY,
    priceId:   env.STRIPE_PRICE_ID,
    clientUrl: env.CLIENT_URL,
  },
};
