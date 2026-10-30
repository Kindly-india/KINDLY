import { STATS } from "@/lib/marketing-content"
import { cn } from "@/lib/utils"
import { Container } from "./primitives"

const ITEMS = [
  { value: STATS.volunteers, label: "Volunteers" },
  { value: STATS.organisations, label: "Organisations" },
  { value: STATS.hours, label: "Volunteer hours" },
]

/** "Kindly so far" figures, always shown with the date they were true. */
export function StatStrip({ className }: { className?: string }) {
  return (
    <div className={cn("border-y border-border bg-card/60", className)}>
      <Container className="py-8">
        <p className="text-center text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Kindly so far · as of {STATS.asOf}</p>
        <dl className="mt-5 grid grid-cols-3 gap-4 text-center">
          {ITEMS.map((s) => (
            <div key={s.label} className="flex flex-col">
              <dt className="order-2 mt-1 text-sm text-muted-foreground">{s.label}</dt>
              <dd className="text-3xl font-bold tabular-nums tracking-tight text-foreground sm:text-5xl">{s.value.toLocaleString("en-IN")}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </div>
  )
}
