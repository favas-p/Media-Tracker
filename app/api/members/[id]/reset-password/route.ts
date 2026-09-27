import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { requireAdmin, forbiddenResponse } from '@/lib/auth-utils';
import { resetPasswordSchema } from '@/validators/auth';

// POST /api/members/[id]/reset-password - Admin resets member password
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return forbiddenResponse('Only Chairman and Convener can reset passwords.');
    }

    const { id } = params;
    const body = await req.json();

    const validation = resetPasswordSchema.safeParse(body);
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

    const newPasswordHash = await bcrypt.hash(validation.data.newPassword, 10);
    member.passwordHash = newPasswordHash;
    await member.save();

    return NextResponse.json({
      success: true,
      message: `Password successfully reset for ${member.name}.`,
    });
  } catch (error: unknown) {
    console.error('Error resetting password:', error);
    const message = error instanceof Error ? error.message : 'Failed to reset password';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
