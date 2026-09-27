import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { getServerUser, unauthorizedResponse } from '@/lib/auth-utils';
import { updateProfileSchema } from '@/validators/auth';

// PATCH /api/profile - Update user profile details or password
export async function PATCH(req: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return unauthorizedResponse();
    }

    const body = await req.json();
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0]?.message },
        { status: 400 }
      );
    }

    const { name, avatarUrl, currentPassword, newPassword } = validation.data;

    await connectToDatabase();

    const dbUser = await User.findById(user.id).select('+passwordHash');
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Handle name and avatar update
    if (name) dbUser.name = name;
    if (avatarUrl !== undefined) dbUser.avatarUrl = avatarUrl;

    // Handle password change if requested
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: 'Current password is required to set a new password.' },
          { status: 400 }
        );
      }

      const isValidCurrentPassword = await bcrypt.compare(currentPassword, dbUser.passwordHash);
      if (!isValidCurrentPassword) {
        return NextResponse.json(
          { success: false, error: 'Incorrect current password.' },
          { status: 400 }
        );
      }

      dbUser.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    await dbUser.save();

    return NextResponse.json({
      success: true,
      data: {
        id: dbUser._id.toString(),
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        avatarUrl: dbUser.avatarUrl,
        isActive: dbUser.isActive,
      },
      message: 'Profile updated successfully',
    });
  } catch (error: unknown) {
    console.error('Error updating profile:', error);
    const message = error instanceof Error ? error.message : 'Failed to update profile';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
