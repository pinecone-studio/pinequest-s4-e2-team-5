import { createHash, createHmac } from "node:crypto";

type R2UploadInput = {
  key: string;
  body: Buffer;
  contentType: string;
};

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicBaseUrl: string;
};

function getR2Config(): R2Config {
  const accountId = process.env.R2_ACCOUNT_ID ?? "";
  const accessKeyId = process.env.R2_ACCESS_KEY_ID ?? "";
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY ?? "";
  const bucketName = process.env.R2_BUCKET_NAME ?? "";
  const publicBaseUrl =
    process.env.R2_PUBLIC_BASE_URL ?? process.env.R2_PUBLIC_URL ?? "";

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error(
      "R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME шаардлагатай",
    );
  }

  return { accountId, accessKeyId, secretAccessKey, bucketName, publicBaseUrl };
}

function sha256Hex(value: Buffer | string) {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value).digest();
}

function hmacHex(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value).digest("hex");
}

function toAmzDate(date: Date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function encodeKey(key: string) {
  return key
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function getSigningKey(secretAccessKey: string, dateStamp: string) {
  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, "auto");
  const kService = hmac(kRegion, "s3");
  return hmac(kService, "aws4_request");
}

export async function fetchFromR2(key: string): Promise<Response> {
  const config = getR2Config();
  const now = new Date();
  const amzDate = toAmzDate(now);
  const dateStamp = amzDate.slice(0, 8);
  const host = `${config.accountId}.r2.cloudflarestorage.com`;
  const bucketKeyPath = `/${config.bucketName}/${encodeKey(key)}`;
  const emptyHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${emptyHash}\nx-amz-date:${amzDate}\n`;
  const canonicalRequest = ["GET", bucketKeyPath, "", canonicalHeaders, signedHeaders, emptyHash].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, sha256Hex(canonicalRequest)].join("\n");
  const signature = hmacHex(getSigningKey(config.secretAccessKey, dateStamp), stringToSign);
  return fetch(`https://${host}${bucketKeyPath}`, {
    headers: {
      Authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
      "x-amz-content-sha256": emptyHash,
      "x-amz-date": amzDate,
    },
  });
}

export async function listFromR2(prefix: string): Promise<Array<{ key: string; size: number; lastModified: string }>> {
  const config = getR2Config();
  const now = new Date();
  const amzDate = toAmzDate(now);
  const dateStamp = amzDate.slice(0, 8);
  const host = `${config.accountId}.r2.cloudflarestorage.com`;
  const bucketPath = `/${config.bucketName}`;
  // Params sorted alphabetically: list-type < max-keys < prefix ✓
  const canonicalQS = `list-type=2&max-keys=30&prefix=${encodeURIComponent(prefix)}`;
  const emptyHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${emptyHash}\nx-amz-date:${amzDate}\n`;
  const canonicalRequest = ["GET", bucketPath, canonicalQS, canonicalHeaders, signedHeaders, emptyHash].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, sha256Hex(canonicalRequest)].join("\n");
  const signature = hmacHex(getSigningKey(config.secretAccessKey, dateStamp), stringToSign);
  const resp = await fetch(`https://${host}${bucketPath}?${canonicalQS}`, {
    headers: {
      Authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
      "x-amz-content-sha256": emptyHash,
      "x-amz-date": amzDate,
    },
  });
  if (!resp.ok) return [];
  const xml = await resp.text();
  return (xml.match(/<Contents>([\s\S]*?)<\/Contents>/g) ?? []).map((b) => ({
    key: b.match(/<Key>(.*?)<\/Key>/)?.[1] ?? "",
    size: Number(b.match(/<Size>(.*?)<\/Size>/)?.[1] ?? 0),
    lastModified: b.match(/<LastModified>(.*?)<\/LastModified>/)?.[1] ?? "",
  })).filter((f) => f.key);
}

export async function uploadToR2({ key, body, contentType }: R2UploadInput) {
  const config = getR2Config();
  const now = new Date();
  const amzDate = toAmzDate(now);
  const dateStamp = amzDate.slice(0, 8);
  const host = `${config.accountId}.r2.cloudflarestorage.com`;
  const bucketKeyPath = `/${config.bucketName}/${encodeKey(key)}`;
  const url = `https://${host}${bucketKeyPath}`;
  const payloadHash = sha256Hex(body);
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";

  const canonicalHeaders =
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;

  const canonicalRequest = [
    "PUT",
    bucketKeyPath,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const signature = hmacHex(
    getSigningKey(config.secretAccessKey, dateStamp),
    stringToSign,
  );

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization:
        `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, ` +
        `SignedHeaders=${signedHeaders}, Signature=${signature}`,
      "Content-Type": contentType,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
    },
    body,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(`R2 upload failed (${response.status}): ${message}`);
  }

  const publicUrl = config.publicBaseUrl
    ? `${config.publicBaseUrl.replace(/\/$/, "")}/${encodeKey(key)}`
    : null;

  return {
    key,
    bucket: config.bucketName,
    url: publicUrl,
    etag: response.headers.get("etag"),
  };
}
