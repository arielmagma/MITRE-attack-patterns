import app from "./app.js";
import { loadDatabase } from "./dataLoader.js";

import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 3000;

async function main()
{
    app.listen(PORT, () =>
    {
        console.log(`Server running on http://localhost:${PORT}`);
    });

    console.log("Loading database in the background...");
    await loadDatabase();
}

main().then();