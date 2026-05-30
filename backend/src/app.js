import path from "node:path";
import express from "express";
import cors from "cors";
import ollama from "ollama";
import { fileURLToPath } from "node:url";
import {getAmountOfAttackPatterns, getAttackPatternById, getLimitedAttackPatterns, filterAttackPatterns} from "./dataHandler.js";

const app = express();
app.use(cors());
app.use(express.json());


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
                                enum: ['Windows', 'IaaS', 'Linux', 'macOS', 'SaaS', 'Network Devices', 'PRE', 'Containers', 'ESXi', "Identity Provider", 'Office Suite', 'Office 365', 'All']
                        },
                        phase:
                        {
                                type: 'array',
                                description: 'Filter attack patterns by tactical execution phase.',
                                enum: ['stealth', 'privilege-escalation', 'defense-impairment', 'lateral-movement', 'credential-access', 'collection', 'resource-development', 'persistence', 'command-and-control', 'discovery', 'execution', 'reconnaissance', 'impact', 'initial-access', 'exfiltration', '']
                        },
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

app.post('/api/chat', async (req, res) =>
{
    const { messages } = req.body;

    try {
        let response = await ollama.chat
        ({
            model: 'cyber-bot',
            messages: messages,
            tools: [webFilterTool]
        });

        let botMessage = response.message;

        if (botMessage.tool_calls && botMessage.tool_calls.length > 0)
        {
            const toolCall = botMessage.tool_calls[0];

            if (toolCall.function.name === 'setWebsiteFilters')
            {
                const args = toolCall.function.arguments;

                const finalArgs =
                {
                    platform: args.platform ?? [],
                    phase: args.phase ?? [],
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

export default app;