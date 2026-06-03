// 将 trips 表中旧的 Supabase Storage cover_image URL 替换为 R2 URL
// 运行: npx tsx scripts/fix-cover-images.ts
import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

config({ path: resolve(import.meta.dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL || "";

async function main() {
  const { data: trips, error } = await supabase.from("trips").select("id, title, cover_image");

  if (error) {
    console.error("查询失败:", error.message);
    return;
  }

  if (!trips || trips.length === 0) {
    console.log("没有旅程数据。");
    return;
  }

  let updated = 0;
  let skipped = 0;

  for (const trip of trips) {
    const oldUrl = trip.cover_image;
    if (!oldUrl) {
      console.log(`SKIP (no cover): ${trip.title}`);
      skipped++;
      continue;
    }

    if (oldUrl.includes("r2.dev")) {
      console.log(`SKIP (already R2): ${trip.title}`);
      skipped++;
      continue;
    }

    // 从旧 Supabase URL 提取 path: /storage/v1/object/public/trip-photos/{tripId}/{filename}
    const match = oldUrl.match(/\/trip-photos\/(.+)$/);
    if (!match) {
      console.log(`SKIP (unknown format): ${trip.title} → ${oldUrl.substring(0, 60)}`);
      skipped++;
      continue;
    }

    const path = match[1];
    const newUrl = `${R2_PUBLIC_URL}/${path}`;

    const { error: updateError } = await supabase
      .from("trips")
      .update({ cover_image: newUrl })
      .eq("id", trip.id);

    if (updateError) {
      console.log(`FAIL: ${trip.title} — ${updateError.message}`);
    } else {
      console.log(`OK: ${trip.title}`);
      updated++;
    }
  }

  console.log(`\n完成。更新: ${updated}, 跳过: ${skipped}`);
}

main();
