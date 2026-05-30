import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { lookupAdcode } from "@/lib/city-adcodes";
import { dissolveDistricts, buildGeometry } from "@/lib/geo-utils";
import { cookies } from "next/headers";

async function checkAuth() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_token")?.value === "authenticated";
}

/**
 * Fetch and merge all district boundaries for a given adcode from DataV.
 */
async function fetchCityBoundary(adcode: string) {
  const url = `https://geo.datav.aliyun.com/areas_v3/bound/geojson?code=${adcode}_full`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`DataV API returned HTTP ${res.status}`);
  const geo = await res.json();
  const features = geo.features;
  if (!features || features.length === 0) throw new Error("No boundary data found");

  // Dissolve all district features to remove internal boundaries
  const geometry = buildGeometry(dissolveDistricts(features));
  return geometry;
}

export async function POST(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    const body = await request.json();
    let { cityName, adcode } = body;

    if (!cityName) {
      return NextResponse.json({ error: "cityName is required" }, { status: 400 });
    }

    // Resolve adcode if not provided
    if (!adcode) {
      adcode = lookupAdcode(cityName);
      if (!adcode) {
        return NextResponse.json(
          { error: `无法找到城市"${cityName}"的行政区划代码，请手动提供adcode` },
          { status: 400 },
        );
      }
    }

    // Check if already exists
    const { data: existing } = await supabaseAdmin
      .from("city_boundaries")
      .select("name")
      .eq("name", cityName)
      .single();

    if (existing) {
      return NextResponse.json({ message: "已存在", feature: existing });
    }

    // Fetch and merge boundary
    const geometry = await fetchCityBoundary(adcode);

    // Store in Supabase
    const { data, error } = await supabaseAdmin
      .from("city_boundaries")
      .insert({
        name: cityName,
        adcode,
        geojson: geometry,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
      feature: {
        type: "Feature",
        geometry,
        properties: { name: cityName, adcode, dynamic: true },
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
