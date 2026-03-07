import { NextRequest, NextResponse } from 'next/server';

function isTamil(text: string) {
  return /[\u0B80-\u0BFF]/.test(text);
}

async function queryTTS(model: string, text: string, hfApiKey: string) {
  const response = await fetch(
    `https://api-inference.huggingface.co/models/${model}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${hfApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: text }),
    }
  );

  // Model is still loading
  if (response.status === 503) {
    return { loading: true };
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText);
  }

  const buffer = await response.arrayBuffer();
  return { buffer };
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      );
    }

    const hfApiKey = process.env.HF_API_KEY;
    if (!hfApiKey) {
      return NextResponse.json(
        { error: 'Hugging Face API key not configured' },
        { status: 500 }
      );
    }

    // Choose model based on language
    const model = isTamil(text)
      ? 'facebook/mms-tts-tam'
      : 'espnet/kan-bayashi-ljspeech-vits';

    // Query Hugging Face (with retry for cold start)
    let result = await queryTTS(model, text, hfApiKey);
    if ('loading' in result) {
      // wait 5s then retry
      await new Promise((res) => setTimeout(res, 5000));
      result = await queryTTS(model, text, hfApiKey);
    }

    if ('buffer' in result) {
      return new NextResponse(result.buffer, {
        status: 200,
        headers: {
          'Content-Type': 'audio/wav',
          'Cache-Control': 'no-cache',
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Model still loading, try again' },
        { status: 503 }
      );
    }
  } catch (error: any) {
    console.error('TTS API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
