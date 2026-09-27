import { createServer } from "node:http";
import handler from "./server.js";

const server = createServer(async (request, response) => {
  try {
    const protocol = request.headers["x-forwarded-proto"] ?? "https";
    const host = request.headers.host ?? "localhost:3000";
    const url = new URL(request.url ?? "/", `${protocol}://${host}`);
    const method = request.method ?? "GET";
    const body = method === "GET" || method === "HEAD" ? undefined : request;
    const fetchRequest = new Request(url, {
      method,
      headers: request.headers,
      body,
      duplex: body ? "half" : undefined,
    });
    const fetchResponse = await handler.fetch(fetchRequest, {}, {});

    response.statusCode = fetchResponse.status;
    fetchResponse.headers.forEach((value, key) => response.setHeader(key, value));
    response.end(Buffer.from(await fetchResponse.arrayBuffer()));
  } catch (error) {
    console.error(error);
    response.statusCode = 500;
    response.end("Internal server error");
  }
});

server.listen(3000, "0.0.0.0");
