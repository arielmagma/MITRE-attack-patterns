export async function getAttackPatternById(id)
{
    const res = await fetch(`http://localhost:3000/api/attack/${id}`);

    return res.json();
}

export async function getLimitedAttackPatterns(loaded, limit) 
{
    try 
    {
        const res = await fetch(`http://localhost:3000/api/attacks?loaded=${loaded}&limit=${limit}`);
        
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