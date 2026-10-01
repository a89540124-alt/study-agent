import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { provider, key, model, subject, prompt } = body || {};

    if (!key || !prompt) {
      return NextResponse.json(
        { error: 'Missing API key or prompt.' },
        { status: 400 }
      );
    }

    const finalModel = model || (provider === 'groq' ? 'qwen/qwen-2.5-32b' : 'openai/gpt-4o-mini');

    const chosenUrl =
      provider === 'groq'
        ? 'https://api.groq.com/openai/v1/chat/completions'
        : 'https://openrouter.ai/api/v1/chat/completions';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    };

    if (provider === 'openrouter') {
      headers['HTTP-Referer'] = 'https://study-agent.local';
      headers['X-Title'] = 'Study Agent';
    }

    const response = await fetch(chosenUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: finalModel,
        messages: [
          {
            role: 'system',
            content:
              'You are an expert study tutor. Provide concise but detailed explanations, clear structure, examples, and actionable revision tips. Tailor your response to the subject and user learning level.',
          },
          {
            role: 'user',
            content: `Subject: ${subject || 'General'}\n\nPrompt: ${prompt}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: data?.error?.message || data?.message || 'The AI provider rejected the request.',
        },
        { status: response.status }
      );
    }

    const answer = data?.choices?.[0]?.message?.content || 'No answer generated.';

    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Unable to process the request. Please check your API configuration.' },
      { status: 500 }
    );
  }
}
