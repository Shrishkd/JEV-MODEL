import { Nav } from "@/components/blog/Nav";
import { Hero } from "@/components/blog/Hero";
import { WhatIsJev } from "@/components/blog/WhatIsJev";
import { SystemOneTwo } from "@/components/blog/SystemOneTwo";
import { Origin } from "@/components/blog/Origin";
import { HowItWorks } from "@/components/blog/HowItWorks";
import { VsLlm } from "@/components/blog/VsLlm";
import { Calibration } from "@/components/blog/Calibration";
import { Architecture } from "@/components/blog/Architecture";
import { ReviewAspects } from "@/components/blog/ReviewAspects";
import { UseCases } from "@/components/blog/UseCases";
import { Impact } from "@/components/blog/Impact";
import { Limitations } from "@/components/blog/Limitations";
import { Ecosystem } from "@/components/blog/Ecosystem";
import { VideoNotes } from "@/components/blog/VideoNotes";
import { Quiz } from "@/components/blog/Quiz";
import { Footer } from "@/components/blog/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <Hero />
        <WhatIsJev />
        <SystemOneTwo />
        <Origin />
        <HowItWorks />
        <VsLlm />
        <Calibration />
        <Architecture />
        <ReviewAspects />
        <UseCases />
        <Impact />
        <Limitations />
        <Ecosystem />
        <VideoNotes />
        <Quiz />
      </main>
      <Footer />
    </>
  );
}
