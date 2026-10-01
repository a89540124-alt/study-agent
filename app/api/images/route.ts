import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, key } = body || {};

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Missing prompt.' }, { status: 400 });
    }

    const safePrompt = encodeURIComponent(prompt.trim());
    const baseUrl = `https://image.pollinations.ai/prompt/${safePrompt}`;

    const params = new URLSearchParams({
      model: 'flux',
      width: '1024',
      height: '1024',
      seed: String(Date.now()),
    });

    if (key) {
      params.set('key', key);
    }

    const imageUrl = `${baseUrl}?${params.toString()}`;
    const response = await fetch(imageUrl, { method: 'GET' });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json({ error: text || 'Pollination image generation failed.' }, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const buffer = Buffer.from(await response.arrayBuffer());

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Image API error:', error);
    return NextResponse.json(
      { error: 'Unable to generate the image. Please verify your Pollination setup.' },
      { status: 500 }
    );
  }
}
