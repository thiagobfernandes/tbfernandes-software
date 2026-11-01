/**
 * Values the desktop app (Tauri) injects into the window before the page
 * loads. The backend runs on a port chosen at startup and checks a token
 * created for each launch, so neither can be baked in at build time.
 */
type DesktopConfig = { apiUrl: string; token: string };

declare global {
  interface Window {
    __TBF_DESKTOP__?: DesktopConfig;
  }
}

function desktop(): DesktopConfig | undefined {
  return typeof window === "undefined" ? undefined : window.__TBF_DESKTOP__;
}

export const env = {
  /** Built with `TBF_TARGET=desktop`: static export loaded by the desktop app. */
  desktopBuild: process.env.NEXT_PUBLIC_TBF_TARGET === "desktop",
  get apiUrl() {
    return (
      desktop()?.apiUrl ??
      process.env.NEXT_PUBLIC_API_URL ??
      "http://localhost:8080"
    );
  },
  /** Sent as `X-TBF-Desktop-Token` on every request in the desktop app. */
  get desktopToken() {
    return desktop()?.token;
  },
  /**
   * "local": simulated store in this browser (default).
   * "api": every screen reads and writes through the Spring Boot API.
   * The desktop build always uses the API.
   */
  dataSource:
    process.env.NEXT_PUBLIC_DATA_SOURCE === "api" ||
    process.env.NEXT_PUBLIC_TBF_TARGET === "desktop"
      ? "api"
      : "local",
  /** Shows Pluggy's test banks in the connect widget. Never on in production. */
  pluggySandbox: process.env.NEXT_PUBLIC_PLUGGY_SANDBOX === "true",
} as const;
