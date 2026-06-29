# pinequest-s4-e2-team-5
## Environment Variables

The following environment variables are required for the server:

### Existing Variables
- `OPENAI_API_KEY` - OpenAI API key
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_KEY` - Supabase service role key
- `CHIMEGE_TTS_API_KEY` - Chimege TTS API key
- `CHIMEGE_STT_API_KEY` - Chimege STT API key
- `CHIMEGE_TTS_ENDPOINT` - Chimege TTS endpoint (default: https://api.chimege.com/v1.2/synthesize)
- `CHIMEGE_STT_ENDPOINT` - Chimege STT endpoint (default: https://api.chimege.com/v1.2/transcribe)

### Cloudflare R2 Variables (for video storage)
- `R2_ACCOUNT_ID` - Cloudflare account ID
- `R2_ACCESS_KEY_ID` - R2 access key ID
- `R2_SECRET_ACCESS_KEY` - R2 secret access key
- `R2_BUCKET_NAME` - R2 bucket name
- `R2_ENDPOINT` - (Optional) Custom R2 endpoint; if not set, defaults to `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
- `R2_PUBLIC_URL` - (Optional) Public base URL for accessing objects; if set, returned URLs will be `${R2_PUBLIC_URL}/{key}`

## Video Upload Endpoint

POST `/api/upload/video`

Accepts multipart/form-data with a file field named `video`.

Constraints:
- File size limit: 50 MB
- Allowed MIME types: video/mp4, video/webm, video/quicktime, video/x-msvideo, video/x-matroska

Response:
```json
{
  "success": true,
  "url": "https://example.com/bucket/uuid-timestamp.ext",
  "filename": "original-filename.mp4",
  "size": 123456
}
```
