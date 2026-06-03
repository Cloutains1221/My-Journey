import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

function getR2Client(): S3Client {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("Missing Cloudflare R2 env vars");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

const BUCKET = process.env.CLOUDFLARE_R2_BUCKET!;
const PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL!;

export async function r2Upload(
  key: string,
  body: Buffer | Blob | File,
  contentType: string,
): Promise<string> {
  const client = getR2Client();
  const upload = new Upload({
    client,
    params: {
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    },
  });
  await upload.done();
  return `${PUBLIC_URL}/${key}`;
}

export async function r2Delete(key: string): Promise<void> {
  const client = getR2Client();
  await client.send(
    new DeleteObjectCommand({ Bucket: BUCKET, Key: key }),
  );
}

export function r2GetKeyFromUrl(url: string): string {
  const prefix = `${PUBLIC_URL}/`;
  if (!url.startsWith(prefix)) {
    throw new Error(`URL ${url} does not match R2 public URL prefix`);
  }
  return url.slice(prefix.length);
}
