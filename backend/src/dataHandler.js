import Database from "better-sqlite3";
import {getDB} from "./dataLoader.js";

export function getAttackPatternById(id)
{
    const db = getDB();

    const stmt = db.prepare(`
        SELECT *
        FROM attack_patterns
        WHERE id = ?
    `);

    const row = stmt.get(id);

    if (!row)
    {
        return null;
    }

    return {
        ...row,
        platforms: row.platforms ? JSON.parse(row.platforms) : []
    };
}

export function getLimitedAttackPatterns(offset, limit)
{
    const db = getDB();

    const stmt = db.prepare(`
        SELECT *
        FROM attack_patterns 
        LIMIT ? OFFSET ?
    `);

    const rows = stmt.all(limit, offset);

    return rows.map(row =>
    ({
        ...row,
        platforms: typeof row.platforms === 'string' ? JSON.parse(row.platforms) : row.platforms
    }));
}

export function getAmountOfAttackPatterns()
{
    const db = getDB();

    const row = db.prepare("SELECT COUNT(*) as total FROM attack_patterns").get();
    return row ? row.total : 0;
}