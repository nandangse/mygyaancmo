import { Megaphone } from 'lucide-react';

export default function CampaignsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Megaphone className="w-16 h-16 text-purple-400" />
      <h1 className="text-2xl font-bold">Campaigns</h1>
      <p className="text-gray-500">Multi-channel campaign builder — coming in Phase 2.</p>
    </div>
  );
}
