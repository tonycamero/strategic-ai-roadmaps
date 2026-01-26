import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import serverless from "serverless-http";
import { app } from "../../src/app";

const handlerFn = serverless(app, {
    basePath: "/.netlify/functions/api",
});

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 204,
            headers: {
                "Access-Control-Allow-Origin": "https://portal.strategicai.app",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
                "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
            },
            body: "",
        };
    }

    const resp = await handlerFn(event, context);

    resp.headers = {
        ...(resp.headers || {}),
        "Access-Control-Allow-Origin": "https://portal.strategicai.app",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    };

    return resp;
};
