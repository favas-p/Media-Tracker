import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Work from '@/models/Work';
import Activity from '@/models/Activity';
import { getServerUser, unauthorizedResponse } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

// GET /api/dashboard - Get summary metrics, upcoming works, and recent activities
export async function GET() {
  try {
    const user = await getServerUser();
    if (!user) {
      return unauthorizedResponse();
    }

    await connectToDatabase();

    const now = new Date();

    // Aggregations and Counts
    const total = await Work.countDocuments();
    const pending = await Work.countDocuments({ status: 'pending' });
    const inProgress = await Work.countDocuments({ status: 'in_progress' });
    const completed = await Work.countDocuments({ status: 'completed' });
    
    // Overdue: deadline < now AND status is NOT completed
    const overdue = await Work.countDocuments({
      deadline: { $lt: now },
      status: { $ne: 'completed' },
    });

    // My upcoming works (assigned to current user, not completed, sorted by deadline)
    const myUpcomingWorks = await Work.find({
      assignedTo: user.id,
      status: { $ne: 'completed' },
    })
      .populate('assignedTo', 'name email avatarUrl role')
      .populate('createdBy', 'name email avatarUrl role')
      .sort({ deadline: 1 })
      .limit(5)
      .lean();

    // Recent activity log (latest 8 activities)
    const recentActivities = await Activity.find()
      .populate('userId', 'name email avatarUrl role')
      .populate('workId', 'title')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    const formattedUpcoming = myUpcomingWorks.map((w) => ({
      id: w._id.toString(),
      title: w.title,
      description: w.description || '',
      category: w.category,
      priority: w.priority,
      deadline: w.deadline.toISOString(),
      status: w.status,
      assignedTo: (w.assignedTo || []).map((u: any) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        avatarUrl: u.avatarUrl || '',
      })),
      createdBy: w.createdBy
        ? {
            id: (w.createdBy as any)._id.toString(),
            name: (w.createdBy as any).name,
            email: (w.createdBy as any).email,
            role: (w.createdBy as any).role,
            avatarUrl: (w.createdBy as any).avatarUrl || '',
          }
        : null,
      attachments: w.attachments || [],
      createdAt: w.createdAt.toISOString(),
      updatedAt: w.updatedAt.toISOString(),
    }));

    const formattedActivities = recentActivities.map((a) => ({
      id: a._id.toString(),
      workId: a.workId ? (a.workId as any)._id.toString() : '',
      workTitle: a.workId ? (a.workId as any).title : 'Deleted Work',
      user: {
        id: (a.userId as any)._id.toString(),
        name: (a.userId as any).name,
        email: (a.userId as any).email,
        role: (a.userId as any).role,
        avatarUrl: (a.userId as any).avatarUrl || '',
      },
      action: a.action,
      meta: a.meta || {},
      createdAt: a.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          total,
          pending,
          inProgress,
          completed,
          overdue,
        },
        myUpcomingWorks: formattedUpcoming,
        recentActivities: formattedActivities,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
