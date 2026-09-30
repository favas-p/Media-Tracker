import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { getServerUser, unauthorizedResponse } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

// GET /api/game/score - Get current user's high score from database
export async function GET() {
  try {
    const sessionUser = await getServerUser();
    if (!sessionUser) {
      return unauthorizedResponse();
    }

    await connectToDatabase();
    const currentUser = await User.findById(sessionUser.id).select('gameHighScore');

    return NextResponse.json({
      success: true,
      highScore: currentUser?.gameHighScore || 0,
    });
  } catch (err: unknown) {
    console.error('Error fetching score:', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch score' }, { status: 500 });
  }
}

// POST /api/game/score - Submit score for logged-in user
export async function POST(req: Request) {
  try {
    const sessionUser = await getServerUser();
    if (!sessionUser) {
      return unauthorizedResponse();
    }

    const { score } = await req.json();
    if (typeof score !== 'number' || score < 0) {
      return NextResponse.json({ success: false, error: 'Invalid score' }, { status: 400 });
    }

    await connectToDatabase();

    const currentUser = await User.findById(sessionUser.id);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const prevHighScore = currentUser.gameHighScore || 0;
    const newBest = Math.max(score, prevHighScore);
    let isNewRecord = false;

    if (newBest > prevHighScore || (prevHighScore === 0 && score > 0)) {
      currentUser.gameHighScore = newBest;
      await currentUser.save();
      isNewRecord = true;
    }

    return NextResponse.json({
      success: true,
      highScore: currentUser.gameHighScore || 0,
      isNewRecord,
    });
  } catch (err: unknown) {
    console.error('Error submitting game score:', err);
    return NextResponse.json({ success: false, error: 'Failed to submit score' }, { status: 500 });
  }
}
