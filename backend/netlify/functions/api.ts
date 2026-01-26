import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import serverless from "serverless-http";
import { app } from "../../src/app";

const handlerFn = serverless(app, {
  // IMPORTANT: preserve /api prefix all the way into Express
  basePath: "/.netlify/functions/api",
});

export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
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

  const response = await handlerFn(event, context);

  response.headers = {
    ...(response.headers ?? {}),
    "Access-Control-Allow-Origin": "https://portal.strategicai.app",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  };

  return response;
};
