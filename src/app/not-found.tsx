'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function NotFound() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#FFFAF5] dark:bg-[#1a1412] flex items-center justify-center">
      {/* Animated background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large terracotta orb */}
        <div
          className="absolute w-[800px] h-[800px] rounded-full opacity-20 dark:opacity-10 blur-[120px] transition-transform duration-1000 ease-out"
          style={{
            background: 'radial-gradient(circle, #C96D4D 0%, transparent 70%)',
            top: '10%',
            right: '-20%',
            transform: `translate(${mousePosition.x * -0.5}px, ${mousePosition.y * -0.5}px)`,
          }}
        />
        {/* Secondary warm orb */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-15 dark:opacity-10 blur-[100px] transition-transform duration-1000 ease-out"
          style={{
            background: 'radial-gradient(circle, #E8A87C 0%, transparent 70%)',
            bottom: '-10%',
            left: '-15%',
            transform: `translate(${mousePosition.x * 0.3}px, ${mousePosition.y * 0.3}px)`,
          }}
        />
        {/* Accent orb */}
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-10 dark:opacity-5 blur-[80px] transition-transform duration-1000 ease-out"
          style={{
            background: 'radial-gradient(circle, #D4A08C 0%, transparent 70%)',
            top: '60%',
            right: '20%',
            transform: `translate(${mousePosition.x * 0.8}px, ${mousePosition.y * 0.8}px)`,
          }}
        />
      </div>

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `
            linear-gradient(#C96D4D 1px, transparent 1px),
            linear-gradient(90deg, #C96D4D 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Main content */}
      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        {/* Glitchy 404 number */}
        <div
          className={`relative mb-8 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          {/* Shadow layers for depth */}
          <span
            className="absolute inset-0 text-[180px] sm:text-[220px] md:text-[280px] font-black tracking-tighter select-none"
            style={{
              color: 'transparent',
              WebkitTextStroke: '2px rgba(201, 109, 77, 0.1)',
              transform: 'translate(8px, 8px)',
            }}
          >
            404
          </span>
          <span
            className="absolute inset-0 text-[180px] sm:text-[220px] md:text-[280px] font-black tracking-tighter select-none"
            style={{
              color: 'transparent',
              WebkitTextStroke: '2px rgba(201, 109, 77, 0.15)',
              transform: 'translate(4px, 4px)',
            }}
          >
            404
          </span>

          {/* Main number with gradient */}
          <h1
            className="text-[180px] sm:text-[220px] md:text-[280px] font-black tracking-tighter leading-none"
            style={{
              background: 'linear-gradient(135deg, #C96D4D 0%, #E8A87C 50%, #C96D4D 100%)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'gradientShift 8s ease-in-out infinite',
            }}
          >
            404
          </h1>

          {/* Floating decorative elements */}
          <div
            className="absolute -top-4 -right-4 w-16 h-16 rounded-2xl bg-terracotta-500/10 dark:bg-terracotta-500/20 backdrop-blur-sm border border-terracotta-500/20 animate-float"
            style={{ animationDelay: '0s' }}
          />
          <div
            className="absolute -bottom-2 -left-8 w-10 h-10 rounded-xl bg-terracotta-400/10 dark:bg-terracotta-400/20 backdrop-blur-sm border border-terracotta-400/20 animate-float"
            style={{ animationDelay: '1s' }}
          />
          <div
            className="absolute top-1/2 -left-12 w-6 h-6 rounded-lg bg-terracotta-300/20 dark:bg-terracotta-300/10 animate-float"
            style={{ animationDelay: '2s' }}
          />
        </div>

        {/* Message */}
        <div
          className={`transition-all duration-1000 delay-200 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-800 dark:text-neutral-100 mb-4 tracking-tight">
            გვერდი ვერ მოიძებნა
          </h2>
          <p className="text-base sm:text-lg text-neutral-500 dark:text-neutral-400 mb-10 max-w-md mx-auto leading-relaxed">
            სამწუხაროდ, თქვენ მიერ მოთხოვნილი გვერდი არ არსებობს ან გადატანილია სხვა მისამართზე.
          </p>
        </div>

        {/* Action buttons */}
        <div
          className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-1000 delay-400 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <Link
            href="/"
            className="group relative px-8 py-4 bg-terracotta-500 text-white font-semibold rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_20px_40px_-12px_rgba(201,109,77,0.4)] hover:-translate-y-1"
          >
            {/* Shine effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div
                className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                }}
              />
            </div>
            <span className="relative flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              მთავარ გვერდზე
            </span>
          </Link>

          <Link
            href="/professionals"
            className="group px-8 py-4 bg-transparent text-terracotta-600 dark:text-terracotta-400 font-semibold rounded-2xl border-2 border-terracotta-200 dark:border-terracotta-700/50 hover:border-terracotta-500 dark:hover:border-terracotta-500 hover:bg-terracotta-50 dark:hover:bg-terracotta-500/10 transition-all duration-300"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              სპეციალისტების ძებნა
            </span>
          </Link>
        </div>

        {/* Helpful links */}
        <div
          className={`mt-16 pt-8 border-t border-terracotta-200/50 dark:border-terracotta-700/30 transition-all duration-1000 delay-600 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <p className="text-sm text-neutral-400 dark:text-neutral-500 mb-4">
            პოპულარული გვერდები
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { href: '/professionals', label: 'სპეციალისტები' },
              { href: '/post-job', label: 'პროექტის დამატება' },
              { href: '/become-pro', label: 'გახდი პრო' },
              { href: '/help', label: 'დახმარება' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-terracotta-600 dark:hover:text-terracotta-400 bg-neutral-100/50 dark:bg-neutral-800/50 hover:bg-terracotta-50 dark:hover:bg-terracotta-500/10 rounded-xl transition-all duration-200"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Animated corner decorations */}
      <div className="absolute top-0 left-0 w-64 h-64 pointer-events-none">
        <div
          className="absolute top-8 left-8 w-32 h-32 border-l-2 border-t-2 border-terracotta-300/30 dark:border-terracotta-600/20 rounded-tl-3xl"
          style={{
            transform: `translate(${mousePosition.x * 0.2}px, ${mousePosition.y * 0.2}px)`,
          }}
        />
      </div>
      <div className="absolute bottom-0 right-0 w-64 h-64 pointer-events-none">
        <div
          className="absolute bottom-8 right-8 w-32 h-32 border-r-2 border-b-2 border-terracotta-300/30 dark:border-terracotta-600/20 rounded-br-3xl"
          style={{
            transform: `translate(${mousePosition.x * -0.2}px, ${mousePosition.y * -0.2}px)`,
          }}
        />
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes gradientShift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-10px) rotate(3deg);
          }
        }

        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
