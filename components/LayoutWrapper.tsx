'use client';

import { useAuth } from '@/lib/auth';
import TopNav from '@/components/TopNav';
import AsideNav from '@/components/AsideNav';
import Footer from '@/components/Footer';
import { OnboardingBanner } from '@/components/OnboardingBanner';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bond-pink"></div>
      </div>
    );
  }

  if (user) {
    // Authenticated layout with sidebar
    return (
      <div className="min-h-screen bg-bond-cream">
        {/* Global Logo - Desktop only, mobile handled by AsideNav */}
        <div className="hidden lg:flex fixed top-4 left-4 z-50 items-center gap-2 px-3 py-2 cursor-pointer" onClick={() => window.location.href = '/'}>
          <img
            src="/bond-logo.png"
            alt="Bond Logo"
            width="24"
            height="24"
            className="object-contain"
          />
          <span className="text-[18px] font-semibold leading-none tracking-tight text-[#111827]">
            Bond
          </span>
        </div>
        <AsideNav user={user} />
        <main className="lg:ml-64 pt-16 lg:pt-0">
          <OnboardingBanner />
          {children}
        </main>
      </div>
    );
  }

  // Unauthenticated layout with top nav and footer
  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <main className="flex-1 pt-24">
        {children}
      </main>
      <Footer />
    </div>
  );
}
