import { popFor, pushToRoom } from "@/server/signalStore";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const { searchParams } = new URL(req.url);
  const forSide = searchParams.get("for");
  if (forSide !== "a" && forSide !== "b") {
    return new Response(JSON.stringify({ error: "Missing or invalid 'for' query (a|b)" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  const items = popFor(roomId, forSide);
  return new Response(JSON.stringify(items), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const body = await req.json().catch(() => null);
  if (!body) {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  const { from, type, data } = body as { from: "a" | "b"; type: "offer" | "answer" | "candidate"; data: any };
  if (from !== "a" && from !== "b") {
    return new Response(JSON.stringify({ error: "Missing or invalid 'from' (a|b)" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  if (type !== "offer" && type !== "answer" && type !== "candidate") {
    return new Response(JSON.stringify({ error: "Invalid 'type'" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  pushToRoom(roomId, from, { type, data });
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
