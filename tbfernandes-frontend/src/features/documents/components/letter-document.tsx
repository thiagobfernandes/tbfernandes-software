/* eslint-disable @next/next/no-img-element -- the sheets are exported as plain HTML */
import { COMPANY } from "@/features/documents/lib/company";
import { formatLongDate } from "@/features/documents/lib/templates";
import type { LetterData } from "@/features/documents/types";

export function LetterDocument({ data }: { data: LetterData }) {
  const paragraphs = data.body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section className="sheet">
      <div className="lh-top">
        <img src={COMPANY.logo} alt={COMPANY.brand} />
        <span>
          {data.kicker}
          {data.number && ` · nº ${data.number}`}
        </span>
      </div>
      <div className="lh-rule" />

      <div className="lh-meta">
        <div className="to">
          <small>Para</small>
          <b>{data.recipient}</b>
          {data.recipientDetail && <span>{data.recipientDetail}</span>}
        </div>
        <div className="when">
          <small>{COMPANY.city}</small>
          <b>{formatLongDate(data.date)}</b>
        </div>
      </div>

      <div className="lh-title">
        <p className="kicker">{data.kicker}</p>
        <h1>{data.title}</h1>
      </div>

      <div className="lh-body">
        {paragraphs.map((p, i) => (
          <p key={i}>
            {p.split("\n").map((line, j) => (
              <span key={j}>
                {j > 0 && <br />}
                {line}
              </span>
            ))}
          </p>
        ))}
      </div>

      {data.closing && <p className="lh-closing">{data.closing}</p>}

      {data.showSignature && (
        <div className="lh-sign">
          <img src={COMPANY.photo} alt={COMPANY.owner} />
          <div>
            <b>{COMPANY.owner}</b>
            <span>
              {COMPANY.role} · {COMPANY.brand}
            </span>
          </div>
        </div>
      )}

      <div className="lh-foot">
        <span>{COMPANY.brand}</span>
        <span>
          {COMPANY.phone} · {COMPANY.email} · {COMPANY.site}
        </span>
      </div>
    </section>
  );
}
