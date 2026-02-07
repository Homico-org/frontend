'use client';

import Button, { ButtonIcons } from '@/components/common/Button';
import { useState } from 'react';

export default function UIShowcase() {
  const [loadingBtn, setLoadingBtn] = useState<string | null>(null);

  const simulateLoading = (id: string) => {
    setLoadingBtn(id);
    setTimeout(() => setLoadingBtn(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      {/* Header */}
      <header className="border-b border-neutral-200 sticky top-0 bg-[#f8f7f4]/95 backdrop-blur-sm z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold text-neutral-800">UI Components</span>
            <span className="text-xs text-neutral-400">temp</span>
          </div>
          <Button variant="ghost" href="/portfolio" size="sm">
            Back to App
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-10">

        {/* Section: Buttons */}
        <section>
          <h2 className="text-xl font-semibold text-neutral-800 mb-6">Button</h2>

          <div className="space-y-6">

            {/* Primary */}
            <div className="p-5 rounded-xl border border-neutral-200 bg-white">
              <p className="text-xs text-neutral-500 mb-4 font-mono">
                {`variant="primary"`}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" size="sm">Small</Button>
                <Button variant="primary" size="md">Medium</Button>
                <Button variant="primary" size="lg">Large</Button>
                <Button variant="primary" icon={<ButtonIcons.Chat />}>With Icon</Button>
                <Button variant="primary" icon={<ButtonIcons.Arrow />} iconPosition="right">Icon Right</Button>
                <Button variant="primary" showPulse>With Pulse</Button>
                <Button variant="primary" loading={loadingBtn === 'p1'} onClick={() => simulateLoading('p1')}>
                  Click to Load
                </Button>
                <Button variant="primary" disabled>Disabled</Button>
              </div>
            </div>

            {/* Secondary */}
            <div className="p-5 rounded-xl border border-neutral-200 bg-white">
              <p className="text-xs text-neutral-500 mb-4 font-mono">
                {`variant="secondary"`}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="secondary" size="sm">Small</Button>
                <Button variant="secondary" size="md">Medium</Button>
                <Button variant="secondary" size="lg">Large</Button>
                <Button variant="secondary" icon={<ButtonIcons.Heart />}>With Icon</Button>
                <Button variant="secondary" disabled>Disabled</Button>
              </div>
            </div>

            {/* Outline */}
            <div className="p-5 rounded-xl border border-neutral-200 bg-white">
              <p className="text-xs text-neutral-500 mb-4 font-mono">
                {`variant="outline"`}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" size="sm">Small</Button>
                <Button variant="outline" size="md">Medium</Button>
                <Button variant="outline" size="lg">Large</Button>
                <Button variant="outline" icon={<ButtonIcons.Plus />}>With Icon</Button>
                <Button variant="outline" disabled>Disabled</Button>
              </div>
            </div>

            {/* Ghost */}
            <div className="p-5 rounded-xl border border-neutral-200 bg-white">
              <p className="text-xs text-neutral-500 mb-4 font-mono">
                {`variant="ghost"`}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="ghost" size="sm">Small</Button>
                <Button variant="ghost" size="md">Medium</Button>
                <Button variant="ghost" size="lg">Large</Button>
                <Button variant="ghost" icon={<ButtonIcons.Calendar />}>With Icon</Button>
                <Button variant="ghost" disabled>Disabled</Button>
              </div>
            </div>

            {/* Full Width */}
            <div className="p-5 rounded-xl border border-neutral-200 bg-white">
              <p className="text-xs text-neutral-500 mb-4 font-mono">fullWidth=true</p>
              <div className="max-w-sm space-y-2">
                <Button variant="primary" fullWidth icon={<ButtonIcons.Send />}>
                  Send Message
                </Button>
                <Button variant="secondary" fullWidth>
                  Cancel
                </Button>
              </div>
            </div>

            {/* As Link */}
            <div className="p-5 rounded-xl border border-neutral-200 bg-white">
              <p className="text-xs text-neutral-500 mb-4 font-mono">
                {`href="/portfolio"`}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" href="/portfolio" icon={<ButtonIcons.Arrow />} iconPosition="right">
                  Go to Browse
                </Button>
                <Button variant="outline" href="/portfolio">
                  Link Button
                </Button>
              </div>
            </div>

          </div>
        </section>

        {/* Icons */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-neutral-800 mb-6">ButtonIcons</h2>
          <div className="p-5 rounded-xl border border-neutral-200 bg-white">
            <div className="flex flex-wrap gap-4">
              {Object.entries(ButtonIcons).map(([name, Icon]) => (
                <div key={name} className="flex flex-col items-center gap-1.5 p-2">
                  <div className="w-5 h-5 text-neutral-600">
                    <Icon />
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Usage */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-neutral-800 mb-6">Usage</h2>
          <div className="p-5 rounded-xl border border-neutral-200 bg-white font-mono text-xs text-neutral-600 overflow-x-auto">
            <pre>{`import Button, { ButtonIcons } from '@/components/common/Button';

<Button variant="primary">Click me</Button>
<Button variant="primary" icon={<ButtonIcons.Chat />}>Message</Button>
<Button href="/portfolio" variant="outline">Link</Button>
<Button variant="primary" fullWidth loading={isLoading}>Submit</Button>`}</pre>
          </div>
        </section>

      </main>
    </div>
  );
}
