import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 bg-[#0A0F1A] text-[#F1F5F9]">
      {/* Hero */}
      <section className="mx-auto flex max-w-7xl flex-col items-center px-6 py-24 text-center">
        <div className="mb-4 rounded-full border border-[#22D77A]/30 bg-[#22D77A]/10 px-4 py-2 text-sm text-[#22D77A]">
          Powered by Google Gemini AI
        </div>

        <h1
          className="text-6xl md:text-8xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          AI FITNESS COACH
        </h1>

        <p className="mt-6 max-w-3xl text-xl text-[#8B96A8]">
          Your personal AI-powered fitness and nutrition companion.
          Generate personalized workouts, analyze meals, improve exercise form,
          and build healthy habits — all in one place.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/login"
            className="rounded-xl bg-[#22D77A] px-8 py-4 text-lg font-semibold text-black transition hover:scale-105"
          >
            Get Started
          </Link>

          <a
            href="#features"
            className="rounded-xl border border-[#1E2637] px-8 py-4 text-lg transition hover:border-[#22D77A]"
          >
            View Features
          </a>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3 text-sm text-[#8B96A8]">
          <span>Next.js</span>
          <span>•</span>
          <span>Supabase</span>
          <span>•</span>
          <span>Gemini AI</span>
          <span>•</span>
          <span>TypeScript</span>
          <span>•</span>
          <span>Tailwind CSS</span>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="mx-auto max-w-7xl px-6 pb-24"
      >
        <h2
          className="mb-12 text-center text-5xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          FEATURES
        </h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              emoji: "🏋️",
              title: "Workout Generator",
              text: "Generate personalized workout routines based on your goals and fitness level.",
            },
            {
              emoji: "🥗",
              title: "Meal Analyzer",
              text: "Analyze meals instantly and receive calories and nutrition insights using AI.",
            },
            {
              emoji: "📸",
              title: "Form Checker",
              text: "Improve your exercise posture with AI-assisted form analysis.",
            },
            {
              emoji: "📊",
              title: "Dashboard",
              text: "Track workouts, calories, habits and monitor your progress.",
            },
            {
              emoji: "🔥",
              title: "Habit Tracker",
              text: "Build healthy routines with consistency tracking.",
            },
            {
              emoji: "🤖",
              title: "Gemini AI",
              text: "Powered by Google's Gemini AI for intelligent recommendations.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-[#1E2637] bg-[#121826] p-6 transition hover:-translate-y-1 hover:border-[#22D77A]"
            >
              <div className="text-5xl">{card.emoji}</div>

              <h3
                className="mt-5 text-3xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {card.title}
              </h3>

              <p className="mt-4 text-[#8B96A8]">
                {card.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[#1E2637] py-24 text-center">
        <h2
          className="text-5xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          READY TO START?
        </h2>

        <p className="mt-5 text-lg text-[#8B96A8]">
          Join AI Fitness Coach and begin your personalized fitness journey today.
        </p>

        <Link
          href="/login"
          className="mt-10 inline-block rounded-xl bg-[#22D77A] px-10 py-4 text-xl font-bold text-black transition hover:scale-105"
        >
          Create Free Account →
        </Link>
      </section>
    </main>
  );
}