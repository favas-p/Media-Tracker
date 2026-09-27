import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { getServerUser, requireAdmin, forbiddenResponse, unauthorizedResponse } from '@/lib/auth-utils';
import { createMemberSchema } from '@/validators/auth';

// GET /api/members - List team members
export async function GET(req: NextRequest) {
  try {
    const currentUser = await getServerUser();
    if (!currentUser) {
      return unauthorizedResponse();
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const filter: Record<string, unknown> = {};
    if (!includeInactive) {
      filter.isActive = true;
    }
    if (role) {
      filter.role = role;
    }

    const members = await User.find(filter)
      .select('-passwordHash')
      .sort({ name: 1 })
      .lean();

    const formattedMembers = members.map((m) => ({
      id: m._id.toString(),
      name: m.name,
      username: m.username || m.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
      email: m.email,
      role: m.role,
      avatarUrl: m.avatarUrl || '',
      isActive: m.isActive,
      createdAt: m.createdAt,
    }));

    return NextResponse.json({ success: true, data: formattedMembers });
  } catch (error: unknown) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}

// POST /api/members - Create a new team member (Admin only)
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return forbiddenResponse('Only Chairman and Convener can add members.');
    }

    const body = await req.json();
    const validation = createMemberSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0]?.message },
        { status: 400 }
      );
    }

    const { name, username: customUsername, email, password, role, avatarUrl } = validation.data;

    await connectToDatabase();

    const cleanUsername = (customUsername || name.toLowerCase().replace(/[^a-z0-9]/g, '')).trim();

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: cleanUsername }],
    });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'A member with this email or username already exists' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const defaultAvatar =
      avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

    const newMember = await User.create({
      name,
      username: cleanUsername,
      email: email.toLowerCase(),
      passwordHash,
      role,
      avatarUrl: defaultAvatar,
      isActive: true,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newMember._id.toString(),
          name: newMember.name,
          username: newMember.username,
          email: newMember.email,
          role: newMember.role,
          avatarUrl: newMember.avatarUrl,
          isActive: newMember.isActive,
          createdAt: newMember.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error creating member:', error);
    const message = error instanceof Error ? error.message : 'Failed to create member';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
