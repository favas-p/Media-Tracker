import { NextRequest } from 'next/server';
import { Resvg } from '@resvg/resvg-js';
import connectToDatabase from '@/lib/db';
import Work from '@/models/Work';
import User from '@/models/User';
import { format } from 'date-fns';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    await connectToDatabase();
    
    // Ensure User model is loaded for Mongoose populate
    if (!User) console.log('User model initialized');

    const work: any = await Work.findById(id)
      .populate('assignedTo', 'name role')
      .populate('createdBy', 'name role')
      .lean();

    if (!work) {
      return new Response('Work task not found', { status: 404 });
    }

    const title = (work.title || 'Work Task').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const category = (work.category || 'task').toUpperCase();
    const priority = (work.priority || 'medium').toUpperCase();
    const status = (work.status || 'pending').replace('_', ' ').toUpperCase();

    const createdByName = (work.createdBy?.name || 'Chairman').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const assignees = ((work.assignedTo || []).map((u: any) => u.name).join(', ') || 'Team Members').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const deadlineStr = work.deadline ? format(new Date(work.deadline), 'dd MMM yyyy') : 'No Deadline';

    const statusBg = status === 'COMPLETED' ? '#10B981' : status === 'IN PROGRESS' ? '#2511F7' : '#F59E0B';

    const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#F4F6FF"/>
          <stop offset="100%" stop-color="#EBEFFF"/>
        </linearGradient>
      </defs>
      
      <!-- Clean Light Theme Background -->
      <rect width="1200" height="630" fill="url(#bg)"/>
      <circle cx="100" cy="100" r="300" fill="#2511F7" opacity="0.06"/>
      <circle cx="1100" cy="500" r="300" fill="#FFE600" opacity="0.12"/>
      
      <!-- Outer Decorative Frame -->
      <rect x="16" y="16" width="1168" height="598" rx="32" fill="none" stroke="#2511F7" stroke-width="3" opacity="0.2"/>

      <!-- Header -->
      <rect x="60" y="52" width="54" height="54" rx="16" fill="#2511F7"/>
      <text x="87" y="87" font-family="sans-serif" font-size="22" font-weight="900" fill="#FFE600" text-anchor="middle">NM</text>
      
      <text x="130" y="78" font-family="sans-serif" font-size="26" font-weight="900" fill="#0D0647">Nusa Media</text>
      <text x="130" y="100" font-family="sans-serif" font-size="13" font-weight="800" fill="#2511F7" letter-spacing="1.5">MEDIA CREW 2026 • WORK ASSIGNED CARD</text>

      <!-- Status & Priority Badges -->
      <rect x="830" y="58" width="150" height="42" rx="21" fill="${statusBg}"/>
      <text x="905" y="84" font-family="sans-serif" font-size="14" font-weight="800" fill="#FFFFFF" text-anchor="middle">${status}</text>

      <rect x="995" y="58" width="145" height="42" rx="21" fill="#EEF2FF" stroke="#C7D2FE" stroke-width="1.5"/>
      <text x="1067" y="84" font-family="sans-serif" font-size="13" font-weight="800" fill="#2511F7" text-anchor="middle">${priority} PRIORITY</text>

      <!-- Main Clean White Card Container -->
      <rect x="60" y="135" width="1080" height="400" rx="28" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>

      <!-- Category Pill -->
      <rect x="95" y="170" width="210" height="36" rx="10" fill="#EEF2FF" stroke="#C7D2FE" stroke-width="1"/>
      <text x="200" y="193" font-family="sans-serif" font-size="13" font-weight="800" fill="#2511F7" text-anchor="middle">CATEGORY: ${category}</text>

      <!-- Title -->
      <text x="95" y="265" font-family="sans-serif" font-size="36" font-weight="900" fill="#0D0647">${title.length > 50 ? title.substring(0, 47) + '...' : title}</text>

      <!-- Divider line -->
      <line x1="95" y1="350" x2="1105" y2="350" stroke="#F1F5F9" stroke-width="2"/>

      <!-- Info Columns -->
      <text x="95" y="395" font-family="sans-serif" font-size="14" font-weight="700" fill="#64748B">👥 Assigned Member(s):</text>
      <text x="95" y="430" font-family="sans-serif" font-size="22" font-weight="800" fill="#0F172A">${assignees.length > 38 ? assignees.substring(0, 35) + '...' : assignees}</text>

      <text x="560" y="395" font-family="sans-serif" font-size="14" font-weight="700" fill="#64748B">👤 Assigned By:</text>
      <text x="560" y="430" font-family="sans-serif" font-size="20" font-weight="800" fill="#2511F7">${createdByName}</text>

      <text x="920" y="395" font-family="Segoe UI, Roboto, Helvetica, sans-serif" font-size="14" font-weight="700" fill="#E11D48">📅 Due Date:</text>
      <text x="920" y="430" font-family="Segoe UI, Roboto, Helvetica, sans-serif" font-size="22" font-weight="800" fill="#0F172A">${deadlineStr}</text>

      <!-- Footer Note -->
      <text x="60" y="575" font-family="sans-serif" font-size="14" font-weight="600" fill="#64748B">Nusa Media Work Tracking System • 2026</text>
      <text x="1140" y="575" font-family="sans-serif" font-size="14" font-weight="800" fill="#2511F7" text-anchor="end">🔗 Click link to view full task details &amp; progress</text>
    </svg>`;

    // Render SVG into PNG image buffer required by WhatsApp link preview crawler
    const resvg = new Resvg(svg, {
      fitTo: {
        mode: 'width',
        value: 1200,
      },
    });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    return new Response(new Uint8Array(pngBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': pngBuffer.length.toString(),
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (error: any) {
    console.error('OG Image Generation Error:', error);
    return new Response(`Failed to generate dynamic OG card image: ${error?.message || error}`, { status: 500 });
  }
}
