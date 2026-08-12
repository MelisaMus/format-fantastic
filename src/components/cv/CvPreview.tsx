import type { CvData } from "@/lib/cv";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h2
        className="mb-2 border-b pb-1 text-[12pt] font-normal uppercase tracking-[0.14em]"
        style={{ borderColor: "#d9d2c5", color: "#2d3a4d" }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function EntryBlock({ period, title, org, bullets }: { period: string; title: string; org: string; bullets: string[] }) {
  const points = bullets.filter((b) => b.trim());
  return (
    <div className="mb-3 break-inside-avoid">
      <div className="flex gap-4">
        <div className="w-[32mm] shrink-0 text-[9.5pt]" style={{ color: "#6a7484" }}>
          {period}
        </div>
        <div className="flex-1">
          <div className="font-semibold">{title}</div>
          {org ? (
            <div className="text-[9.5pt] italic" style={{ color: "#5c6675" }}>
              {org}
            </div>
          ) : null}
          {points.length > 0 && (
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              {points.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export function CvPreview({ data }: { data: CvData }) {
  return (
    <article className="sheet print-area shadow-lg">
      <header className="flex items-start gap-6 border-b pb-4" style={{ borderColor: "#c9702f" }}>
        <div className="min-w-0 flex-1">
          <h1 className="text-[26pt] leading-tight" style={{ color: "#22303f" }}>
            {data.name || "Dein Name"}
          </h1>
          {data.headline ? (
            <p className="mt-1 text-[10.5pt] uppercase tracking-[0.12em]" style={{ color: "#c9702f" }}>
              {data.headline}
            </p>
          ) : null}
          <p className="mt-2 flex flex-wrap gap-x-4 text-[9.5pt]" style={{ color: "#5c6675" }}>
            {data.address ? <span>{data.address}</span> : null}
            {data.email ? <span>{data.email}</span> : null}
            {data.phone ? <span>{data.phone}</span> : null}
          </p>
        </div>
        {data.photo ? (
          <img
            src={data.photo}
            alt={data.name ? `Bewerbungsfoto von ${data.name}` : "Bewerbungsfoto"}
            className="h-[35mm] w-[28mm] shrink-0 rounded-sm object-cover"
            style={{ border: "1px solid #d9d2c5" }}
          />
        ) : null}
      </header>

      {data.summary ? <p className="mt-4 text-[10.5pt]">{data.summary}</p> : null}

      {data.experience.length > 0 && (
        <Section title="Beruflicher Werdegang">
          {data.experience.map((e) => (
            <EntryBlock key={e.id} {...e} />
          ))}
        </Section>
      )}

      {data.education.length > 0 && (
        <Section title="Ausbildung">
          {data.education.map((e) => (
            <EntryBlock key={e.id} {...e} />
          ))}
        </Section>
      )}

      {data.skills.length > 0 && (
        <Section title="Kenntnisse">
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            {data.skills.map((g) => (
              <div key={g.id} className="break-inside-avoid">
                <div className="font-semibold">{g.title}</div>
                <div className="text-[10pt]" style={{ color: "#48525f" }}>
                  {g.items.join(" · ")}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {data.languages.length > 0 && (
        <Section title="Sprachen">
          <div className="text-[10pt]">{data.languages.join(" · ")}</div>
        </Section>
      )}

      {data.extras.length > 0 && (
        <Section title="Zusätzliche Erfahrung">
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            {data.extras.map((g) => (
              <div key={g.id} className="break-inside-avoid">
                <div className="font-semibold">{g.title}</div>
                <ul className="list-disc pl-4 text-[10pt]">
                  {g.items.map((i, k) => (
                    <li key={k}>{i}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      )}
    </article>
  );
}
