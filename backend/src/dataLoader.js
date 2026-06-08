import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import * as cheerio from "cheerio";
import fetch from "node-fetch";
import Database from "better-sqlite3";
import pLimit from "p-limit";

const db = new Database(path.resolve(process.cwd(), "../attack.db"));
const limit = pLimit(15);
const attack_directory = "../attack-patterns"

export function getDB()
{
    return db;
}

export async function loadDatabase()
{
    let totalFiles = 0;
    let processedFiles = 0;

    // Reload data again from 0 every time the server starts up again in case of change in files or attack patterns
    db.exec(`
    CREATE TABLE IF NOT EXISTS attack_patterns 
    (
        id TEXT PRIMARY KEY,
        name TEXT,
        description TEXT,
        detection TEXT,
        platforms TEXT,
        phases TEXT
    );
    `);

    const insertMany = createInsertMany(db);
    const files = await readdir(attack_directory);
    totalFiles = files.length;

    await Promise.all(
        files.map(async (file) =>
        {
            try
            {
                const items = await readAttackPatternFile(file);

                insertMany(items);
                processedFiles++;
                process.stdout.write(`\rFiles Loaded: ${processedFiles}/${totalFiles} (${((processedFiles / totalFiles) * 100).toFixed(1)}%)`);
            } catch (err)
            {
                console.error("Error loading file:", file, err);
            }
        })
    );

    process.stdout.write(`\nDone Loading Database.\n`);
}

function createInsertMany(db)
{
    const insert = db.prepare
    (`
        INSERT OR REPLACE INTO attack_patterns
        (id, name, description, detection, platforms, phases)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    return db.transaction((items) =>
    {
        for (const item of items) {
            insert.run(
                item.id,
                item.name,
                item.description,
                item.x_mitre_detection,
                JSON.stringify(item.x_mitre_platforms),
                JSON.stringify(item.phase_name)
            );
        }
    });
}

async function readAttackPatternFile(fileName)
{
    const filePath = path.resolve(attack_directory, fileName);

    const data = await readFile(filePath, "utf8");
    return getNeededData(JSON.parse(data));
}

async function getNeededData(data) {
    const objects = data.objects.filter(item => item.type === "attack-pattern");

    const results = await Promise.all(
        objects.map(item =>
            limit(async () => {
                const mitreRef = item.external_references?.find(
                    ref => ref.source_name === "mitre-attack"
                );

                return {
                    name: item.name,
                    description: item.description,
                    id: mitreRef.external_id ?? "NA",
                    x_mitre_detection: mitreRef?.url
                        ? await getDetection(mitreRef.url)
                        : "NA",
                    x_mitre_platforms: item.x_mitre_platforms ?? [],
                    phase_name: item.kill_chain_phases?.map(p => p.phase_name) ?? []
                };
            })
        )
    );

    return results;
}

export async function getDetection(url, depth = 0)
{
    if (!url) return "NA";

    if (depth > 3) return "NA";

    const res = await fetch(url);
    const html = await res.text();

    const $ = cheerio.load(html);

    const metaRedirect = $('meta[http-equiv="refresh"]').attr("content");

    if (metaRedirect)
    {
        const match = metaRedirect.match(/url=(.*)/i);

        if (match && match[1])
        {
            let newUrl = match[1].trim();

            if (newUrl.startsWith("/"))
            {
                const base = new URL(url).origin;
                newUrl = base + newUrl;
            }

            return getDetection(newUrl, depth + 1);
        }
    }

    const detections = [];

    $("tr.detection_strategy").each((_, row) =>
    {
        const text = $(row)
            .find("td:last-child p")
            .text()
            .trim();

        if (text)
        {
            detections.push(text);
        }
    });

    return detections.length ? detections.join(" | ") : "NA";
}