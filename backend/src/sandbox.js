import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import {saveAnalysisJob} from "./dataHandler.js"

const BASE = "https://hybrid-analysis.com/api/v2";

async function uploadToHybridAnalysis(filePath)
{
    try
    {
        const form = new FormData();

        form.append("file", fs.createReadStream(filePath));

        form.append("environment_id", 160);

        const response = await axios.post
        (
            `${BASE}/submit/file`,
            form,
            {
                headers:
                {
                    ...form.getHeaders(),
                    "api-key": process.env.HA_API_KEY,
                    "User-Agent": "Falcon"
                },
                maxBodyLength: Infinity
            }
        );

        return response.data;

    }
    catch (err)
    {

        if (err.response)
        {
            console.error("Hybrid Analysis API Error:");
            console.error(err.response.data);
        }
        else
        {
            console.error(err.message);
        }

        throw err;
    }
}

export async function uploadFile(filePath)
{
    const result = await uploadToHybridAnalysis(filePath);
    saveAnalysisJob({
        jobId: result.job_id,
        filename: path.basename(filePath),
        platform: "Windows",
        status: "Analyzing"
    });

    return result;
}

export async function getSummary(jobId)
{
    const res = await axios.get
    (
        `${BASE}/report/${jobId}/summary`,
        {
            headers:
            {
                "api-key": process.env.HA_API_KEY,
                "User-Agent": "Falcon",
                "Accept": "application/json"
            }
        }
    );

    return res.data;
}

export async function getStatus(jobId)
{
    try {
        const API_URL = `https://www.hybrid-analysis.com/api/v2/report/${jobId}/state`;

        const response = await axios.get(API_URL, {
            headers: {
                'accept': 'application/json',
                'api-key': process.env.HA_API_KEY,
                'user-agent': 'Falcon Sandbox Client'
            }
        });

        const state = response.data.state;

        if (state === "ANALYZING" || state === "IN_PROGRESS" || state === "IN_QUEUE")
            return "Analyzing";
        else if (state === "SUCCESS")
            return "Completed";
        else
            return "Failed";
    }
    catch (error)
    {
        console.error(`Failed to get status for job ${jobId}:`, error.message);
        return 'ERROR';
    }
}

export async function getSandboxReport(jobId)
{
    const summary = await getSummary(jobId);

    if (!summary)
    {
        return { success: false, data: null };
    }

    var data = {};

    data.jobId = jobId;
    data.filename = summary.submit_name || (summary.submissions?.[0]?.filename) || "NA";

    data.metadata = {
        format: summary.type || "Unknown Executable Format",
        size: summary.size ? `${(summary.size / (1024 * 1024)).toFixed(2)} MB` : "0.00 MB",
        sha256: summary.sha256
    };

    data.heuristic = {
        verdictClass: summary.verdict,
        label: summary.verdict ? summary.verdict.toUpperCase() : "NO SPECIFIC THREAT",
        notes: summary.certificates_validation_message || "Analysis finalized without critical runtime metadata warnings."
    };

    data.behaviorLog = [];
    if (summary.signatures && Array.isArray(summary.signatures)) {
        const filteredSigs = summary.signatures.filter(sig => {
            return sig.relevance >= 5 &&
            sig.origin !== "Network Traffic" &&
            sig.name !== "Writes files" &&
            sig.name !== "Dropped files"
        }); // Add only signatures that are not concerning network traffic, file creating or deleting, and that are relevant (relevance > 0)

        filteredSigs.forEach((sig) =>
        {
            let logType = "normal";
            if (sig.threat_level_human === "suspicious" || sig.threat_level === 1) logType = "warning";
            if (sig.threat_level_human === "malicious" || sig.threat_level >= 2) logType = "danger";

            const cleanDesc = sig.description ? sig.description.split('\n')[0] : "Hook interaction observed.";

            data.behaviorLog.push({
                type: logType,
                title: sig.name || "Runtime API Event",
                desc: cleanDesc
            });
        });
    }

    if (data.behaviorLog.length === 0)
    {
        data.behaviorLog.push({
            type: "normal",
            title: "Analysis Session Finalized",
            desc: "Static and dynamic hooks registered no major architectural violations."
        });
    }

    data.networkConnections = [];

    if (summary.signatures && Array.isArray(summary.signatures)) {
        summary.signatures.forEach(sig =>
        {
            if (sig.origin === "Network Traffic")
            {
                const rawDescription = sig.description || "";
                let host = "Unknown Host";

                const ipRegex = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/;
                const ipMatch = rawDescription.match(ipRegex);

                if (ipMatch) {
                    host = ipMatch[1];
                }
                else
                {
                    const domainMatch = rawDescription.match(/"([^"]+)"/);
                    if (domainMatch)
                    {
                        host = domainMatch[1];
                    }
                }

                data.networkConnections.push({
                    target: host,
                    label: sig.name,
                    badgeClass: sig.threat_level_human
                });
            }
        });
    }


    data.fileMutations = [];

    if (summary.signatures && Array.isArray(summary.signatures)) {
        const fileSigs = summary.signatures.filter(sig =>
            sig.name === 'Dropped files' || sig.name === "Writes files"
        );

        fileSigs.forEach(sig =>
        {
            if (!sig.description) return;

            let action = '[*]';
            let badgeClass = "";
            let extractedPath = "";

            if (sig.name === "Writes files") {
                action = '[+]';
                badgeClass = "text-add";
            }
            else if (sig.name === "Dropped files") {
                action = '[-]';
                badgeClass = "text-del";
            }

            const match = sig.description.match(/"([^"]+)"$/);
            if (match) {
                extractedPath = match[1];
            }

            if (extractedPath) { // Check if not name / path of submitted file
                const pathParts = extractedPath.split('\\');
                const fileNameOnly = pathParts[pathParts.length - 1].toLowerCase();

                if (summary.submit_name && fileNameOnly === summary.submit_name) { // if file name is the same as the submitted file exclude it
                    return;
                }
            }

            data.fileMutations.push({
                action: action,
                badgeClass: badgeClass,
                path: extractedPath,
            })
        });
    }


    data.attackPatterns = [];
    if (summary.mitre_attcks && Array.isArray(summary.mitre_attcks))
    {
        summary.mitre_attcks.forEach(attack =>
        {
            if (!data.attackPatterns.some(item => item.id === attack.attck_id)) { // Check if attack pattern not pushed yet (check by id)
                data.attackPatterns.push({
                    id: attack.attck_id,
                    name: attack.technique,
                });
            }
        });
    }

    return data;
}