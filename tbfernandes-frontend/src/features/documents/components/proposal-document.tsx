/* eslint-disable @next/next/no-img-element -- the sheets are exported as plain HTML */
import type { CSSProperties } from "react";

import { COMPANY } from "@/features/documents/lib/company";
import { formatLongDate } from "@/features/documents/lib/templates";
import type { ProposalData } from "@/features/documents/types";

const pad = (n: number) => String(n).padStart(2, "0");
const cols = (n: number) => ({ "--cols": Math.max(1, n) }) as CSSProperties;

function Footer({ data, page }: { data: ProposalData; page: number }) {
  return (
    <div className="foot">
      <img src={COMPANY.logo} alt={COMPANY.brand} />
      <span>{data.client}</span>
      <span>{pad(page)}</span>
    </div>
  );
}

export function ProposalDocument({ data }: { data: ProposalData }) {
  const date = formatLongDate(data.date);
  return (
    <>
      <section className="page cover on-dark">
        <div className="cover-top">
          <img src={COMPANY.logo} alt={COMPANY.brand} />
        </div>
        <img className="cover-symbol" src={COMPANY.symbol} alt="" />
        <div className="cover-main">
          <p className="kicker">Proposta comercial</p>
          <h1>
            {data.headline} <em className="gold">{data.headlineAccent}</em>
          </h1>
          <p className="cover-sub">{data.subtitle}</p>
        </div>
        <div className="cover-meta">
          <div>
            <small>Preparado para</small>
            <b>{data.client}</b>
          </div>
          <div>
            <small>Data</small>
            <b>{date}</b>
          </div>
          <div>
            <small>Validade</small>
            <b>{data.validity}</b>
          </div>
        </div>
        <div className="band" />
      </section>

      <section className="page">
        <div className="pad">
          <div className="intro">
            <p className="kicker">O projeto</p>
            <h2>
              Olá, {data.clientContact}. Aqui está o que vamos{" "}
              <em className="gold">construir</em>.
            </h2>
            <p className="lede">{data.objective}</p>
          </div>

          <div className="scope">
            <div className="box">
              <span className="tag">{data.projectType}</span>
              <h3>Entregáveis</h3>
              <ol className="sections">
                {data.sections.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ol>
            </div>
            <div className="box dark">
              <h3>Tudo incluso</h3>
              <ul className="check">
                {data.included.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          {data.steps.length > 0 && (
            <div className="steps-wrap">
              <p className="kicker">Como funciona</p>
              <h2>
                Do primeiro contato à entrega em{" "}
                <em className="gold">{data.deadline}</em>
              </h2>
              <ol className="steps" style={cols(data.steps.length)}>
                {data.steps.map((step, i) => (
                  <li key={i}>
                    <span className="n">{pad(i + 1)}</span>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
        <Footer data={data} page={2} />
      </section>

      <section className="page">
        <div className="pad">
          <p className="kicker">Investimento</p>
          <h2 style={{ fontSize: "26pt" }}>
            Valor fechado, <em className="gold">sem surpresas.</em>
          </h2>

          <div className="invest">
            <div className="price">
              <small>{data.projectType}</small>
              <div className="value">{data.price}</div>
              <dl>
                <div>
                  <dt>Prazo</dt>
                  <dd>{data.deadline}</dd>
                </div>
                <div>
                  <dt>Pagamento</dt>
                  <dd>{data.payment}</dd>
                </div>
                {data.maintenance && (
                  <div>
                    <dt>Manutenção</dt>
                    <dd>{data.maintenance}</dd>
                  </div>
                )}
              </dl>
            </div>
            <div className="terms">
              <h3>Condições</h3>
              <ul>
                {data.conditions.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
                <li>
                  Proposta válida por {data.validity} a partir da data de
                  emissão.
                </li>
              </ul>
            </div>
          </div>

          {data.nextSteps.length > 0 && (
            <div className="next" style={cols(data.nextSteps.length)}>
              {data.nextSteps.map((step, i) => (
                <div key={i}>
                  <span className="num">{pad(i + 1)}</span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              ))}
            </div>
          )}

          <div className="sign on-dark">
            <img className="photo" src={COMPANY.photo} alt={COMPANY.owner} />
            <div>
              <blockquote>“{data.quote}”</blockquote>
              <p className="who">
                <b>{COMPANY.owner}</b> · {COMPANY.role} · {COMPANY.city}
              </p>
            </div>
            <div className="contacts">
              <b>Contato</b>
              {COMPANY.phone}
              <br />
              {COMPANY.email}
              <br />
              {COMPANY.site}
              <br />
              {COMPANY.sitesSite}
              <br />
              CNPJ {COMPANY.cnpj}
              <br />
              {COMPANY.invoiceNote}
            </div>
          </div>
        </div>
        <Footer data={data} page={3} />
      </section>
    </>
  );
}
