import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import serverless from "serverless-http";
import { app } from "../../src/app";

// No basePath. We'll normalize the incoming path ourselves.
const handlerFn = serverless(app);

function normalizePathToExpressApiPrefix(path: string) {
  // Netlify invokes function as: /.netlify/functions/api/<splat>
  // Our Express app expects: /api/<splat>
  if (path.startsWith("/.netlify/functions/api")) {
    const rest = path.slice("/.netlify/functions/api".length) || "/";
    return rest.startsWith("/") ? `/api${rest}` : `/api/${rest}`;
  }
  return path;
}

function corsHeaders(origin?: string) {
  const allowed = new Set([
    "https://portal.strategicai.app",
    "https://staging-sar-portal.strategicai.app",
    "http://localhost:5173",
  ]);

  const value = origin && allowed.has(origin) ? origin : "https://portal.strategicai.app";

  return {
    "Access-Control-Allow-Origin": value,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin",
  };
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Explicit CORS preflight handling
  if (event.httpMethod === "OPTIONS") {
    const origin = event.headers?.origin || event.headers?.Origin;
    return {
      statusCode: 204,
      headers: {
        ...corsHeaders(origin),
        "Access-Control-Max-Age": "86400",
      },
      body: "",
    };
  }

  const patchedEvent = {
    ...event,
    path: normalizePathToExpressApiPrefix(event.path || "/"),
  };

  const response = await handlerFn(patchedEvent, context);

  const origin = event.headers?.origin || event.headers?.Origin;

  response.headers = {
    ...(response.headers ?? {}),
    ...corsHeaders(origin),
  };

  return response;
};
