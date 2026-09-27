import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { requireAdmin, forbiddenResponse } from '@/lib/auth-utils';
import { updateMemberSchema } from '@/validators/auth';

// PATCH /api/members/[id] - Update member details / active status (Admin only)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return forbiddenResponse('Only Chairman and Convener can update member details.');
    }

    const { id } = params;
    const body = await req.json();

    const validation = updateMemberSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0]?.message },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const member = await User.findById(id);
    if (!member) {
      return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 });
    }

    // Prevent deactivating Chairman self
    if (member.role === 'chairman' && validation.data.isActive === false && admin.id === id) {
      return NextResponse.json(
        { success: false, error: 'Chairman account cannot deactivate itself.' },
        { status: 400 }
      );
    }

    member.name = validation.data.name;
    member.email = validation.data.email.toLowerCase();
    member.role = validation.data.role;
    member.isActive = validation.data.isActive;

    await member.save();

    return NextResponse.json({
      success: true,
      data: {
        id: member._id.toString(),
        name: member.name,
        email: member.email,
        role: member.role,
        avatarUrl: member.avatarUrl,
        isActive: member.isActive,
      },
    });
  } catch (error: unknown) {
    console.error('Error updating member:', error);
    const message = error instanceof Error ? error.message : 'Failed to update member';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
