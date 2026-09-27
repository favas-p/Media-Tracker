import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local or .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import bcrypt from 'bcryptjs';
import connectToDatabase from '../lib/db';
import User from '../models/User';
import Work from '../models/Work';
import Activity from '../models/Activity';
import Comment from '../models/Comment';

async function seed() {
  console.log('🌱 Starting Nusa Media Database Seed...');
  
  await connectToDatabase();

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'chairman@nusamedia.id';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'AdminNusa2026!';
  const adminName = process.env.SEED_ADMIN_NAME || 'Chairman Nusa';

  console.log(`Checking for existing chairman account (${adminEmail})...`);

  // Clear existing collections for a clean setup during initial seeding
  await User.deleteMany({});
  await Work.deleteMany({});
  await Activity.deleteMany({});
  await Comment.deleteMany({});

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  // 1. Create Chairman (Admin)
  const chairman = await User.create({
    name: adminName,
    username: 'chairman',
    email: adminEmail,
    passwordHash,
    role: 'chairman',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chairman',
    isActive: true,
  });

  console.log(`✅ Chairman created: ${chairman.email} (username: chairman)`);

  // 2. Create Convener & Team Members
  const convener = await User.create({
    name: 'Siti Rahma (Convener)',
    username: 'convener',
    email: 'convener@nusamedia.id',
    passwordHash,
    role: 'convener',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Siti',
    isActive: true,
  });

  const member1 = await User.create({
    name: 'Ahmad Budi',
    username: 'budi',
    email: 'budi@nusamedia.id',
    passwordHash,
    role: 'member',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Budi',
    isActive: true,
  });

  const member2 = await User.create({
    name: 'Dewi Lestari',
    username: 'dewi',
    email: 'dewi@nusamedia.id',
    passwordHash,
    role: 'member',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dewi',
    isActive: true,
  });

  const member3 = await User.create({
    name: 'Fikri Haikal',
    username: 'fikri',
    email: 'fikri@nusamedia.id',
    passwordHash,
    role: 'member',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fikri',
    isActive: true,
  });

  console.log(`✅ Created 1 Convener and 3 Members.`);

  // 3. Create Sample Works
  const now = new Date();
  const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

  const work1 = await Work.create({
    title: 'Teaser Video Instagram Campaign Nusa Media',
    description: 'Create a 30-second high energy teaser video showcasing upcoming media events.',
    category: 'video',
    priority: 'high',
    deadline: inThreeDays,
    status: 'in_progress',
    assignedTo: [member1._id, member3._id],
    createdBy: chairman._id,
    attachments: ['https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800'],
  });

  const work2 = await Work.create({
    title: 'Weekly Highlight Poster Design',
    description: 'Design A3 printable and digital poster for community updates.',
    category: 'poster',
    priority: 'medium',
    deadline: nextWeek,
    status: 'pending',
    assignedTo: [member2._id],
    createdBy: convener._id,
    attachments: [],
  });

  const work3 = await Work.create({
    title: 'TikTok & Reels Trend Highlights',
    description: 'Compile top 5 viral trends in tech and media for this week.',
    category: 'reels',
    priority: 'high',
    deadline: yesterday, // Overdue task for testing overdue badges
    status: 'pending',
    assignedTo: [member1._id],
    createdBy: chairman._id,
    attachments: [],
  });

  const work4 = await Work.create({
    title: 'Event Photography Coverage Brief',
    description: 'Prepare camera gear list and shot list for annual chairman speech.',
    category: 'photo',
    priority: 'low',
    deadline: yesterday,
    status: 'completed',
    assignedTo: [member2._id, member3._id],
    createdBy: chairman._id,
    completedAt: yesterday,
    completedBy: member2._id,
    attachments: [],
  });

  console.log(`✅ Created 4 sample works with various categories and statuses.`);

  // 4. Create Initial Activities & Comments
  await Activity.create({
    workId: work1._id,
    userId: chairman._id,
    action: 'created',
    meta: { title: work1.title },
  });

  await Activity.create({
    workId: work1._id,
    userId: chairman._id,
    action: 'assigned',
    meta: { assignees: ['Ahmad Budi', 'Fikri Haikal'] },
  });

  await Comment.create({
    workId: work1._id,
    userId: member1._id,
    message: 'I have started cutting the raw footage. Will upload draft preview tomorrow!',
  });

  console.log('🎉 Seed completed successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Error seeding database:', err);
  process.exit(1);
});
