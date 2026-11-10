"use client";

import {
  DOCUMENT_CSS,
  DOCUMENT_FONTS_HREF,
  STANDALONE_SCREEN_CSS,
} from "@/features/documents/lib/document-styles";

const escapeHtml = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        ch
      ]!,
  );

async function toDataUrl(src: string) {
  const response = await fetch(src);
  if (!response.ok) throw new Error(`Imagem não encontrada: ${src}`);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * A self-contained HTML file of the rendered document: styles and images are
 * embedded, so it opens anywhere and prints the same as the preview.
 */
export async function buildStandaloneHtml(root: HTMLElement, title: string) {
  const clone = root.cloneNode(true) as HTMLElement;
  const images = Array.from(clone.querySelectorAll("img"));
  const cache = new Map<string, Promise<string>>();
  await Promise.all(
    images.map(async (img) => {
      const src = img.getAttribute("src");
      if (!src || src.startsWith("data:")) return;
      const absolute = new URL(src, window.location.href).href;
      if (!cache.has(absolute)) cache.set(absolute, toDataUrl(absolute));
      img.setAttribute("src", await cache.get(absolute)!);
    }),
  );

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="${DOCUMENT_FONTS_HREF}" />
<style>${DOCUMENT_CSS}${STANDALONE_SCREEN_CSS}</style>
</head>
<body>
${clone.outerHTML}
</body>
</html>`;
}

/** File name without characters that break on Windows. */
export function fileName(name: string, extension: string) {
  const base = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w\s.-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
  return `${base || "documento"}.${extension}`;
}

export function downloadHtml(html: string, name: string) {
  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName(name, "html");
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Prints the document through a hidden frame, so only the sheets go to the
 * printer. Choose "Salvar como PDF" in the dialog to get the PDF.
 */
export function printHtml(html: string) {
  return new Promise<void>((resolve, reject) => {
    const frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.style.cssText =
      "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
    document.body.appendChild(frame);

    const cleanup = () => setTimeout(() => frame.remove(), 1000);
    frame.onload = async () => {
      try {
        const win = frame.contentWindow!;
        // Wait for the web fonts, but never block printing on them.
        await Promise.race([
          win.document.fonts.ready,
          new Promise((r) => setTimeout(r, 2500)),
        ]);
        win.addEventListener("afterprint", cleanup, { once: true });
        win.focus();
        win.print();
        resolve();
      } catch (error) {
        cleanup();
        reject(error);
      }
    };
    frame.srcdoc = html;
  });
}
