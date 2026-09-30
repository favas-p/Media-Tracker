import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { getServerUser, unauthorizedResponse } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

// GET /api/game/leaderboard - Get top scores across all team members
export async function GET() {
  try {
    const sessionUser = await getServerUser();
    if (!sessionUser) {
      return unauthorizedResponse();
    }

    await connectToDatabase();

    // Fetch all active members with a high score > 0, sorted descending
    const leaderboard = await User.find({
      isActive: true,
      gameHighScore: { $gt: 0 },
    })
      .select('name username role avatarUrl gameHighScore updatedAt')
      .sort({ gameHighScore: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({
      success: true,
      data: leaderboard.map((u, index) => ({
        rank: index + 1,
        id: u._id.toString(),
        name: u.name,
        username: u.username || '',
        role: u.role,
        avatarUrl: u.avatarUrl || '',
        highScore: u.gameHighScore || 0,
        updatedAt: u.updatedAt,
        isCurrentUser: u._id.toString() === sessionUser.id,
      })),
    });
  } catch (err: unknown) {
    console.error('Error fetching leaderboard:', err);
    return NextResponse.json({ success: false, error: 'Failed to load leaderboard' }, { status: 500 });
  }
}
