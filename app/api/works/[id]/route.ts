import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Work from '@/models/Work';
import Activity from '@/models/Activity';
import Comment from '@/models/Comment';
import { getServerUser, isAdminRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-utils';
import { updateWorkSchema, updateWorkStatusSchema } from '@/validators/work';

// GET /api/works/[id] - Single work details, comments, and activities
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getServerUser();
    if (!user) {
      return unauthorizedResponse();
    }

    const { id } = params;
    await connectToDatabase();

    const work = await Work.findById(id)
      .populate('assignedTo', 'name email avatarUrl role isActive')
      .populate('subtasks.assignedTo', 'name email avatarUrl role')
      .populate('createdBy', 'name email avatarUrl role')
      .populate('completedBy', 'name email avatarUrl role')
      .lean();

    if (!work) {
      return NextResponse.json({ success: false, error: 'Work not found' }, { status: 404 });
    }

    // Fetch comments
    const comments = await Comment.find({ workId: id })
      .populate('userId', 'name email avatarUrl role')
      .sort({ createdAt: 1 })
      .lean();

    // Fetch activities
    const activities = await Activity.find({ workId: id })
      .populate('userId', 'name email avatarUrl role')
      .sort({ createdAt: -1 })
      .lean();

    const formattedWork = {
      id: work._id.toString(),
      title: work.title,
      description: work.description || '',
      category: work.category,
      priority: work.priority,
      deadline: work.deadline.toISOString(),
      status: work.status,
      assignedTo: (work.assignedTo || []).map((u: any) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        avatarUrl: u.avatarUrl || '',
        isActive: u.isActive,
      })),
      subtasks: (work.subtasks || []).map((st: any) => ({
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
      createdBy: work.createdBy
        ? {
            id: (work.createdBy as any)._id.toString(),
            name: (work.createdBy as any).name,
            email: (work.createdBy as any).email,
            role: (work.createdBy as any).role,
            avatarUrl: (work.createdBy as any).avatarUrl || '',
          }
        : null,
      completedAt: work.completedAt ? work.completedAt.toISOString() : null,
      completedBy: work.completedBy
        ? {
            id: (work.completedBy as any)._id.toString(),
            name: (work.completedBy as any).name,
            email: (work.completedBy as any).email,
            role: (work.completedBy as any).role,
            avatarUrl: (work.completedBy as any).avatarUrl || '',
          }
        : null,
      attachments: work.attachments || [],
      createdAt: work.createdAt.toISOString(),
      updatedAt: work.updatedAt.toISOString(),
    };

    const formattedComments = comments.map((c) => ({
      id: c._id.toString(),
      workId: c.workId.toString(),
      user: {
        id: (c.userId as any)._id.toString(),
        name: (c.userId as any).name,
        email: (c.userId as any).email,
        role: (c.userId as any).role,
        avatarUrl: (c.userId as any).avatarUrl || '',
      },
      message: c.message,
      createdAt: c.createdAt.toISOString(),
    }));

    const formattedActivities = activities.map((a) => ({
      id: a._id.toString(),
      workId: a.workId.toString(),
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
        work: formattedWork,
        comments: formattedComments,
        activities: formattedActivities,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching work details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch work details' },
      { status: 500 }
    );
  }
}

// PATCH /api/works/[id] - Update work (Full edit for Admin, Status toggle for assigned member)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getServerUser();
    if (!user) {
      return unauthorizedResponse();
    }

    const { id } = params;
    const body = await req.json();

    await connectToDatabase();

    const work = await Work.findById(id);
    if (!work) {
      return NextResponse.json({ success: false, error: 'Work not found' }, { status: 404 });
    }

    const isAdmin = isAdminRole(user.role);
    const isAssigned = work.assignedTo.some(
      (assigneeId) => assigneeId.toString() === user.id
    );

    // Permission Enforcement
    if (!isAdmin && !isAssigned) {
      return forbiddenResponse('You can only update works assigned to you.');
    }

    if (!isAdmin) {
      // Member can ONLY update status
      const statusValidation = updateWorkStatusSchema.safeParse(body);
      if (!statusValidation.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Members can only update status (pending, in_progress, completed).',
          },
          { status: 400 }
        );
      }

      const oldStatus = work.status;
      const newStatus = statusValidation.data.status;

      if (oldStatus !== newStatus) {
        work.status = newStatus;
        if (newStatus === 'completed') {
          work.completedAt = new Date();
          work.completedBy = user.id as any;
        } else {
          work.completedAt = undefined;
          work.completedBy = undefined;
        }

        await work.save();

        // Record Activity
        await Activity.create({
          workId: work._id,
          userId: user.id,
          action: 'status_changed',
          meta: { from: oldStatus, to: newStatus },
        });
      }
    } else {
      // Admin editing full work
      const validation = updateWorkSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { success: false, error: validation.error.errors[0]?.message },
          { status: 400 }
        );
      }

      const data = validation.data;
      const oldStatus = work.status;

      if (data.title !== undefined) work.title = data.title;
      if (data.description !== undefined) work.description = data.description;
      if (data.category !== undefined) work.category = data.category;
      if (data.priority !== undefined) work.priority = data.priority;
      if (data.deadline !== undefined) work.deadline = new Date(data.deadline);
      if (data.assignedTo !== undefined) work.assignedTo = data.assignedTo as any;
      if (data.attachments !== undefined) work.attachments = data.attachments;
      if (data.subtasks !== undefined) {
        work.subtasks = (data.subtasks || []).map((st: any) => ({
          title: st.title,
          assignedTo: st.assignedTo || null,
          status: st.status || 'pending',
        })) as any;
      }

      if (data.status !== undefined && data.status !== oldStatus) {
        work.status = data.status;
        if (data.status === 'completed') {
          work.completedAt = new Date();
          work.completedBy = user.id as any;
        } else {
          work.completedAt = undefined;
          work.completedBy = undefined;
        }

        await Activity.create({
          workId: work._id,
          userId: user.id,
          action: 'status_changed',
          meta: { from: oldStatus, to: data.status },
        });
      } else {
        await Activity.create({
          workId: work._id,
          userId: user.id,
          action: 'updated',
          meta: { title: work.title },
        });
      }

      await work.save();
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
        description: updatedWork!.description,
        category: updatedWork!.category,
        priority: updatedWork!.priority,
        deadline: updatedWork!.deadline.toISOString(),
        status: updatedWork!.status,
        assignedTo: (updatedWork!.assignedTo || []).map((u: any) => ({
          id: u._id.toString(),
          name: u.name,
          email: u.email,
          role: u.role,
          avatarUrl: u.avatarUrl || '',
          isActive: u.isActive,
        })),
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
        createdBy: updatedWork!.createdBy
          ? {
              id: (updatedWork!.createdBy as any)._id.toString(),
              name: (updatedWork!.createdBy as any).name,
              email: (updatedWork!.createdBy as any).email,
              role: (updatedWork!.createdBy as any).role,
              avatarUrl: (updatedWork!.createdBy as any).avatarUrl || '',
            }
          : null,
        completedAt: updatedWork!.completedAt ? updatedWork!.completedAt.toISOString() : null,
        completedBy: updatedWork!.completedBy
          ? {
              id: (updatedWork!.completedBy as any)._id.toString(),
              name: (updatedWork!.completedBy as any).name,
              email: (updatedWork!.completedBy as any).email,
              role: (updatedWork!.completedBy as any).role,
              avatarUrl: (updatedWork!.completedBy as any).avatarUrl || '',
            }
          : null,
        attachments: updatedWork!.attachments || [],
        createdAt: updatedWork!.createdAt.toISOString(),
        updatedAt: updatedWork!.updatedAt.toISOString(),
      },
    });
  } catch (error: unknown) {
    console.error('Error updating work:', error);
    const message = error instanceof Error ? error.message : 'Failed to update work';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

// DELETE /api/works/[id] - Admin deletes work
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getServerUser();
    if (!user || !isAdminRole(user.role)) {
      return forbiddenResponse('Only Chairman and Convener can delete works.');
    }

    const { id } = params;
    await connectToDatabase();

    const work = await Work.findById(id);
    if (!work) {
      return NextResponse.json({ success: false, error: 'Work not found' }, { status: 404 });
    }

    await Work.findByIdAndDelete(id);
    await Comment.deleteMany({ workId: id });
    await Activity.deleteMany({ workId: id });

    return NextResponse.json({
      success: true,
      message: 'Work and associated activity logs deleted successfully',
    });
  } catch (error: unknown) {
    console.error('Error deleting work:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete work' }, { status: 500 });
  }
}
