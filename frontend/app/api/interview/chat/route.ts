import { NextRequest, NextResponse } from 'next/server';

const INTERVIEW_API_URL = process.env.INTERVIEW_CHATBOT_API_URL;
const INTERVIEW_API_KEY = process.env.INTERVIEW_CHATBOT_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { message, sessionId, conversationHistory } = await request.json();

    if (!INTERVIEW_API_URL) {
      return NextResponse.json(
        { error: 'Interview API URL not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(`${INTERVIEW_API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(INTERVIEW_API_KEY && { 'Authorization': `Bearer ${INTERVIEW_API_KEY}` }),
      },
      body: JSON.stringify({
        message,
        sessionId,
        conversationHistory,
      }),
    });

    if (!response.ok) {
      throw new Error(`Interview API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Interview chat error:', error);
    return NextResponse.json(
      { error: 'Failed to get response from interview chatbot' },
      { status: 500 }
    );
  }
}
