import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Work from '@/models/Work';
import Comment from '@/models/Comment';
import Activity from '@/models/Activity';
import { getServerUser, unauthorizedResponse } from '@/lib/auth-utils';
import { createCommentSchema } from '@/validators/work';

// POST /api/works/[id]/comments - Add a comment to a work item
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getServerUser();
    if (!user) {
      return unauthorizedResponse();
    }

    const { id } = params;
    const body = await req.json();

    const validation = createCommentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0]?.message },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const work = await Work.findById(id);
    if (!work) {
      return NextResponse.json({ success: false, error: 'Work not found' }, { status: 404 });
    }

    const comment = await Comment.create({
      workId: work._id,
      userId: user.id,
      message: validation.data.message.trim(),
    });

    // Create activity record for comment
    await Activity.create({
      workId: work._id,
      userId: user.id,
      action: 'commented',
      meta: { commentId: comment._id.toString() },
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate('userId', 'name email avatarUrl role')
      .lean();

    return NextResponse.json(
      {
        success: true,
        data: {
          id: populatedComment!._id.toString(),
          workId: populatedComment!.workId.toString(),
          user: {
            id: (populatedComment!.userId as any)._id.toString(),
            name: (populatedComment!.userId as any).name,
            email: (populatedComment!.userId as any).email,
            role: (populatedComment!.userId as any).role,
            avatarUrl: (populatedComment!.userId as any).avatarUrl || '',
          },
          message: populatedComment!.message,
          createdAt: populatedComment!.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error adding comment:', error);
    const message = error instanceof Error ? error.message : 'Failed to add comment';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
