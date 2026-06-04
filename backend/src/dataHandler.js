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

export function filterAttackPatterns(platform, phase, id, name, description, detection)
{
    const db = getDB();
    let query = "SELECT * FROM attack_patterns WHERE 1=1";
    const params = [];

    // Platform Filter
    if (platform?.length)
    {
        const clauses = platform.map(() => "platforms LIKE ?");

        query += ` AND (${clauses.join(" AND ")})`;

        for (const p of platform)
        {
            params.push(`%"${p}"%`);
        }
    }

    // Phase Filter
    if (phase?.length)
    {
        const clauses = phase.map(() => "phases LIKE ?");

        query += ` AND (${clauses.join(" AND ")})`;

        for (const p of phase)
        {
            params.push(`%"${p}"%`);
        }
    }

    // ID Search
    if (id && id.trim() !== "")
    {
        query += " AND id LIKE ?";
        params.push(`%${id.trim()}%`);
    }

    // Name Search
    if (name && name.trim() !== "")
    {
        query += " AND name LIKE ?";
        params.push(`%${name.trim()}%`);
    }

    // Description Search
    if (description && description.trim() !== "")
    {
        query += " AND description LIKE ?";
        params.push(`%${description.trim()}%`);
    }

    // Detection Search
    if (detection && detection.trim() !== "")
    {
        query += " AND detection LIKE ?";
        params.push(`%${detection.trim()}%`);
    }

    const rows = db.prepare(query).all(...params);
    return rows.map(row =>
    ({
        ...row,
        platforms: typeof row.platforms === 'string' ? JSON.parse(row.platforms) : row.platforms
    }));
}

export function normalizeToArray(value)
{
    if (!value) return [];

    if (Array.isArray(value)) return value;

    if (typeof value === "string")
    {
        if (value === "All") return [];

        try
        {
            return JSON.parse(value.replace(/'/g, '"'));
        }
        catch
        {
            return value.split(",").map(v => v.trim()).filter(Boolean);
        }
    }

    return [];
}