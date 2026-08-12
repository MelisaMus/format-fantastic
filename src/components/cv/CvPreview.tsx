import type { CvData, SkillGroup } from "@/lib/cv";

function Section({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 break-inside-avoid">
      <h2
        className="mb-2 border-b pb-1 text-[1.15em] font-semibold uppercase tracking-[0.14em]"
        style={{ borderColor: "#d9d2c5", color: accent }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function EntryBlock({
  period,
  title,
  org,
  bullets,
  compact,
}: {
  period: string;
  title: string;
  org: string;
  bullets: string[];
  compact: boolean;
}) {
  const points = bullets.filter((b) => b.trim());
  return (
    <div className={`${compact ? "mb-2" : "mb-3"} break-inside-avoid`}>
      <div className="flex gap-4">
        <div className="w-[32mm] shrink-0 text-[0.9em]" style={{ color: "#6a7484" }}>
          {period}
        </div>
        <div className="flex-1">
          <div className="font-semibold">{title}</div>
          {org ? (
            <div className="text-[0.9em] italic" style={{ color: "#5c6675" }}>
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

function Groups({ groups, asList }: { groups: SkillGroup[]; asList: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-3">
      {groups.map((g) => (
        <div key={g.id} className="break-inside-avoid">
          <div className="font-semibold">{g.title}</div>
          {asList ? (
            <ul className="list-disc pl-4 text-[0.95em]">
              {g.items.filter(Boolean).map((i, k) => (
                <li key={k}>{i}</li>
              ))}
            </ul>
          ) : (
            <div className="text-[0.95em]" style={{ color: "#48525f" }}>
              {g.items.filter(Boolean).join(" · ")}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function CvPreview({ data }: { data: CvData }) {
  const s = data.settings;
  const accent = s.accent;
  const compact = s.template === "compact";
  const twoCol = s.template === "twocol";
  const fontSize = (compact ? 9.8 : 10.5) * s.fontScale;

  const sidebar = (
    <>
      {data.skills.length > 0 && (
        <Section title="Kenntnisse" accent={accent}>
          <div className="space-y-2">
            {data.skills.map((g) => (
              <div key={g.id} className="break-inside-avoid">
                <div className="font-semibold">{g.title}</div>
                <div className="text-[0.95em]" style={{ color: "#48525f" }}>
                  {g.items.filter(Boolean).join(" · ")}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
      {data.languages.filter(Boolean).length > 0 && (
        <Section title="Sprachen" accent={accent}>
          <div className="text-[0.95em]">{data.languages.filter(Boolean).join(" · ")}</div>
        </Section>
      )}
    </>
  );

  const main = (
    <>
      {data.experience.length > 0 && (
        <Section title="Beruflicher Werdegang" accent={accent}>
          {data.experience.map((e) => (
            <EntryBlock key={e.id} {...e} compact={compact} />
          ))}
        </Section>
      )}
      {data.education.length > 0 && (
        <Section title="Ausbildung" accent={accent}>
          {data.education.map((e) => (
            <EntryBlock key={e.id} {...e} compact={compact} />
          ))}
        </Section>
      )}
      {data.extras.length > 0 && (
        <Section title="Zusätzliche Erfahrung" accent={accent}>
          <Groups groups={data.extras} asList />
        </Section>
      )}
    </>
  );

  return (
    <article className="sheet print-area shadow-lg" style={{ fontSize: `${fontSize}pt` }}>
      <header className="flex items-start gap-6 border-b pb-4" style={{ borderColor: accent }}>
        <div className="min-w-0 flex-1">
          <h1 className="text-[2.4em] leading-tight" style={{ color: "#22303f" }}>
            {data.name || "Dein Name"}
          </h1>
          {data.headline ? (
            <p className="mt-1 text-[1em] uppercase tracking-[0.12em]" style={{ color: accent }}>
              {data.headline}
            </p>
          ) : null}
          <p className="mt-2 flex flex-wrap gap-x-4 text-[0.9em]" style={{ color: "#5c6675" }}>
            {data.address ? <span>{data.address}</span> : null}
            {data.email ? <span>{data.email}</span> : null}
            {data.phone ? <span>{data.phone}</span> : null}
          </p>
        </div>
        {data.photo ? (
          <img
            src={data.photo}
            alt={data.name ? `Bewerbungsfoto von ${data.name}` : "Bewerbungsfoto"}
            className={`h-[35mm] w-[28mm] shrink-0 object-cover ${
              s.photoShape === "circle" ? "size-[30mm] w-[30mm] rounded-full" : "rounded-sm"
            }`}
            style={{ border: "1px solid #d9d2c5" }}
          />
        ) : null}
      </header>

      {data.summary ? <p className="mt-4">{data.summary}</p> : null}

      {twoCol ? (
        <div className="mt-2 grid grid-cols-[1fr_62mm] gap-8">
          <div>{main}</div>
          <div>{sidebar}</div>
        </div>
      ) : (
        <>
          {main}
          {data.skills.length > 0 && (
            <Section title="Kenntnisse" accent={accent}>
              <Groups groups={data.skills} asList={false} />
            </Section>
          )}
          {data.languages.filter(Boolean).length > 0 && (
            <Section title="Sprachen" accent={accent}>
              <div className="text-[0.95em]">{data.languages.filter(Boolean).join(" · ")}</div>
            </Section>
          )}
        </>
      )}
    </article>
  );
}
