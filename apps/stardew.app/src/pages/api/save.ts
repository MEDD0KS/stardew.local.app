import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";
import { UPLOAD_CACHE_PATH } from "./upload-save";

const CONFIG_PATH = path.join(
  process.env.APPDATA || process.env.HOME || ".",
  "stardew-tracker",
  "config.json",
);

function getSavePath(): string | null {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
      if (!config.savePath) return null;
      // savePath is a folder; save file has the same name as the folder
      const folderName = path.basename(config.savePath);
      return path.join(config.savePath, folderName);
    }
  } catch {
    // ignore
  }
  return null;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).end();
  }

  const isUploadMode = process.env.UPLOAD_MODE === "1";

  let filePath: string;
  if (isUploadMode) {
    if (!fs.existsSync(UPLOAD_CACHE_PATH)) {
      return res.status(404).json({
        error: "No save received yet. Start the Go watcher to push a save file.",
      });
    }
    filePath = UPLOAD_CACHE_PATH;
  } else {
    const resolved = getSavePath();
    if (!resolved) {
      return res.status(404).json({ error: "No save file path configured" });
    }
    if (!fs.existsSync(resolved)) {
      return res.status(404).json({ error: "Save file not found at configured path" });
    }
    filePath = resolved;
  }

  try {
    const stat = fs.statSync(filePath);
    const lastModified = stat.mtimeMs;

    const clientTimestamp = req.headers["x-last-modified"];
    if (clientTimestamp && parseFloat(clientTimestamp as string) >= lastModified) {
      return res.status(304).json({ changed: false });
    }

    let xml: string;
    const fd = fs.openSync(filePath, "r");
    try {
      const buffer = new Uint8Array(stat.size);
      fs.readSync(fd, buffer, 0, stat.size, 0);
      xml = Buffer.from(buffer).toString("utf-8");
    } finally {
      fs.closeSync(fd);
    }

    return res.json({
      xml,
      lastModified,
      fileName: path.basename(filePath),
    });
  } catch (err: any) {
    return res.status(500).json({ error: `Failed to read save file: ${err.message}` });
  }
}

export const config = {
  api: {
    responseLimit: "50mb",
    bodyParser: false,
  },
};
