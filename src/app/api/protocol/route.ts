// ============================================================
// API Route — Protocol Info from DefiLlama
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/services/cache';

const DEFILLAMA_PROTOCOL = 'https://api.llama.fi/protocol';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'slug required' }, { status: 400 });
    }

    const cacheKey = `protocol_${slug}`;
    const cached = cache.get(cacheKey);
    if (cached) return NextResponse.json(cached);

    const res = await fetch(`${DEFILLAMA_PROTOCOL}/${slug}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 3600 }, // 1 hour
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Not found: ${slug}` }, { status: 404 });
    }

    const d = await res.json();
    const result = {
      name: d.name,
      slug: slug,
      description: d.description || '',
      category: d.category || '',
      chains: d.chains || [],
      url: d.url || '',
      logo: d.logo || '',
      audits: d.audits || '0',
      geckoId: d.gecko_id || '',
    };

    cache.set(cacheKey, result, 60 * 60 * 1000);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
