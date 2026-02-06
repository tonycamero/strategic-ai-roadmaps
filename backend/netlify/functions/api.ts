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

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Explicit CORS preflight handling
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "https://portal.strategicai.app",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
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

  response.headers = {
    ...(response.headers ?? {}),
    "Access-Control-Allow-Origin": "https://portal.strategicai.app",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  };

  return response;
};
