// 删除 Supabase Storage 中 trip-photos bucket 的所有照片
// 运行: npx tsx scripts/cleanup-supabase-storage.ts
import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

config({ path: resolve(import.meta.dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function main() {
  // 列出所有文件
  const { data: files, error } = await supabase.storage
    .from("trip-photos")
    .list();

  if (error) {
    console.error("列出文件失败:", error.message);
    return;
  }

  if (!files || files.length === 0) {
    console.log("没有文件需要删除。");
    return;
  }

  // 提取所有路径（包含子目录中的文件）
  const paths: string[] = [];

  // list() 只返回顶层，需要递归获取子目录中的文件
  for (const item of files) {
    if (item.id) {
      // 这是一个文件
      paths.push(item.name);
    } else {
      // 这是一个文件夹（trip_id 目录）
      const folderName = item.name;
      const { data: subFiles } = await supabase.storage
        .from("trip-photos")
        .list(folderName);
      if (subFiles) {
        for (const f of subFiles) {
          paths.push(`${folderName}/${f.name}`);
        }
      }
    }
  }

  if (paths.length === 0) {
    console.log("没有文件需要删除。");
    return;
  }

  console.log(`找到 ${paths.length} 个文件，开始删除...`);

  // 分批删除（每批最多 1000 个文件）
  const batchSize = 1000;
  let deleted = 0;

  for (let i = 0; i < paths.length; i += batchSize) {
    const batch = paths.slice(i, i + batchSize);
    const { error: delError } = await supabase.storage
      .from("trip-photos")
      .remove(batch);

    if (delError) {
      console.error(`删除批次 ${i} 失败:`, delError.message);
    } else {
      deleted += batch.length;
      console.log(`  已删除 ${deleted}/${paths.length}`);
    }
  }

  console.log(`\n完成。已删除 ${deleted} 个文件。`);
}

main();
