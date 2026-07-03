// Spawns the built server over stdio, lists tools, and exercises a couple of reads.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({ command: "node", args: ["dist/index.js"] });
const client = new Client({ name: "smoke", version: "1.0.0" });
await client.connect(transport);

const { tools } = await client.listTools();
console.log("TOOLS:", tools.map((t) => t.name).join(", "));

const search = await client.callTool({ name: "search_jobs", arguments: { limit: 3 } });
console.log("\n--- search_jobs(limit:3) ---\n" + search.content[0].text);

const profile = await client.callTool({ name: "get_my_profile", arguments: {} });
console.log("\n--- get_my_profile ---\n" + profile.content[0].text);

await client.close();
process.exit(0);
