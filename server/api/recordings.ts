import express, { Router } from "express";
import { randomUUID } from "node:crypto";
import { supabase } from "../lib/supabase";
import { uploadToR2 } from "../lib/r2";

const router = Router();

const VIDEO_LIMIT = process.env.RECORDING_UPLOAD_LIMIT ?? "120mb";

function extensionFor(contentType: string) {
  if (contentType.includes("mp4")) return "mp4";
  if (contentType.includes("ogg")) return "ogv";
  return "webm";
}

function cleanSegment(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const cleaned = value.trim().replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 48);
  return cleaned || fallback;
}

function recordingKey(childId: string, contentType: string) {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const ext = extensionFor(contentType);
  return `recordings/${yyyy}/${mm}/${dd}/${Date.now()}-${cleanSegment(childId, "child")}-${randomUUID()}.${ext}`;
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

    const contentType =
      req.header("content-type")?.split(";")[0] || "video/webm";
    const childId = cleanSegment(req.header("x-child-id"), "child");
    const durationMsRaw = Number(req.header("x-duration-ms") ?? 0);
    const durationMs = Number.isFinite(durationMsRaw)
      ? Math.max(0, Math.round(durationMsRaw))
      : 0;
    const key = recordingKey(childId, contentType);

    try {
      const r2 = await uploadToR2({ key, body, contentType });
      const { data, error } = await supabase
        .from("student_recordings")
        .insert({
          child_id: childId,
          r2_bucket: r2.bucket,
          r2_key: r2.key,
          r2_url: r2.url,
          content_type: contentType,
          size_bytes: body.length,
          duration_ms: durationMs,
          etag: r2.etag,
        })
        .select("id, r2_key, r2_url")
        .single();

      if (error) {
        res.status(500).json({
          error: error.message,
          r2Key: r2.key,
        });
        return;
      }

      res.json({
        ok: true,
        id: data.id,
        r2Key: data.r2_key,
        url: data.r2_url,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
);

export default router;
