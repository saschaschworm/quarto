import Redis from "ioredis";

import { REDIS_DSN } from "@/config/env";

export const redis = new Redis(REDIS_DSN);
