import { NextRequest, NextResponse } from 'next/server';

const INTERVIEW_API_URL = process.env.INTERVIEW_CHATBOT_API_URL;
const INTERVIEW_API_KEY = process.env.INTERVIEW_CHATBOT_API_KEY;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const category = searchParams.get('category');

    if (!INTERVIEW_API_URL) {
      return NextResponse.json(
        { error: 'Interview API URL not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(`${INTERVIEW_API_URL}/questions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(INTERVIEW_API_KEY && { 'Authorization': `Bearer ${INTERVIEW_API_KEY}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`Interview API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Interview questions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interview questions' },
      { status: 500 }
    );
  }
}
