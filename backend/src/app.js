import path from "node:path";
import multer from "multer";
import fs from "fs";
import express from "express";
import cors from "cors";
import ollama from "ollama";
import { fileURLToPath } from "node:url";
import {getAmountOfAttackPatterns, getAttackPatternById, getAttackPatterns, filterAttackPatterns, getAllAnalysisJobs } from "./dataHandler.js";
import { checkUrl, checkDomain, checkIP, checkFile } from "./virusTotal.js";
import { getSandboxReport, uploadFile } from "./sandbox.js";


const app = express();
app.use(cors());
app.use(express.json());


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
    destination: (req, file, cb) =>
    {
        cb(null, "uploads/");
    },

    filename: (req, file, cb) =>
    {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage });

const webFilterTool =
    {
        type: 'function',
        function: {
            name: 'setWebsiteFilters',
            description: 'Updates one or more UI search and view filters simultaneously on the security dashboard based on conversational constraints.',
            parameters:
            {
                type: 'object',
                properties:
                    {
                        platform:
                        {
                            type: 'array',
                            description: 'Filter attack patterns by operating system.',
                            items:
                            {
                                enum: ['Windows', 'IaaS', 'Linux', 'macOS', 'SaaS', 'Network Devices', 'PRE', 'Containers', 'ESXi', "Identity Provider", 'Office Suite', 'Office 365', '']
                            }                        },
                        phase:
                        {
                            type: 'array',
                            description: 'Filter attack patterns by tactical execution phase.',
                            items:
                            {
                                enum: ['stealth', 'privilege-escalation', 'defense-impairment', 'lateral-movement', 'credential-access', 'collection', 'resource-development', 'persistence', 'command-and-control', 'discovery', 'execution', 'reconnaissance', 'impact', 'initial-access', 'exfiltration', '']
                            }                        },
                        id:
                        {
                            type: 'string',
                            description: 'Filter specifically by a precise MITRE ATT&CK technique ID (e.g., "attack-pattern--0042a9f5-f053-4769-b3ef-9ad018dfa298", "attack-pattern--035bb001-ab69-4a0b-9f6c-2de8b09e1b9d", ...).'
                        },
                        name:
                        {
                            type: 'string',
                            description: 'Search for keywords exclusively within the name of the attack pattern.'
                        },
                        description:
                        {
                            type: 'string',
                            description: 'Search for keywords exclusively within the text description of the attack pattern.'
                        },
                        detection:
                        {
                            type: 'string',
                            description: 'Search for keywords exclusively within the detection notes.'
                        }
                    }
            }
        }
    };

const virusTotalTool =
    {
        type: 'function',
        function:
            {
                name: 'checkVirusTotal',
                description: 'Query VirusTotal for files, URLs, domains, or IP addresses',

                parameters:
                    {
                        type: 'object',
                        properties:
                            {
                                type:
                                    {
                                        type: 'string',
                                        enum: ['file', 'url', 'domain', 'ip'],
                                        description: 'Type of indicator'
                                    },

                                value:
                                    {
                                        type: 'string',
                                        description: 'Hash, URL, domain or IP'
                                    }
                            },
                        required: ['type', 'value']
                    }
            }
    };

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

app.get("/api/attacks", (req, res) =>
{

    const patterns = getAttackPatterns();

    return res.json(
    {
        success: true,
        data: patterns
    });
});

app.get("/api/attacks/total", (req, res) =>
{
    return res.json({
        success: true,
        total: getAmountOfAttackPatterns(),
    });
});


app.get("/api/analysis/jobs", async (req, res) => {
    try {
        const jobs = await getAllAnalysisJobs();
        return res.json({
            success: true,
            data: jobs
        });
    } catch (error) {
        console.error("Failed to retrieve analysis queue entries:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server database error fetching jobs queue list."
        });
    }
});

