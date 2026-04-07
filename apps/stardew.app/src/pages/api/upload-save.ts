import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

// Shared constant: where the Go watcher's uploaded save is cached on disk
export const UPLOAD_CACHE_PATH = path.join(
  process.env.APPDATA || process.env.HOME || ".",
  "stardew-tracker",
  "upload-cache.xml",
);

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.UPLOAD_MODE !== "1") {
    return res
      .status(404)
      .json({ error: "Upload mode is not enabled. Start the server with --upload-mode." });
  }

  if (req.method !== "POST") {
    return res.status(405).end();
  }

  // HTTP Basic Auth: if UPLOAD_USER is set, validate credentials.
  // nginx validates the same Authorization header and forwards it to the backend.
  const expectedUser = process.env.UPLOAD_USER;
  const expectedPass = process.env.UPLOAD_PASS || "";
  if (expectedUser) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Basic ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const decoded = Buffer.from(auth.slice(6), "base64").toString("utf-8");
    const [user, ...passParts] = decoded.split(":");
    const pass = passParts.join(":");
    if (user !== expectedUser || pass !== expectedPass) {
      return res.status(403).json({ error: "Invalid credentials" });
    }
  }

  const chunks: Buffer[] = [];
  req.on("data", (chunk: Buffer) => chunks.push(chunk));
  req.on("error", (err: Error) =>
    res.status(500).json({ error: `Read error: ${err.message}` }),
  );
  req.on("end", () => {
    const body = Buffer.concat(chunks);
    if (body.length === 0) {
      return res.status(400).json({ error: "Empty body" });
    }

    try {
      const dir = path.dirname(UPLOAD_CACHE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(UPLOAD_CACHE_PATH, body);
      return res.json({ ok: true, size: body.length });
    } catch (err: any) {
      return res.status(500).json({ error: `Write error: ${err.message}` });
    }
  });
}

export const config = {
  api: {
    responseLimit: "50mb",
    bodyParser: false,
  },
};
