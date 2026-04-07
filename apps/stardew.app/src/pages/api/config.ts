import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

const CONFIG_PATH = path.join(
  process.env.APPDATA || process.env.HOME || ".",
  "stardew-tracker",
  "config.json",
);

interface Config {
  savePath?: string;
}

function readConfig(): Config {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
    }
  } catch {
    // ignore
  }
  return {};
}

function writeConfig(config: Config) {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}


export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const config = readConfig();
    // CLI --save arg passed via env var takes precedence over saved config
    if (process.env.STARDEW_SAVE_PATH) {
      config.savePath = path.resolve(process.env.STARDEW_SAVE_PATH);
    }
    return res.json({ ...config, uploadMode: process.env.UPLOAD_MODE === "1" });
  }

  if (req.method === "POST") {
    const { savePath: rawPath } = req.body;
    if (typeof rawPath !== "string" || !rawPath.trim()) {
      return res.status(400).json({ error: "savePath must be a non-empty string" });
    }

    // Normalize: remove trailing slashes/spaces so path.basename works correctly
    const savePath = path.resolve(rawPath.trim());

    let stat;
    try {
      stat = fs.statSync(savePath);
    } catch {
      return res.status(400).json({ error: `Path does not exist: "${savePath}"` });
    }

    if (!stat.isDirectory()) {
      return res.status(400).json({ error: `Path is not a directory: "${savePath}"` });
    }

    const folderName = path.basename(savePath);
    const saveFile = path.join(savePath, folderName);

    if (!fs.existsSync(saveFile) || !fs.statSync(saveFile).isFile()) {
      return res.status(400).json({
        error: `Save file not found: expected a file named "${folderName}" inside "${savePath}"`,
      });
    }

    const config = readConfig();
    config.savePath = savePath;
    writeConfig(config);
    return res.json(config);
  }

  return res.status(405).end();
}
