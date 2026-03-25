import { NextResponse } from "next/server";
import { gpu } from "@/lib/gpuBackend";

const DUMMY_OWNER_ID = "00000000-0000-0000-0000-000000000000";

function slugify(input: string): string {
  return (input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function GET(req: Request) {
  if (process.env.NODE_ENV !== "development" && process.env.ENABLE_DEV_SERVICE_ROUTE !== "true") {
    return new NextResponse("Not found", { status: 404 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const slug = searchParams.get("slug");
  const ensure = searchParams.get("ensure");
  if (!id && !slug) return NextResponse.json({ error: "Provide id or slug" }, { status: 400 });

  try {
    let data: any = null;
    if (id) {
      data = await gpu.chatbots.getById(id);
    } else if (slug) {
      data = await gpu.chatbots.getBySlug(slug);
    }

    if (!data && ensure && slug) {
      const insert = {
        name: slug,
        slug,
        is_public: true,
        is_deleted: false,
        owner_id: DUMMY_OWNER_ID,
        greeting: "How can I help you today?",
        tagline: "Ask your AI Teacher…",
        brand_color: "#3B82F6",
        bubble_style: "rounded",
        typing_indicator: true,
        model: "gpt-4o-mini",
        temperature: 0.6,
      };
      const created = await gpu.chatbots.create(insert);
      return NextResponse.json({ bot: created ?? insert });
    }

    return NextResponse.json({ bot: data ?? null });
  } catch {
    return NextResponse.json({ bot: null });
  }
}

export async function POST(req: Request) {
  try {
    if (process.env.NODE_ENV !== "development" && process.env.ENABLE_DEV_SERVICE_ROUTE !== "true") {
      return new NextResponse("Not found", { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      id,
      name,
      slug: providedSlug,
      is_public,
      is_deleted,
      owner_id,
      greeting,
      directive,
      knowledge_base,
      starter_questions,
      rules,
      integrations,
      brand_color,
      avatar_url,
      bubble_style,
      typing_indicator,
      model,
      temperature,
      tagline,
    } = body || {};

    if (!id && !name && !providedSlug) {
      return NextResponse.json({ error: "Provide at least id or name/slug" }, { status: 400 });
    }

    let finalSlug = providedSlug ? slugify(providedSlug) : name ? slugify(name) : undefined;

    const base: any = {
      name: name || providedSlug || finalSlug || "New Chatbot",
      slug: finalSlug,
      is_public: is_public ?? true,
      is_deleted: is_deleted ?? false,
      greeting,
      directive,
      knowledge_base,
      starter_questions,
      rules,
      integrations,
      brand_color,
      avatar_url,
      bubble_style,
      typing_indicator,
      model,
      temperature,
      tagline,
    };

    let result;
    if (id) {
      const payload = { ...base };
      delete payload.slug;
      if (providedSlug) payload.slug = finalSlug;
      result = await gpu.chatbots.update(id, payload);
    } else {
      const toInsert = { ...base, owner_id: owner_id || DUMMY_OWNER_ID };
      result = await gpu.chatbots.create(toInsert);
    }

    return NextResponse.json({ bot: result });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}
