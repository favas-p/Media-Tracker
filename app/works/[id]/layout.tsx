import type { Metadata } from 'next';
import { headers } from 'next/headers';
import connectToDatabase from '@/lib/db';
import Work from '@/models/Work';
import User from '@/models/User';
import { format } from 'date-fns';

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    await connectToDatabase();
    if (!User) console.log('User model loaded');

    const work: any = await Work.findById(params.id)
      .populate('assignedTo', 'name')
      .populate('createdBy', 'name')
      .lean();

    if (!work) {
      return {
        title: 'Work Task | Nusa Media',
        description: 'Work task details',
      };
    }

    const title = work.title || 'Work Task';
    const assignees = (work.assignedTo || []).map((u: any) => u.name).join(', ') || 'Team';
    const createdByName = work.createdBy?.name || 'Chairman';
    const deadlineStr = work.deadline ? format(new Date(work.deadline), 'dd MMM yyyy') : 'No Deadline';

    const description = `👥 Assigned To: ${assignees} | 👤 By: ${createdByName} | 📅 Due: ${deadlineStr}`;

    // Compute dynamic absolute URL from request headers
    const headersList = headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = headersList.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const baseUrl = `${protocol}://${host}`;

    const ogImageUrl = `${baseUrl}/api/og/work/${params.id}`;
    const pageUrl = `${baseUrl}/works/${params.id}`;

    return {
      title: `${title} | Nusa Media Work Tracker`,
      description,
      openGraph: {
        title: `📋 ${title}`,
        description,
        url: pageUrl,
        siteName: 'Nusa Media Crew 2026',
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            type: 'image/png',
            alt: title,
          },
        ],
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title: `📋 ${title}`,
        description,
        images: [ogImageUrl],
      },
    };
  } catch (error) {
    return {
      title: 'Work Task | Nusa Media',
      description: 'Work task details',
    };
  }
}

export default function WorkDetailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
