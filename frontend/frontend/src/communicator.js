export async function getAttackPatternById(id)
{
    const res = await fetch(`http://localhost:3000/api/attack/${id}`);

    return res.json();
}

export async function getAttackPatterns() 
{
    try 
    {
        const res = await fetch(`http://localhost:3000/api/attacks`);
        
        if (!res.ok) 
        {
            throw new Error(`Server responded with status: ${res.status}`);
        }

        return await res.json();
    } 
    catch (error) 
    {
        console.error("Failed to fetch paginated attack patterns:", error);
        return { success: false, data: [], hasMore: false };
    }
}

export async function getTotalAttackPatterns()
{
    const res = await fetch("http://localhost:3000/api/attacks/total");
    const { total } = await res.json();
    return total;
}

export async function askFilterAssistant(history) 
{
    try {
        const res = await fetch("http://localhost:3000/api/chat", 
        {
            method: "POST",
            headers: 
            {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ messages: history }) 
        });
        
        const response = await res.json();
        return response;
    }
    catch (error) 
    {
        console.error("Failed to get filter response:", error);
    
        return { 
            type: "text", 
            message: "Sorry, I encountered an error. Please try again." 
        };
    }
}

export async function getAnalysisJobs()
{
    try 
    {
        const res = await fetch("http://localhost:3000/api/analysis/jobs");
        return await res.json();
    }
    catch (error) 
    {
        console.error("Failed to get analysis jobs:", error);
        return { success: false, data: [] };
    }
}

export async function getAnalysisDetails(jobId) 
{
    try
    {
        const res = await fetch(`http://localhost:3000/api/analysis/jobs/${jobId}`);
        const parsedData = await res.json();
        return parsedData;
    }
    catch (error)
    {
        console.error(`Failed to get analysis details for job ${jobId}:`, error);
        return { success: false, data: null };
    }
}

export const uploadFileForAnalysis = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('http://localhost:3000/api/analysis/upload', {
        method: 'POST',
        body: formData,
    });

    const text = await response.text();
    if (!text) {
        return { success: true, data: null };
    }

    try {
        return JSON.parse(text);
    } catch (e) {
        throw new Error("Invalid JSON response from server");
    }
};