import app from "./app.js";
import { loadDatabase } from "./getData.js";

const PORT = process.env.PORT || 3000;

async function main()
{
    app.listen(PORT, () =>
    {
        console.log(`Server running on http://localhost:${PORT}`);
    });

    console.log("Loading database in background...");
    await loadDatabase();
}

main();