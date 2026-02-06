import { Hono } from "hono";
import { serveStatic } from "hono/bun";

const app = new Hono();

app.get(
    "*",
    serveStatic({
        root: "./dist",
    }),
);

export default app;
