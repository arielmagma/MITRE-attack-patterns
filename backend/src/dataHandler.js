import {getDB} from "./dataLoader.js";
import {getStatus, getSummary} from "./sandbox.js";

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

export function getAttackPatterns(offset, limit)
{
    const db = getDB();

    const stmt = db.prepare(`
        SELECT *
        FROM attack_patterns
        ORDER BY id
    `);

    const rows = stmt.all();

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
    let query = "SELECT * FROM attack_patterns WHERE 1=1 ";
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

    query += " ORDER BY id";

    const rows = db.prepare(query).all(...params);
    return rows.map(row =>
    ({
        ...row,
        platforms: typeof row.platforms === 'string' ? JSON.parse(row.platforms) : row.platforms
    }));
}

export function saveAnalysisJob({ jobId, filename, platform, status })
{
    const db = getDB();
    const stmt = db.prepare(`
        INSERT OR REPLACE INTO analysis_jobs (job_id, filename, platform, status)
        VALUES (?, ?, ?, ?)
    `);
    return stmt.run(jobId, filename, platform, status || 'Analyzing');
}

export function updateJobStatus(jobId, status, threat)
{
    const db = getDB();
    const stmt = db.prepare(`
        UPDATE analysis_jobs
        SET status = ?, suspicion_level = ?
        WHERE job_id = ?
    `);
    return stmt.run(status, threat, jobId);
}

export async function getAllAnalysisJobs()
{
    await updateStatus(); // Update all pending analysis request before loading

    const db = getDB();
    const stmt = db.prepare(`
        SELECT job_id AS id, filename AS name, platform, status, suspicion_level AS threat_level
        FROM analysis_jobs
        ORDER BY created_at DESC
    `);

    return stmt.all();
}

export function doesJobExist(jobId)
{
    if (!jobId) return false;

    const db = getDB();

    const stmt = db.prepare(`
        SELECT 1
        FROM analysis_jobs
        WHERE job_id = ?
        LIMIT 1
    `);

    const row = stmt.get(jobId);

    return !!row;
}

async function updateStatus()
{
    const db = getDB();
    const stmt = db.prepare(`
        SELECT job_id, status
        FROM analysis_jobs
        WHERE status NOT IN ('Completed', 'Failed')
    `);

    const jobs = stmt.all();

    for (const job of jobs)
    {
        try
        {
            const updatedStatus = await getStatus(job.job_id);

            if (updatedStatus !== job.status && updatedStatus !== "ERROR") // If new status for the job and not just an error
            {
                const summary = await getSummary(job.job_id);
                const updatedThreat = summary?.threat_level;
                updateJobStatus(job.job_id, updatedStatus, updatedThreat);
            }
        }
        catch (err)
        {
            console.error(`[Status Sync Error] Failed to update job ${job.job_id}:`, err.message);
        }
    }
}