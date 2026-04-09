import { NextResponse } from "next/server";

import { getPagePayload } from "@/lib/catalog";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const payload = getPagePayload(slug);

  if (!payload) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      source: "page-cache",
      path: new URL(request.url).pathname,
      payload,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    },
  );
}
