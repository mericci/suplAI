'use client';

import { useState } from 'react';
import { LandingNav } from './components/LandingNav';
import { LandingFooter } from './components/LandingFooter';
import { DemoFormModal } from './components/DemoFormModal';
import { StickyDemoButton } from './components/StickyDemoButton';
import { HeroSection } from './sections/HeroSection';
import { MetricsBar } from './sections/MetricsBar';
import { WorkflowSection } from './sections/WorkflowSection';
import { FeaturesSection } from './sections/FeaturesSection';
import { AISection } from './sections/AISection';
import { SecuritySection } from './sections/SecuritySection';
import { CTASection } from './sections/CTASection';

export function LandingPage(): React.JSX.Element {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <div
      className="landing min-h-screen flex flex-col"
      style={{ backgroundColor: '#f2f1ee', color: '#0f0f0f' }}
    >
      <LandingNav onDemoOpen={() => setDemoOpen(true)} />
      <main className="flex-1 flex flex-col">
        <HeroSection onDemoOpen={() => setDemoOpen(true)} />
        <MetricsBar />
        <WorkflowSection />
        <FeaturesSection />
        <AISection />
        <SecuritySection />
        <CTASection onDemoOpen={() => setDemoOpen(true)} />
      </main>
      <LandingFooter />
      <StickyDemoButton onOpen={() => setDemoOpen(true)} />
      <DemoFormModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}