app.get("/api/analysis/jobs/:job_id", async (req, res) =>
{
    const {job_id} = req.params;

    try {
        const report = await getSandboxReport(job_id);
        return res.json({
            success: true,
            data: report
        });
    } catch (error) {
        console.error("Failed to retrieve analysis queue entries:", error);
        return res.status(500).json({
            success: false,
            error: "Error fetching file analysis report."
        });
    }
});

app.post('/api/chat', async (req, res) =>
{
    const { messages } = req.body;

    try {
        let response = await ollama.chat
        ({
            model: 'cyber-bot',
            messages: messages,
            tools: [webFilterTool, virusTotalTool]
        });

        let botMessage = response.message;

        if (botMessage.tool_calls && botMessage.tool_calls.length > 0)
        {
            const toolCall = botMessage.tool_calls[0];

            if (toolCall.function.name === 'setWebsiteFilters')
            {
                const args =
                    typeof toolCall.function.arguments === "string"
                        ? JSON.parse(toolCall.function.arguments)
                        : toolCall.function.arguments;

                const finalArgs =
                {
                    platform: safeParse(args.platform),
                    phase: safeParse(args.phase),
                    id: args.id ?? '',
                    name: args.name ?? '',
                    description: args.description ?? '',
                    detection: args.detection ?? ''
                };

                const matchedPatterns = filterAttackPatterns
                (
                    finalArgs.platform,
                    finalArgs.phase,
                    finalArgs.id,
                    finalArgs.name,
                    finalArgs.description,
                    finalArgs.detection
                );

                messages.push(botMessage);
                messages.push
                ({
                    role: 'user',
                    content: `TOOL_RESPONSE: {"status":"success","count":${matchedPatterns.length}}`
                });

                const finalResponse = await ollama.chat
                ({
                    model: 'cyber-bot',
                    messages: messages
                });

                return res.json
                ({
                    type: 'filter_action',
                    filters: finalArgs,
                    data: matchedPatterns,
                    message: finalResponse.message.content
                });
            }

            if (toolCall.function.name === 'checkVirusTotal')
            {
                const args =
                    typeof toolCall.function.arguments === 'string'
                        ? JSON.parse(toolCall.function.arguments)
                        : toolCall.function.arguments;

                let result;

                switch (args.type)
                {
                    case 'file':
                        result = await checkFile(args.value);
                        break;

                    case 'url':
                        result = await checkUrl(args.value);
                        break;

                    case 'domain':
                        result = await checkDomain(args.value);
                        break;

                    case 'ip':
                        result = await checkIP(args.value);
                        break;
                }

                messages.push(botMessage);
                messages.push
                ({
                    role: 'user',
                    content: `TOOL_RESPONSE: ${JSON.stringify(result)}`
                });

                const finalResponse = await ollama.chat
                ({
                    model: 'cyber-bot',
                    messages
                });

                return res.json
                ({
                    type: 'virustotal',
                    data: result,
                    message: finalResponse.message.content
                });
            }
        }

        return res.json
        ({
            type: 'text',
            message: botMessage.content
        });

    }
    catch (error)
    {
        console.error("Backend Chat Error:", error);
        res.status(500).json({ error: "Ollama communication failure" });
    }
});

app.post("/api/analysis/upload", upload.single("file"), async (req, res) =>
{
    const filePath = req.file?.path;
    const originalName = req.file?.originalname;

    try
    {
        const result = await uploadFile(filePath);
        return res.json({
            success: true,
            data: result
        });
    }
    catch (err)
    {
        console.error(err);

        return res.status(500).json({
            success: false,
            error: "Upload failed"
        });
    }
    finally
    {
        if (filePath)
        {
            fs.unlink(filePath, () => {});
        }
    }
});

const safeParse = (value) =>
{
    if (value == null) return [];

    if (Array.isArray(value)) return value;

    if (typeof value === "string")
    {
        try
        {
            const parsed = JSON.parse(value);

            if (Array.isArray(parsed)) return parsed;

            return [parsed];
        }
        catch
        {
            return [value];
        }
    }

    return [value];
};

export default app;