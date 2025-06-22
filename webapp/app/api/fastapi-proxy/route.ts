import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🔄 Proxy: Fetching from FastAPI...")

    if (!process.env.NEXT_PUBLIC_FASTAPI_URL) {
      console.log("⚠️ No FastAPI URL configured")
      return NextResponse.json([])
    }

    console.log("📡 Proxy: Making request to:", process.env.NEXT_PUBLIC_FASTAPI_URL)

    const response = await fetch(process.env.NEXT_PUBLIC_FASTAPI_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    console.log("📡 Proxy: FastAPI response status:", response.status)

    if (!response.ok) {
      console.error("❌ Proxy: FastAPI response not ok:", response.status, response.statusText)
      const errorText = await response.text()
      console.error("❌ Proxy: FastAPI error body:", errorText)
      return NextResponse.json([])
    }

    const data = await response.json()
    console.log("✅ Proxy: FastAPI data received:", data.length, "reports")

    return NextResponse.json(data)
  } catch (error) {
    console.error("❌ Proxy: Error fetching from FastAPI:", error)
    return NextResponse.json([])
  }
}
