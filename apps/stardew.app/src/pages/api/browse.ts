import fs from "fs";
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).end();
  }

  const savePath = req.query.path;
  if (typeof savePath !== "string") {
    return res.status(400).json({ error: "path query parameter required" });
  }

  if (!fs.existsSync(savePath)) {
    return res.status(404).json({ error: "Path does not exist" });
  }

  const stat = fs.statSync(savePath);

  if (stat.isFile()) {
    // If it's a file, check if it looks like a save file (no extension)
    return res.json({ type: "file", valid: true });
  }

  if (stat.isDirectory()) {
    // List subdirectories and files that could be save files
    const entries = fs.readdirSync(savePath, { withFileTypes: true });
    const items = entries
      .map((entry) => ({
        name: entry.name,
        isDirectory: entry.isDirectory(),
        path: `${savePath}\\${entry.name}`,
      }))
      .filter((item) => {
        if (item.isDirectory) return true;
        // Save files typically have no extension
        return !item.name.includes(".");
      });
    return res.json({ type: "directory", items });
  }

  return res.status(400).json({ error: "Invalid path" });
}
