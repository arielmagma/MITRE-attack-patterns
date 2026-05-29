import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

// needed for ES modules (__dirname equivalent)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// simple test API
app.get("/api/status", (req, res) => {
    res.json({ ok: true, message: "backend running" });
});

// serve your single HTML file
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend.html"));
});

export default app;