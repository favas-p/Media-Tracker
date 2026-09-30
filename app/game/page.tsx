import { Metadata } from 'next';
import { SnakeVsBlockGame } from '@/components/game/SnakeVsBlockGame';
import { TeamLeaderboard } from '@/components/game/TeamLeaderboard';

export const metadata: Metadata = {
  title: 'Team Relax Zone - Snake vs Block Arcade | Nusa Media',
  description: 'A fun, relaxing vertical arcade game for Nusa Media team members to recharge, play & beat high scores.',
};

export default function GamePage() {
  return (
    <div className="py-2 space-y-8">
      <SnakeVsBlockGame />
      <div className="max-w-4xl mx-auto">
        <TeamLeaderboard />
      </div>
    </div>
  );
}
