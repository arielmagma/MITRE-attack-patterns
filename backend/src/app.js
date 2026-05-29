import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import {getAmountOfAttackPatterns, getAttackPatternById, getLimitedAttackPatterns} from "./dataHandler.js";

const app = express();
app.use(cors());
app.use(express.json());


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get("/api/attack/:id", (req, res) =>
{
    const { id } = req.params;

    const pattern = getAttackPatternById(id);

    if (!pattern)
    {
        return res.status(404).json({success: false, message: "Attack pattern not found"});
    }

    res.json({success: true, data: pattern});
});

app.get("/api/attacks", (req, res) => {
    const loaded = parseInt(req.query.loaded) || 0;
    const limit = parseInt(req.query.limit) || 30;

    // ask for one extra row to detect "hasMore"
    const patterns = getLimitedAttackPatterns(loaded, limit);

    let totalPatterns = getAmountOfAttackPatterns();
    let hasMore = (loaded + patterns.length) < totalPatterns;

    return res.json({
        success: true,
        data: patterns,
        hasMore: hasMore,
        total: totalPatterns
    });
});

app.get("/api/attacks/total", (req, res) =>
{
    return res.json({
        success: true,
        total: getAmountOfAttackPatterns(),
    });
});

export default app;