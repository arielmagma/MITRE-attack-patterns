import dotenv from "dotenv";
dotenv.config();

const BASE = "https://www.virustotal.com/api/v3";

export async function checkUrl(url)
{
    const encoded = Buffer.from(url).toString('base64').replace(/=+$/, '');

    const res = await fetch(`${BASE}/urls/${encoded}`,
    {
        headers: { "x-apikey": process.env.VT_API_KEY }
    });

    const data = await res.json();

    return normalize(data);
}

export async function checkDomain(domain)
{
    const res = await fetch(`${BASE}/domains/${domain}`,
    {
        headers: { "x-apikey": process.env.VT_API_KEY }
    });

    const data = await res.json();

    return normalize(data);
}

export async function checkIP(ip)
{
    const res = await fetch(`${BASE}/ip_addresses/${ip}`,
    {
        headers: { "x-apikey": process.env.VT_API_KEY }
    });

    const data = await res.json();

    return normalize(data);
}

export async function checkFile(hash)
{
    const res = await fetch(`${BASE}/files/${hash}`,
    {
        headers: { "x-apikey": process.env.VT_API_KEY }
    });

    const data = await res.json();

    return normalize(data);
}

function normalize(data)
{
    const stats = data?.data?.attributes?.last_analysis_stats || {};

    return {
        malicious: stats.malicious || 0,
        suspicious: stats.suspicious || 0,
        harmless: stats.harmless || 0,
        undetected: stats.undetected || 0,
        reputation: data?.data?.attributes?.reputation || 0
    };
}