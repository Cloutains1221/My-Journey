import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(".env.local") });

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!, secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY! },
});

async function main() {
  let totalSize = 0, totalCount = 0;
  let token: string | undefined;
  do {
    const cmd = new ListObjectsV2Command({ Bucket: process.env.CLOUDFLARE_R2_BUCKET!, ContinuationToken: token });
    const res = await r2.send(cmd);
    for (const obj of res.Contents || []) { totalSize += obj.Size!; totalCount++; }
    token = res.NextContinuationToken;
  } while (token);
  console.log(`Objects: ${totalCount}, Size: ${(totalSize / 1024 / 1024).toFixed(1)} MB`);
}
main();
