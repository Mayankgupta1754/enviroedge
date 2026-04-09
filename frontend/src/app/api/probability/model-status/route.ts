import { NextResponse } from "next/server";

const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || "http://localhost:4000";

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/api/probability/model-status`, {
      cache: "no-store",
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Proxy error" },
      { status: 500 }
    );
  }
}
