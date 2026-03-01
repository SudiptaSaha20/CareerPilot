import { NextRequest, NextResponse } from 'next/server';

const INTERVIEW_API_URL = process.env.INTERVIEW_CHATBOT_API_URL;
const INTERVIEW_API_KEY = process.env.INTERVIEW_CHATBOT_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { question, answer, sessionId, difficulty } = await request.json();

    if (!INTERVIEW_API_URL) {
      return NextResponse.json(
        { error: 'Interview API URL not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(`${INTERVIEW_API_URL}/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(INTERVIEW_API_KEY && { 'Authorization': `Bearer ${INTERVIEW_API_KEY}` }),
      },
      body: JSON.stringify({
        question,
        answer,
        sessionId,
        difficulty,
      }),
    });

    if (!response.ok) {
      throw new Error(`Interview API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Interview evaluation error:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate answer' },
      { status: 500 }
    );
  }
}
