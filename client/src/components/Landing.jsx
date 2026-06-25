// Landing / home page — port of the original Next.js `app/page.tsx`.
import { useRef } from 'react';
import LenisWrapper from './LenisWrapper';
import PageWithLoader from './PageWithLoader';
import HeroSection from './sections/HeroSection';
import AboutSection from './sections/AboutSection';
import ContactsSection from './sections/ContactSection';

export default function Landing() {
  const contactsSectionRef = useRef(null);

  return (
    <LenisWrapper>
      <main className="min-h-dvh overflow-hidden w-screen relative bg-neutral-900">
        <PageWithLoader>
          <HeroSection />
          <AboutSection />
          <ContactsSection contactsSectionRef={contactsSectionRef} />
        </PageWithLoader>
      </main>
    </LenisWrapper>
  );
}
