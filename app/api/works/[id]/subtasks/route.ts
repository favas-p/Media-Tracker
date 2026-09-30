import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Work from '@/models/Work';
import Activity from '@/models/Activity';
import { getServerUser, isAdminRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-utils';
import { updateSubtaskStatusSchema } from '@/validators/work';

export const dynamic = 'force-dynamic';

// PATCH /api/works/[id]/subtasks - Update a single subtask status
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getServerUser();
    if (!user) {
      return unauthorizedResponse();
    }

    const { id } = params;
    const body = await req.json();
    const validation = updateSubtaskStatusSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0]?.message },
        { status: 400 }
      );
    }

    const { subtaskId, status: newStatus } = validation.data;

    await connectToDatabase();

    const work = await Work.findById(id);
    if (!work) {
      return NextResponse.json({ success: false, error: 'Work not found' }, { status: 404 });
    }

    const isAdmin = isAdminRole(user.role);
    const isMainAssignee = work.assignedTo.some((uid) => uid.toString() === user.id);

    // Find target subtask
    const subtask = work.subtasks.find((st: any) => st._id.toString() === subtaskId);
    if (!subtask) {
      return NextResponse.json({ success: false, error: 'Program step not found' }, { status: 404 });
    }

    const isSubtaskAssignee = subtask.assignedTo && subtask.assignedTo.toString() === user.id;

    // Permissions: Admin, Main Work Assignee, or Subtask Assignee can update
    if (!isAdmin && !isMainAssignee && !isSubtaskAssignee) {
      return forbiddenResponse('You are not authorized to update this program step.');
    }

    const oldStatus = subtask.status;
    if (oldStatus !== newStatus) {
      subtask.status = newStatus;
      if (newStatus === 'completed') {
        subtask.completedAt = new Date();
      } else {
        subtask.completedAt = undefined;
      }

      // Check if all subtasks are completed
      const allSubtasksDone = work.subtasks.length > 0 && work.subtasks.every((st) => st.status === 'completed');
      if (allSubtasksDone && work.status !== 'completed') {
        work.status = 'completed';
        work.completedAt = new Date();
        work.completedBy = user.id as any;
      }

      await work.save();

      // Log activity
      await Activity.create({
        workId: work._id,
        userId: user.id,
        action: 'status_changed',
        meta: { subtaskTitle: subtask.title, from: oldStatus, to: newStatus },
      });
    }

    const updatedWork = await Work.findById(id)
      .populate('assignedTo', 'name email avatarUrl role isActive')
      .populate('subtasks.assignedTo', 'name email avatarUrl role')
      .populate('createdBy', 'name email avatarUrl role')
      .populate('completedBy', 'name email avatarUrl role')
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        id: updatedWork!._id.toString(),
        title: updatedWork!.title,
        status: updatedWork!.status,
        subtasks: (updatedWork!.subtasks || []).map((st: any) => ({
          id: st._id ? st._id.toString() : '',
          title: st.title,
          assignedTo: st.assignedTo
            ? {
                id: (st.assignedTo as any)._id.toString(),
                name: (st.assignedTo as any).name,
                email: (st.assignedTo as any).email,
                role: (st.assignedTo as any).role,
                avatarUrl: (st.assignedTo as any).avatarUrl || '',
              }
            : null,
          status: st.status,
          completedAt: st.completedAt ? st.completedAt.toISOString() : null,
        })),
      },
    });
  } catch (error: unknown) {
    console.error('Error updating subtask status:', error);
    return NextResponse.json({ success: false, error: 'Failed to update subtask status' }, { status: 500 });
  }
}
