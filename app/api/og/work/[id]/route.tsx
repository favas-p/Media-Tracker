import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/db';
import Work from '@/models/Work';
import User from '@/models/User';
import { format } from 'date-fns';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

    const title = work.title || 'Work Task';
    const category = (work.category || 'task').toUpperCase();
    const priority = (work.priority || 'medium').toUpperCase();
    const status = (work.status || 'pending').replace('_', ' ').toUpperCase();

    const createdByName = work.createdBy?.name || 'Chairman';
    const assignees = (work.assignedTo || []).map((u: any) => u.name).join(', ') || 'Team Members';
    const deadlineStr = work.deadline ? format(new Date(work.deadline), 'dd MMM yyyy') : 'No Deadline';

    const statusBg = status === 'COMPLETED' ? '#10B981' : status === 'IN PROGRESS' ? '#2511F7' : '#F59E0B';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: '#F4F6FF',
            padding: '48px',
            fontFamily: 'sans-serif',
            color: '#0D0647',
            boxSizing: 'border-box',
          }}
        >
          {/* Top Brand Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '16px',
                  backgroundColor: '#2511F7',
                  color: '#FFE600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '22px',
                }}
              >
                NM
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontSize: '26px',
                    fontWeight: 900,
                    color: '#0D0647',
                    letterSpacing: '-0.5px',
                  }}
                >
                  Nusa Media
                </span>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    color: '#2511F7',
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                  }}
                >
                  MEDIA CREW 2026 • WORK ASSIGNED CARD
                </span>
              </div>
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px 20px',
                  borderRadius: '999px',
                  backgroundColor: statusBg,
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 800,
                  letterSpacing: '0.5px',
                }}
              >
                {status}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px 20px',
                  borderRadius: '999px',
                  backgroundColor: '#EEF2FF',
                  border: '1.5px solid #C7D2FE',
                  color: '#2511F7',
                  fontSize: '13px',
                  fontWeight: 800,
                }}
              >
                {priority} PRIORITY
              </div>
            </div>
          </div>

          {/* Main Clean White Card Container */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#FFFFFF',
              border: '2px solid #E2E8F0',
              borderRadius: '28px',
              padding: '36px',
              gap: '20px',
              boxShadow: '0 12px 32px rgba(13, 6, 71, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px 14px',
                  borderRadius: '10px',
                  backgroundColor: '#EEF2FF',
                  border: '1px solid #C7D2FE',
                  color: '#2511F7',
                  fontSize: '13px',
                  fontWeight: 800,
                }}
              >
                CATEGORY: {category}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                fontSize: '36px',
                fontWeight: 900,
                color: '#0D0647',
                lineHeight: 1.25,
                margin: 0,
                letterSpacing: '-0.5px',
              }}
            >
              {title.length > 50 ? title.substring(0, 47) + '...' : title}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '16px',
                borderTop: '2px solid #F1F5F9',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 700 }}>
                  👥 Assigned Member(s):
                </span>
                <span style={{ fontSize: '22px', color: '#0F172A', fontWeight: 800 }}>
                  {assignees.length > 38 ? assignees.substring(0, 35) + '...' : assignees}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 700 }}>
                  👤 Assigned By:
                </span>
                <span style={{ fontSize: '20px', color: '#2511F7', fontWeight: 800 }}>
                  {createdByName}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'right' }}>
                <span style={{ fontSize: '13px', color: '#E11D48', fontWeight: 700 }}>
                  📅 Due Date:
                </span>
                <span style={{ fontSize: '22px', color: '#0F172A', fontWeight: 800 }}>
                  {deadlineStr}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Branding */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 600 }}>
              Nusa Media Work Tracking System • 2026
            </span>
            <span style={{ fontSize: '14px', color: '#2511F7', fontWeight: 800 }}>
              🔗 Click link to view full task details & progress
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error: any) {
    console.error('OG Image Generation Error:', error);
    return new Response(`Failed to generate dynamic OG card image: ${error?.message || error}`, { status: 500 });
  }
}
