import express, { Router } from "express";
import { uploadToR2, fetchFromR2, listFromR2 } from "../lib/r2";

const router = Router();

const VIDEO_LIMIT = process.env.RECORDING_UPLOAD_LIMIT ?? "120mb";

function extensionFor(contentType: string) {
  if (contentType.includes("mp4")) return "mp4";
  if (contentType.includes("ogg")) return "ogv";
  return "webm";
}

router.post(
  "/",
  express.raw({
    type: ["video/*", "application/octet-stream"],
    limit: VIDEO_LIMIT,
  }),
  async (req, res) => {
    const body = req.body as Buffer | undefined;
    if (!body?.length) {
      res.status(400).json({ error: "recording video required" });
      return;
    }

    const ct = req.header("content-type")?.split(";")[0] || "video/webm";
    const family = (req.header("x-child-id") || "unknown")
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 16);
    const durRaw = Number(req.header("x-duration-ms") ?? 0);
    const dur = Number.isFinite(durRaw) ? Math.max(0, Math.round(durRaw)) : 0;
    const key = `recordings/${family}/${Date.now()}-${dur}.${extensionFor(ct)}`;

    try {
      await uploadToR2({ key, body, contentType: ct });
      res.json({ ok: true, key });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },
);

router.get("/", async (req, res) => {
  const family =
    typeof req.query.family === "string"
      ? req.query.family.replace(/[^a-zA-Z0-9]/g, "").slice(0, 16)
      : "";
  if (!family) {
    res.json({ recordings: [] });
    return;
  }
  try {
    const files = await listFromR2(`recordings/${family}/`);
    const recordings = files
      .map((f) => {
        const name = f.key.split("/").pop() ?? "";
        const m = name.match(/^(\d+)-(\d+)\./);
        return {
          id: f.key,
          child_id: family,
          content_type: name.endsWith(".mp4") ? "video/mp4" : "video/webm",
          size_bytes: f.size,
          duration_ms: m ? Number(m[2]) : 0,
          created_at: m
            ? new Date(Number(m[1])).toISOString()
            : f.lastModified,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    res.json({ recordings });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/stream", async (req, res) => {
  const path = typeof req.query.path === "string" ? req.query.path : "";
  if (!path.startsWith("recordings/")) {
    res.status(400).end();
    return;
  }
  try {
    const r2Res = await fetchFromR2(path);
    if (!r2Res.ok) {
      res.status(502).end();
      return;
    }
    res.set(
      "Content-Type",
      path.endsWith(".mp4") ? "video/mp4" : "video/webm",
    );
    res.set("Accept-Ranges", "none");
    res.set("Cache-Control", "no-store");
    const reader = r2Res.body!.getReader();
    const pump = async (): Promise<void> => {
      const { done, value } = await reader.read();
      if (done) { res.end(); return; }
      res.write(Buffer.from(value));
      return pump();
    };
    await pump().catch(() => res.end());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
