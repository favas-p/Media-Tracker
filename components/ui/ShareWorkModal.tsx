/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Share2,
  Copy,
  Check,
  Download,
  X,
  ImageIcon,
  Loader2,
} from 'lucide-react';
import { WorkDTO } from '@/types';
import { format } from 'date-fns';

interface ShareWorkModalProps {
  work: WorkDTO;
  isOpen: boolean;
  onClose: () => void;
}

// Client-side HTML5 Canvas PNG Card Image Generator (Clean White Theme Style)
async function generateCardPNG(work: WorkDTO): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');

  // Clean Light Theme Background
  const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
  gradient.addColorStop(0, '#F4F6FF');
  gradient.addColorStop(1, '#EBEFFF');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 630);

  // Soft Glowing Accent Circles
  ctx.fillStyle = '#2511F7';
  ctx.globalAlpha = 0.06;
  ctx.beginPath();
  ctx.arc(100, 100, 300, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFE600';
  ctx.globalAlpha = 0.12;
  ctx.beginPath();
  ctx.arc(1100, 500, 300, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1.0;

  // Outer Border Frame
  ctx.strokeStyle = '#2511F7';
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.2;
  ctx.strokeRect(16, 16, 1168, 598);
  ctx.globalAlpha = 1.0;

  // Logo Box
  ctx.fillStyle = '#2511F7';
  ctx.beginPath();
  ctx.roundRect(60, 52, 54, 54, 16);
  ctx.fill();

  ctx.fillStyle = '#FFE600';
  ctx.font = '900 22px Segoe UI, Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('NM', 87, 87);

  // Brand Name
  ctx.textAlign = 'left';
  ctx.fillStyle = '#0D0647';
  ctx.font = '900 26px Segoe UI, Roboto, sans-serif';
  ctx.fillText('Nusa Media', 130, 78);

  ctx.fillStyle = '#2511F7';
  ctx.font = '800 13px Segoe UI, Roboto, sans-serif';
  ctx.fillText('MEDIA CREW 2026 • WORK ASSIGNED CARD', 130, 100);

  // Status Badge
  const statusStr = (work.status || 'pending').replace('_', ' ').toUpperCase();
  const statusBg =
    statusStr === 'COMPLETED' ? '#10B981' : statusStr === 'IN PROGRESS' ? '#2511F7' : '#F59E0B';
  ctx.fillStyle = statusBg;
  ctx.beginPath();
  ctx.roundRect(830, 58, 150, 42, 21);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 14px Segoe UI, Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(statusStr, 905, 84);

  // Priority Badge
  const priorityStr = (work.priority || 'medium').toUpperCase() + ' PRIORITY';
  ctx.fillStyle = '#EEF2FF';
  ctx.beginPath();
  ctx.roundRect(995, 58, 145, 42, 21);
  ctx.fill();
  ctx.strokeStyle = '#C7D2FE';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#2511F7';
  ctx.font = '800 13px Segoe UI, Roboto, sans-serif';
  ctx.fillText(priorityStr, 1067, 84);

  // Main White Card Container
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(60, 135, 1080, 400, 28);
  ctx.fill();
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Category Tag
  const categoryStr = 'CATEGORY: ' + (work.category || 'other').toUpperCase();
  ctx.fillStyle = '#EEF2FF';
  ctx.beginPath();
  ctx.roundRect(95, 170, 210, 36, 10);
  ctx.fill();
  ctx.strokeStyle = '#C7D2FE';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#2511F7';
  ctx.font = '800 13px Segoe UI, Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(categoryStr, 200, 193);

  // Work Title
  ctx.textAlign = 'left';
  ctx.fillStyle = '#0D0647';
  ctx.font = '900 36px Segoe UI, Roboto, sans-serif';
  const displayTitle = work.title.length > 48 ? work.title.substring(0, 45) + '...' : work.title;
  ctx.fillText(displayTitle, 95, 265);

  // Divider Line
  ctx.strokeStyle = '#F1F5F9';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(95, 350);
  ctx.lineTo(1105, 350);
  ctx.stroke();

  // Assigned Members
  const assignedNames =
    (work.assignedTo || []).map((u) => u.name).join(', ') || 'Team Members';
  ctx.fillStyle = '#64748B';
  ctx.font = '700 14px Segoe UI, Roboto, sans-serif';
  ctx.fillText('👥 Assigned Member(s):', 95, 395);

  ctx.fillStyle = '#0F172A';
  ctx.font = '800 22px Segoe UI, Roboto, sans-serif';
  const displayAssignees =
    assignedNames.length > 36 ? assignedNames.substring(0, 33) + '...' : assignedNames;
  ctx.fillText(displayAssignees, 95, 430);

  // Assigned By
  const createdByName = work.createdBy?.name || 'Chairman';
  ctx.fillStyle = '#64748B';
  ctx.font = '700 14px Segoe UI, Roboto, sans-serif';
  ctx.fillText('👤 Assigned By:', 560, 395);

  ctx.fillStyle = '#2511F7';
  ctx.font = '800 20px Segoe UI, Roboto, sans-serif';
  ctx.fillText(createdByName, 560, 430);

  // Due Date
  const deadlineStr = work.deadline
    ? format(new Date(work.deadline), 'dd MMM yyyy')
    : 'No Deadline';
  ctx.fillStyle = '#E11D48';
  ctx.font = '700 14px Segoe UI, Roboto, sans-serif';
  ctx.fillText('📅 Due Date:', 920, 395);

  ctx.fillStyle = '#0F172A';
  ctx.font = '800 22px Segoe UI, Roboto, sans-serif';
  ctx.fillText(deadlineStr, 920, 430);

  // Footer Branding
  ctx.fillStyle = '#64748B';
  ctx.font = '600 14px Segoe UI, Roboto, sans-serif';
  ctx.fillText('Nusa Media Work Tracking System • 2026', 60, 575);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#2511F7';
  ctx.font = '800 14px Segoe UI, Roboto, sans-serif';
  ctx.fillText('🔗 Click link to view full task details & progress', 1140, 575);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to generate PNG blob'));
    }, 'image/png');
  });
}

