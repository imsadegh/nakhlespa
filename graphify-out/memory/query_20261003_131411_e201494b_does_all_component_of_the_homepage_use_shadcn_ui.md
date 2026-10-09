---
type: "query"
date: "2026-10-03T13:14:11.213731+00:00"
question: "does all component of the homepage use shadcn/ui? my laptop will got hot in homepage what optimization can we apply to its animation?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["HomePage()", "AmbientBackground()", "HeroSection()", "ServicesSection()", "HowItWorksSection()", "BookingCtaSection()", "framer-motion", "shadcn"]
---

# Q: does all component of the homepage use shadcn/ui? my laptop will got hot in homepage what optimization can we apply to its animation?

## Answer

Expanded from original query via graph vocabulary: [homepage, ambientbackground, herosection, servicessection, howitworkssection, bookingctasection, framer, motion, shadcn, components]. The homepage is composed of HomePage, AmbientBackground, HeroSection, ServicesSection, HowItWorksSection, BookingCtaSection, Navbar, and Footer. These sections and visuals are custom components, while shadcn primitives are available in the project UI layer; not every homepage component uses shadcn/ui. The continuous full-screen ParticleCanvas in AmbientBackground is the strongest likely heat source: its requestAnimationFrame loop runs indefinitely, throttling to 30fps only while idle and 60fps during interaction. One-time Framer Motion reveal animations and small CSS shimmer/pulse effects also exist. Recommend first pausing the canvas when inactive or honoring reduced motion, then lower particle counts and remove the continuous shimmer; profile before and after.

## Outcome

- Signal: useful

## Source Nodes

- HomePage()
- AmbientBackground()
- HeroSection()
- ServicesSection()
- HowItWorksSection()
- BookingCtaSection()
- framer-motion
- shadcn