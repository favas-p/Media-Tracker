import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Work from '@/models/Work';
import Activity from '@/models/Activity';
import { getServerUser, requireAdmin, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-utils';
import { createWorkSchema } from '@/validators/work';

// GET /api/works - List team works with filters and search
export async function GET(req: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return unauthorizedResponse();
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const assignedTo = searchParams.get('assignedTo');
    const myWorks = searchParams.get('myWorks') === 'true';
    const search = searchParams.get('search');

    const filter: Record<string, unknown> = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    if (myWorks) {
      filter.assignedTo = user.id;
    } else if (assignedTo) {
      filter.assignedTo = assignedTo;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const works = await Work.find(filter)
      .populate('assignedTo', 'name email avatarUrl role isActive')
      .populate('subtasks.assignedTo', 'name email avatarUrl role')
      .populate('createdBy', 'name email avatarUrl role')
      .populate('completedBy', 'name email avatarUrl role')
      .sort({ createdAt: -1 })
      .lean();

    const formattedWorks = works.map((w) => ({
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
        isActive: u.isActive,
      })),
      subtasks: (w.subtasks || []).map((st: any) => ({
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
      createdBy: w.createdBy
        ? {
            id: (w.createdBy as any)._id.toString(),
            name: (w.createdBy as any).name,
            email: (w.createdBy as any).email,
            role: (w.createdBy as any).role,
            avatarUrl: (w.createdBy as any).avatarUrl || '',
          }
        : null,
      completedAt: w.completedAt ? w.completedAt.toISOString() : null,
      completedBy: w.completedBy
        ? {
            id: (w.completedBy as any)._id.toString(),
            name: (w.completedBy as any).name,
            email: (w.completedBy as any).email,
            role: (w.completedBy as any).role,
            avatarUrl: (w.completedBy as any).avatarUrl || '',
          }
        : null,
      attachments: w.attachments || [],
      createdAt: w.createdAt.toISOString(),
      updatedAt: w.updatedAt.toISOString(),
    }));

    return NextResponse.json({ success: true, data: formattedWorks });
  } catch (error: unknown) {
    console.error('Error fetching works:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch works list' },
      { status: 500 }
    );
  }
}

// POST /api/works - Create a new work (Admin only)
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return forbiddenResponse('Only Chairman and Convener can create works.');
    }

    const body = await req.json();
    const validation = createWorkSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0]?.message },
        { status: 400 }
      );
    }

    const { title, description, category, priority, deadline, assignedTo, subtasks, attachments } =
      validation.data;

    await connectToDatabase();

    const formattedSubtasks = (subtasks || []).map((st) => ({
      title: st.title,
      assignedTo: st.assignedTo || null,
      status: st.status || 'pending',
    }));

    const newWork = await Work.create({
      title,
      description: description || '',
      category,
      priority,
      deadline: new Date(deadline),
      status: 'pending',
      assignedTo,
      subtasks: formattedSubtasks,
      createdBy: admin.id,
      attachments: attachments || [],
    });

    // Create Activity Log
    await Activity.create({
      workId: newWork._id,
      userId: admin.id,
      action: 'created',
      meta: { title: newWork.title },
    });

    const populatedWork = await Work.findById(newWork._id)
      .populate('assignedTo', 'name email avatarUrl role isActive')
      .populate('subtasks.assignedTo', 'name email avatarUrl role')
      .populate('createdBy', 'name email avatarUrl role')
      .lean();

    return NextResponse.json(
      {
        success: true,
        data: {
          id: populatedWork!._id.toString(),
          title: populatedWork!.title,
          description: populatedWork!.description,
          category: populatedWork!.category,
          priority: populatedWork!.priority,
          deadline: populatedWork!.deadline.toISOString(),
          status: populatedWork!.status,
          assignedTo: (populatedWork!.assignedTo || []).map((u: any) => ({
            id: u._id.toString(),
            name: u.name,
            email: u.email,
            role: u.role,
            avatarUrl: u.avatarUrl || '',
            isActive: u.isActive,
          })),
          subtasks: (populatedWork!.subtasks || []).map((st: any) => ({
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
          createdBy: {
            id: (populatedWork!.createdBy as any)._id.toString(),
            name: (populatedWork!.createdBy as any).name,
            email: (populatedWork!.createdBy as any).email,
            role: (populatedWork!.createdBy as any).role,
            avatarUrl: (populatedWork!.createdBy as any).avatarUrl || '',
          },
          attachments: populatedWork!.attachments || [],
          createdAt: populatedWork!.createdAt.toISOString(),
          updatedAt: populatedWork!.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error creating work:', error);
    const message = error instanceof Error ? error.message : 'Failed to create work';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
