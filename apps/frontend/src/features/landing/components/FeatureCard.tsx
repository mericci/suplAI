import type { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps): React.JSX.Element {
  return (
    <div
      className="rounded-2xl border p-6 flex flex-col gap-4 transition-colors duration-200
        border-black/[0.07] bg-white
        hover:border-black/15 hover:bg-[#fafafa]"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}
      >
        <Icon className="w-5 h-5" style={{ color: 'rgba(0,0,0,0.55)' }} />
      </div>
      <h3 className="font-semibold text-lg" style={{ color: '#0f0f0f' }}>{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: 'rgba(0,0,0,0.52)' }}>
        {description}
      </p>
    </div>
  );
}