export function ShareWorkModal({ work, isOpen, onClose }: ShareWorkModalProps) {
  const [copied, setCopied] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  // Build full absolute URL
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = `${origin}/works/${work.id}`;
  const ogImageUrl = `/api/og/work/${work.id}`;

  const assignedNames =
    (work.assignedTo || []).map((u) => u.name).join(', ') || 'Team Members';
  const createdByName = work.createdBy?.name || 'Chairman';
  const deadlineStr = work.deadline
    ? format(new Date(work.deadline), 'dd MMM yyyy')
    : 'No Deadline';
  const statusStr = (work.status || 'pending').replace('_', ' ').toUpperCase();

  // Formatted WhatsApp & messaging text
  const shareText = `📋 *NUSA MEDIA WORK TASK*
📌 *Task:* ${work.title}
👥 *Assigned To:* ${assignedNames}
👤 *Assigned By:* ${createdByName}
📅 *Due Date:* ${deadlineStr}
📊 *Status:* ${statusStr}

🔗 *Work Details Link:*
${shareUrl}`;

  // 1. Share via WhatsApp (Text + Link)
  const handleWhatsAppShare = () => {
    const encodedText = encodeURIComponent(shareText);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  // 2. Share Image File directly via Native Share API (WhatsApp/Apps on mobile)
  const handleShareImageFile = async () => {
    try {
      setIsDownloading(true);
      const blob = await generateCardPNG(work);
      const file = new File([blob], `nusa-work-card-${work.id.slice(-6)}.png`, {
        type: 'image/png',
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Work Task: ${work.title}`,
          text: shareText,
        });
      } else if (navigator.share) {
        await navigator.share({
          title: `Work Task: ${work.title}`,
          text: shareText,
          url: shareUrl,
        });
      } else {
        handleWhatsAppShare();
      }
    } catch (err) {
      console.log('Share canceled or error', err);
      handleWhatsAppShare();
    } finally {
      setIsDownloading(false);
    }
  };

  // 3. Download PNG Card Image directly
  const handleDownloadImage = async () => {
    try {
      setIsDownloading(true);
      const blob = await generateCardPNG(work);
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `nusa-work-card-${work.id.slice(-6)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error('Failed to generate PNG image download', e);
      window.open(ogImageUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  // 4. Copy Link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-lg bg-white dark:bg-[#0D0647] border border-slate-200 dark:border-blue-900/50 rounded-[32px] shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 font-sans"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-blue-900/40 flex items-center justify-between bg-slate-50/60 dark:bg-blue-950/40">
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-[#2511F7] dark:text-[#FFE600]" />
              <h3 className="font-extrabold text-base tracking-tight text-[#0D0647] dark:text-white">
                Share Assigned Work
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-blue-900/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Dynamic Card Image Preview Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#2511F7] dark:text-[#FFE600]" />
                  Work Card Graphic Preview (Clean White Theme):
                </span>
                <button
                  type="button"
                  onClick={() => setShowImagePreview(!showImagePreview)}
                  className="text-xs font-bold text-[#2511F7] dark:text-[#FFE600] hover:underline flex items-center gap-1"
                >
                  {showImagePreview ? 'Hide Preview' : 'View Card Preview'}
                </button>
              </div>

              {/* Work Card Preview Graphic */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-blue-900/40 bg-white">
                <img
                  src={ogImageUrl}
                  alt={work.title}
                  className={`w-full object-cover transition-all duration-300 ${
                    showImagePreview ? 'max-h-64 opacity-100' : 'h-36 opacity-95'
                  }`}
                />
                <div className="absolute bottom-2 right-2 flex items-center gap-2">
                  <button
                    onClick={handleDownloadImage}
                    disabled={isDownloading}
                    className="px-3.5 py-1.5 rounded-full bg-white/90 hover:bg-white text-[#0D0647] text-[11px] font-extrabold flex items-center gap-1.5 backdrop-blur-md border border-slate-200 shadow-lg transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isDownloading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2511F7]" />
                    ) : (
                      <Download className="w-3.5 h-3.5 text-[#2511F7]" />
                    )}
                    <span>Download PNG Card</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Formatted Text Details Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                Share Text & Link Details:
              </label>
              <div className="p-3.5 bg-slate-50 dark:bg-[#150B6E] border border-slate-200 dark:border-blue-900/40 rounded-2xl text-xs font-mono text-slate-700 dark:text-slate-200 space-y-1 select-all">
                <p className="font-semibold">{work.title}</p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Assigned to: {assignedNames} • Due: {deadlineStr}
                </p>
                <p className="text-[#2511F7] dark:text-[#FFE600] font-sans text-[11px] truncate pt-1">
                  {shareUrl}
                </p>
              </div>
            </div>

            {/* Share Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {/* WhatsApp Direct Text & Link Share */}
              <button
                onClick={handleWhatsAppShare}
                className="w-full py-3 px-4 rounded-full bg-[#25D366] hover:bg-[#1DA851] text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.156 4.22 4.316-1.134z" />
                </svg>
                Share on WhatsApp
              </button>

              {/* Share Card Image + Text via Native Apps */}
              <button
                onClick={handleShareImageFile}
                disabled={isDownloading}
                className="w-full py-3 px-4 rounded-full bg-[#2511F7] hover:bg-[#1B07DB] text-white font-extrabold text-xs shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
                Share Card Image
              </button>

              {/* Copy Link */}
              <button
                onClick={handleCopyLink}
                className={`w-full sm:col-span-2 py-3 px-4 rounded-full border font-extrabold text-xs flex items-center justify-center gap-2 transition-all ${
                  copied
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'border-slate-200 dark:border-blue-900/60 bg-slate-100 dark:bg-blue-950/60 text-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-blue-900'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Task Link Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Task Details Link
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
