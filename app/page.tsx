import { LampContainer } from "@/components/ui/lamp";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Section 1 */}
      <LampContainer>
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white" style={{ fontFamily: 'var(--font-kredit)', fontWeight: 900 }}>
            Her Money. Her AI.
          </h1>
        </div>
      </LampContainer>

      {/* Section 2 */}
      <section className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-900">
        <div className="text-center">
          <h1 className="text-4xl font-semibold text-black dark:text-zinc-50">
            Section Two
          </h1>
        </div>
      </section>
    </div>
  );
}
