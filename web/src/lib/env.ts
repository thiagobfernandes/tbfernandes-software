export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
  /**
   * "local": simulated store in this browser (default).
   * "api": every screen reads and writes through the Spring Boot API.
   */
  dataSource: process.env.NEXT_PUBLIC_DATA_SOURCE === "api" ? "api" : "local",
} as const;
