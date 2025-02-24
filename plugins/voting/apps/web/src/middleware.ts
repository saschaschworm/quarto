import type { NextRequest as Request } from "next/server";

import { ACCESS_TOKEN } from "./config/env";

export const middleware = (request: Request) => {
  if (request.nextUrl.pathname.startsWith("/api")) {
    // For any call to an API route, check if the request has a valid token, i.e., the token is the same as the one in
    // the .env file. If not, return a 401 error. If the request method is OPTIONS, return early.
    if (request.method === "OPTIONS") return;
    const header = request.headers.get("authorization");
    const token = header?.substring(7) || null;
    if (!header?.startsWith("Bearer ") || token !== ACCESS_TOKEN) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
  }
};
