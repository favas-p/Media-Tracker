import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Activity from '@/models/Activity';
import { getServerUser, unauthorizedResponse } from '@/lib/auth-utils';

export async function GET(req: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return unauthorizedResponse();
    }

    await connectToDatabase();

    // Fetch latest 20 activity logs from database
    const activities = await Activity.find()
      .populate('userId', 'name email avatarUrl role')
      .populate('workId', 'title status priority category')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const formattedNotifications = activities
      .filter((act: any) => act.userId && act.workId)
      .map((act: any) => {
        const userName = act.userId?.name || 'Someone';
        const userAvatar = act.userId?.avatarUrl || '';
        const workTitle = act.workId?.title || 'Work Task';
        const workId = act.workId?._id ? act.workId._id.toString() : '';

        let message = '';
        let type: 'create' | 'status' | 'comment' | 'assign' = 'status';

        switch (act.action) {
          case 'created':
            message = `${userName} created & assigned work "${workTitle}"`;
            type = 'create';
            break;
          case 'status_changed': {
            const newStatus = act.meta?.newStatus || act.meta?.status;
            if (newStatus === 'completed') {
              message = `${userName} marked "${workTitle}" as Completed 🎉`;
            } else if (newStatus === 'in_progress') {
              message = `${userName} started working on "${workTitle}"`;
            } else {
              message = `${userName} updated status of "${workTitle}"`;
            }
            type = 'status';
            break;
          }
          case 'commented':
            message = `${userName} left a comment on "${workTitle}"`;
            type = 'comment';
            break;
          case 'assigned':
            message = `${userName} updated team assignees for "${workTitle}"`;
            type = 'assign';
            break;
          default:
            message = `${userName} updated "${workTitle}"`;
            type = 'status';
        }

        return {
          id: act._id.toString(),
          workId,
          workTitle,
          userName,
          userAvatar,
          action: act.action,
          message,
          type,
          createdAt: act.createdAt ? act.createdAt.toISOString() : new Date().toISOString(),
        };
      });

    return NextResponse.json({
      success: true,
      data: formattedNotifications,
    });
  } catch (error: unknown) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
