export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
  /**
   * "local": simulated store in this browser (default).
   * "api": every screen reads and writes through the Spring Boot API.
   */
  dataSource: process.env.NEXT_PUBLIC_DATA_SOURCE === "api" ? "api" : "local",
  /** Shows Pluggy's test banks in the connect widget. Never on in production. */
  pluggySandbox: process.env.NEXT_PUBLIC_PLUGGY_SANDBOX === "true",
} as const;
