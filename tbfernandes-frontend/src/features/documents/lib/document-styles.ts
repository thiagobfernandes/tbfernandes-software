/*
 * Print stylesheet for company documents. It is a standalone artifact (it
 * goes inside exported HTML files and the print frame), so it carries the
 * brand colors itself instead of the app tokens:
 *   black #080808 · graphite #1C1C1C · gold #D4AF37 · aged gold #B89546
 *   champagne #F5E9CF (tbfernandes-software) + copper #C97845 (portfolio).
 * Everything is scoped under `.tbdoc` so it never leaks into the app.
 */
export const DOCUMENT_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400&family=Manrope:wght@400;500;600;700&display=swap";

export const DOCUMENT_CSS = String.raw`
.tbdoc {
  --ink: #080808;
  --graphite: #1c1c1c;
  --gold: #d4af37;
  --aged: #b89546;
  --champagne: #f5e9cf;
  --copper: #c97845;
  --paper: #fbf7ee;
  --paper-2: #f3ecdc;
  --card: #fffdf8;
  --line: #e6dcc6;
  --muted: #5e5443;
  --gold-text: #8a6a12;
  --dark-line: #33302a;
  --dark-muted: #b9ae98;
  --gold-gradient: linear-gradient(100deg, #8a6a12 0%, #b89546 45%, #d4af37 100%);
  --display: "Fraunces", Georgia, "Times New Roman", serif;
  --sans: "Manrope", "Segoe UI", system-ui, sans-serif;
  color: var(--ink);
  font-family: var(--sans);
  font-size: 10.5pt;
  line-height: 1.55;
}
.tbdoc *, .tbdoc *::before, .tbdoc *::after {
  box-sizing: border-box;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.tbdoc h1, .tbdoc h2, .tbdoc h3 { margin: 0; font-family: var(--display); font-weight: 600; letter-spacing: -0.02em; line-height: 1.1; }
.tbdoc p { margin: 0; }
.tbdoc ul, .tbdoc ol { margin: 0; padding: 0; list-style: none; }
.tbdoc em.gold { font-style: italic; font-weight: 400; color: var(--gold-text); }
.tbdoc .on-dark em.gold { color: var(--gold); }

/* Sheets */
.tbdoc .page { position: relative; width: 210mm; height: 297mm; overflow: hidden; background: var(--paper); break-after: page; page-break-after: always; }
.tbdoc .page:last-child { break-after: auto; page-break-after: auto; }
.tbdoc .page + .page { margin-top: 10mm; }
.tbdoc .pad { padding: 18mm 20mm 0; }
.tbdoc .kicker { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; color: var(--gold-text); font-weight: 700; font-size: 8pt; letter-spacing: .16em; text-transform: uppercase; }
.tbdoc .kicker::before { content: ""; width: 22px; height: 1px; background: var(--copper); }
.tbdoc .num { font-family: var(--display); font-style: italic; color: var(--gold-text); }
.tbdoc .foot { position: absolute; left: 20mm; right: 20mm; bottom: 12mm; display: flex; justify-content: space-between; align-items: center; gap: 12px; padding-top: 10px; border-top: 1px solid var(--line); font-size: 8pt; color: var(--muted); }
.tbdoc .foot img { height: 12px; }
.tbdoc .page > .band { position: absolute; left: 0; right: 0; bottom: 0; height: 4mm; background: var(--gold-gradient); }

/* Cover */
.tbdoc .cover { background: var(--ink); color: var(--champagne); }
.tbdoc .cover::before { content: ""; position: absolute; inset: 0; background:
  radial-gradient(120mm 90mm at 85% 18%, rgba(212, 175, 55, .22), transparent 70%),
  radial-gradient(90mm 70mm at 10% 95%, rgba(201, 120, 69, .12), transparent 70%),
  linear-gradient(rgba(245, 233, 207, .035) 1px, transparent 1px) 0 0 / 100% 14mm; }
.tbdoc .cover > * { position: relative; }
.tbdoc .cover-top { display: flex; justify-content: space-between; align-items: center; padding: 20mm 20mm 0; }
.tbdoc .cover-top img { height: 22px; }
.tbdoc .cover-top span { font-size: 8pt; letter-spacing: .14em; text-transform: uppercase; color: var(--dark-muted); }
.tbdoc .cover-symbol { position: absolute; right: -14mm; top: 70mm; width: 120mm; opacity: .07; }
.tbdoc .cover-main { position: absolute; left: 20mm; right: 20mm; top: 92mm; }
.tbdoc .cover-main .kicker { color: var(--gold); }
.tbdoc .cover h1 { font-size: 50pt; line-height: 1.02; letter-spacing: -0.03em; color: var(--champagne); }
.tbdoc .cover-sub { max-width: 120mm; margin-top: 8mm; font-size: 12pt; color: var(--dark-muted); }
.tbdoc .cover-meta { position: absolute; left: 20mm; right: 20mm; bottom: 20mm; display: grid; grid-template-columns: 1.3fr 1.3fr .8fr; border-top: 1px solid var(--dark-line); }
.tbdoc .cover-meta div { padding: 14px 16px 0 0; }
.tbdoc .cover-meta div + div { padding-left: 16px; border-left: 1px solid var(--dark-line); }
.tbdoc .cover-meta small { display: block; font-size: 7.5pt; letter-spacing: .14em; text-transform: uppercase; color: var(--aged); }
.tbdoc .cover-meta b { display: block; margin-top: 4px; font-family: var(--display); font-weight: 400; font-size: 13pt; color: var(--champagne); }

/* Scope page */
.tbdoc .intro h2 { font-size: 26pt; max-width: 150mm; }
.tbdoc .lede { max-width: 150mm; margin-top: 10px; font-size: 11pt; color: var(--muted); }
.tbdoc .scope { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; margin-top: 8mm; }
.tbdoc .box { padding: 6mm; border-radius: 10px; background: var(--card); border: 1px solid var(--line); }
.tbdoc .box h3 { font-size: 15pt; margin-bottom: 4mm; }
.tbdoc .tag { display: inline-block; margin-bottom: 4mm; padding: 3px 10px; border-radius: 999px; background: var(--champagne); font-size: 8.5pt; font-weight: 700; color: var(--gold-text); }
.tbdoc .sections { counter-reset: s; }
.tbdoc .sections li { display: grid; grid-template-columns: 22px 1fr; gap: 6px; padding: 5px 0; border-bottom: 1px solid var(--line); counter-increment: s; }
.tbdoc .sections li:last-child { border-bottom: 0; }
.tbdoc .sections li::before { content: counter(s, decimal-leading-zero); font-family: var(--display); font-style: italic; color: var(--copper); }
.tbdoc .box.dark { background: var(--graphite); border-color: var(--graphite); color: var(--champagne); }
.tbdoc .box.dark h3 { color: var(--champagne); }
.tbdoc .check li { display: flex; gap: 9px; padding: 4.5px 0; border-bottom: 1px solid var(--dark-line); }
.tbdoc .check li:last-child { border-bottom: 0; }
.tbdoc .check li::before { content: "✓"; flex-shrink: 0; display: grid; place-items: center; width: 15px; height: 15px; margin-top: 2px; border-radius: 50%; background: var(--gold-gradient); color: var(--ink); font-size: 8pt; font-weight: 700; }
.tbdoc .steps-wrap { margin-top: 9mm; }
.tbdoc .steps-wrap h2 { font-size: 19pt; margin-bottom: 6mm; }
.tbdoc .steps { position: relative; display: grid; grid-template-columns: repeat(var(--cols, 4), 1fr); gap: 6mm; }
.tbdoc .steps::before { content: ""; position: absolute; top: 16px; left: 16px; right: 16px; height: 1px; background: repeating-linear-gradient(90deg, var(--aged) 0 5px, transparent 5px 10px); }
.tbdoc .steps li { position: relative; }
.tbdoc .steps .n { position: relative; display: grid; place-items: center; width: 32px; height: 32px; border-radius: 50%; background: var(--paper); border: 1px solid var(--aged); font-family: var(--display); font-style: italic; font-size: 11pt; color: var(--gold-text); }
.tbdoc .steps li:last-child .n { background: var(--gold-gradient); border: 0; color: var(--ink); }
.tbdoc .steps h3 { margin: 4mm 0 2mm; font-size: 13pt; }
.tbdoc .steps p { font-size: 9pt; color: var(--muted); }

/* Investment page */
.tbdoc .invest { display: grid; grid-template-columns: 1.1fr .9fr; gap: 10mm; margin-top: 8mm; }
.tbdoc .price { position: relative; overflow: hidden; padding: 9mm; border-radius: 12px; background: var(--ink); color: var(--champagne); }
.tbdoc .price::after { content: ""; position: absolute; right: -20mm; bottom: -20mm; width: 70mm; height: 70mm; background: radial-gradient(circle, rgba(212,175,55,.30), transparent 70%); }
.tbdoc .price small { display: block; font-size: 8pt; letter-spacing: .14em; text-transform: uppercase; color: var(--aged); }
.tbdoc .price .value { margin: 3mm 0 6mm; font-family: var(--display); font-size: 34pt; line-height: 1; color: var(--gold); }
.tbdoc .price dl { position: relative; z-index: 1; margin: 0; display: grid; }
.tbdoc .price dl div { display: grid; grid-template-columns: 28mm 1fr; gap: 4mm; padding: 9px 0; border-top: 1px solid var(--dark-line); font-size: 9.5pt; }
.tbdoc .price dt { color: var(--dark-muted); }
.tbdoc .price dd { margin: 0; }
.tbdoc .terms h3 { font-size: 15pt; margin-bottom: 3mm; }
.tbdoc .terms li { display: grid; grid-template-columns: 22px 1fr; padding: 8px 0; border-bottom: 1px solid var(--line); font-size: 9.5pt; color: var(--muted); }
.tbdoc .terms li::before { content: "✦"; color: var(--copper); font-size: 8pt; padding-top: 2px; }
.tbdoc .next { margin-top: 12mm; display: grid; grid-template-columns: repeat(var(--cols, 3), 1fr); gap: 6mm; }
.tbdoc .next div { padding: 6mm; border-radius: 10px; background: var(--paper-2); }
.tbdoc .next .num { font-size: 20pt; line-height: 1; }
.tbdoc .next h3 { margin: 3mm 0 1.5mm; font-size: 12.5pt; }
.tbdoc .next p { font-size: 9pt; color: var(--muted); }

/* Signature */
.tbdoc .sign { display: grid; grid-template-columns: auto 1fr auto; gap: 7mm; align-items: center; margin-top: 12mm; padding: 7mm; border-radius: 12px; background: var(--ink); color: var(--champagne); }
.tbdoc .sign img.photo { width: 26mm; height: 26mm; border-radius: 50%; object-fit: cover; object-position: center 15%; border: 2px solid var(--gold); }
.tbdoc .sign blockquote { margin: 0; font-family: var(--display); font-style: italic; font-size: 13pt; line-height: 1.3; }
.tbdoc .sign .who { margin-top: 3mm; font-size: 9pt; color: var(--dark-muted); }
.tbdoc .sign .who b { color: var(--champagne); }
.tbdoc .contacts { text-align: right; font-size: 9pt; line-height: 1.8; color: var(--dark-muted); }
.tbdoc .contacts b { display: block; color: var(--gold); font-weight: 600; }

/* Letterhead: flowing text over as many sheets as needed */
.tbdoc .sheet { position: relative; width: 210mm; min-height: 297mm; background: #fff; padding: 0 20mm 22mm; page: letter; }
.tbdoc .lh-top { display: flex; justify-content: space-between; align-items: center; margin: 0 -20mm; padding: 14mm 20mm 8mm; background: var(--ink); color: var(--dark-muted); }
.tbdoc .lh-top img { height: 20px; }
.tbdoc .lh-top span { font-size: 8pt; letter-spacing: .14em; text-transform: uppercase; }
.tbdoc .lh-rule { height: 1.6mm; margin: 0 -20mm; background: var(--gold-gradient); }
.tbdoc .lh-meta { display: flex; justify-content: space-between; align-items: flex-end; gap: 10mm; margin-top: 12mm; }
.tbdoc .lh-meta small { display: block; font-size: 7.5pt; letter-spacing: .14em; text-transform: uppercase; color: var(--gold-text); }
.tbdoc .lh-meta b { display: block; margin-top: 2px; font-family: var(--display); font-weight: 400; font-size: 12pt; }
.tbdoc .lh-meta .to span { display: block; font-size: 9.5pt; color: var(--muted); }
.tbdoc .lh-meta .when { text-align: right; }
.tbdoc .lh-title { margin-top: 12mm; }
.tbdoc .lh-title h1 { font-size: 26pt; }
.tbdoc .lh-body { margin-top: 8mm; font-size: 11pt; line-height: 1.7; }
.tbdoc .lh-body p { orphans: 3; widows: 3; text-align: justify; hyphens: auto; }
.tbdoc .lh-body p + p { margin-top: 4mm; }
.tbdoc .lh-closing { margin-top: 10mm; font-size: 11pt; break-inside: avoid; }
.tbdoc .lh-sign { display: flex; align-items: center; gap: 6mm; margin-top: 8mm; padding-top: 6mm; border-top: 1px solid var(--line); break-inside: avoid; }
.tbdoc .lh-sign img { width: 18mm; height: 18mm; border-radius: 50%; object-fit: cover; object-position: center 15%; border: 1.5px solid var(--aged); }
.tbdoc .lh-sign b { display: block; font-family: var(--display); font-size: 13pt; font-weight: 600; }
.tbdoc .lh-sign span { display: block; font-size: 9pt; color: var(--muted); }
.tbdoc .lh-foot { display: flex; justify-content: space-between; gap: 8mm; margin-top: 14mm; padding-top: 8px; border-top: 1px solid var(--line); font-size: 8pt; color: var(--muted); break-inside: avoid; }

@page { size: A4; margin: 0; }
@page letter { size: A4; margin: 16mm 0 14mm; }
@page letter:first { margin-top: 0; }
@media print {
  html, body { margin: 0; background: none; }
  .tbdoc .page + .page { margin-top: 0; }
}
`;

/** Extra rules for the standalone HTML file viewed in a browser. */
export const STANDALONE_SCREEN_CSS = String.raw`
@media screen {
  body { margin: 0; padding: 24px 0; background: #2a2723; }
  .tbdoc { display: flex; flex-direction: column; align-items: center; }
  .tbdoc .page, .tbdoc .sheet { box-shadow: 0 10px 40px rgba(0,0,0,.35); }
}
`;
