import Image from "next/image";
import Link from "next/link";
import HunterQuestTabs from "@/components/hunter/HunterQuestTabs";

const earners = [
  ["Samuel", "Download and test the lat...", "10 XLM"],
  ["James", "Review and implement fe...", "5 XLM"],
  ["Nat.sol", "Finalize marketing strateg...", "12 XLM"],
  ["Saint", "Review and implement fe...", "5 XLM"],
  ["Chioma.stel", "Download and test the lat...", "10 XLM"],
  ["St.sammi", "Finalize marketing strateg...", "12 XLM"],
];

const submissions = [
  ["/dashboard/recent1.svg", "Samuel", "Download and test the lat...", "2 min"],
  ["/dashboard/recent2.svg", "Alice", "Review the project docu...", "5 min"],
  ["/dashboard/recent3.svg", "Michael", "Attend the design feedba...", "30 min"],
  ["/dashboard/recent1.svg", "Jessica", "Finalize wireframes for ap...", "15 min"],
];

export default function HunterDashboard() {
  return (
    <div className="min-h-screen bg-background brutal-grid-bg text-foreground">
      <section className="brutal-border border-x-0 border-t-0 bg-brutal-yellow">
        <div className="mx-auto max-w-[1720px] px-5 py-12 sm:px-8 lg:px-12">
          <h1 className="text-3xl font-black uppercase tracking-tight sm:text-5xl">
            Welcome back, Samuel
          </h1>
          <p className="mt-4 text-base font-medium text-muted-foreground sm:text-lg">
            Take a mission to start earning
          </p>
        </div>
      </section>

      <main className="mx-auto grid max-w-[1720px] gap-5 px-5 sm:px-8 lg:grid-cols-[1fr_420px] lg:px-12 lg:py-6">
        <section>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border border-foreground bg-card p-4 brutal-shadow">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em]">
                First mission checklist
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Skills, wallet, testnet funding and a practice report.
              </p>
            </div>
            <Link
              href="/hunter/onboarding"
              className="inline-flex min-h-11 items-center border border-foreground bg-brutal-lime px-4 text-sm font-bold uppercase"
            >
              Start walkthrough
            </Link>
          </div>
          <HunterQuestTabs />
        </section>

        <aside className="border-foreground/30 lg:border-l lg:pl-8">
          <section className="mt-6 brutal-border brutal-shadow bg-card p-5">
            <h2 className="text-lg font-black uppercase tracking-tight">
              Recent Earners
            </h2>
            <div className="mt-6 space-y-5">
              {earners.map(([name, mission, amount]) => (
                <div
                  key={`${name}-${amount}`}
                  className="grid grid-cols-[34px_1fr_auto] items-center gap-3"
                >
                  <Image
                    src="/dashboard/avatar.png"
                    alt=""
                    width={34}
                    height={34}
                    className="brutal-border"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {mission}
                    </p>
                  </div>
                  <p className="font-black">{amount}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-6 brutal-border brutal-shadow bg-card p-5 pb-8">
            <h2 className="text-lg font-black uppercase tracking-tight">
              Recently Submitted
            </h2>
            <div className="mt-6 space-y-5">
              {submissions.map(([icon, name, mission, time]) => (
                <div
                  key={`${name}-${time}`}
                  className="grid grid-cols-[64px_1fr_auto] items-center gap-3"
                >
                  <Image
                    src={icon}
                    alt=""
                    width={64}
                    height={44}
                    className="h-11 w-16 brutal-border object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-bold">{name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {mission}
                    </p>
                  </div>
                  <p className="text-sm font-bold">{time}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}
