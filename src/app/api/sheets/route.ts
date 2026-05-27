import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const SCRIPT_URL = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;
const API_SECRET = process.env.API_SECRET;

async function proxyToScript(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
    },
  });
  const text = await response.text();
  try {
    return NextResponse.json(JSON.parse(text));
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid response from backend" },
      { status: 502 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const sheetName = searchParams.get("sheet");

  if (!action || !sheetName) {
    return NextResponse.json({ success: false, message: "Missing parameters" }, { status: 400 });
  }

  const url = new URL(SCRIPT_URL!);
  url.searchParams.append("action", action);
  url.searchParams.append("sheet", sheetName);
  url.searchParams.append("x-api-secret", API_SECRET || "");

  return proxyToScript(url.toString());
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  body["x-api-secret"] = API_SECRET || "";

  return proxyToScript(SCRIPT_URL!, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(body),
  });
}
