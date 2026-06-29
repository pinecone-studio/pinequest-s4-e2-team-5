import { Router } from "express";
import multer from "multer";
import { r2Storage } from "../lib/storage";

const router = Router();

// Configure multer for memory storage (we'll upload to R2 ourselves)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only video files
    const allowedMimes = [
      "video/mp4",
      "video/webm",
      "video/quicktime", // .mov
      "video/x-msvideo", // .avi
      "video/x-matroska", // .mkv   
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only video files are allowed."));
    }
  },
});

/**
 * @route POST /api/upload/video
 * @desc Upload a video file to Cloudflare R2
 * @access Public (or protect as needed)
 */
router.post(
  "/video",
  upload.single("video"),
  async (req, res) => {
    try {
      // req.file is the uploaded video file
      if (!req.file) {
        return res.status(400).json({ error: "No video file provided" });
      }

      const { buffer, originalname, mimetype } = req.file;

      // Upload to R2
      const url = await r2Storage.uploadFile(
        buffer,
        originalname,
        mimetype
      );

      res.status(200).json({
        success: true,
        url,
        filename: originalname,
        size: buffer.length,
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      // Multer file validation error
      if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
          return res
            .status(400)
            .json({ error: "File size exceeds the limit of 50 MB" });
        }
        return res.status(400).json({ error: error.message });
      }
      // Custom error from file filter
      if (error.message) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
