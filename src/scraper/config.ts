export const SCRAPER = {
  userAgent:
    process.env.SCRAPER_USER_AGENT ||
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 (AICodingTutorScraper/1.0)",
  maxConcurrency: Number(process.env.SCRAPER_MAX_CONCURRENCY || 5),
  perDomainDelayMs: Number(process.env.SCRAPER_PER_DOMAIN_DELAY_MS || 500),
  requestTimeoutMs: Number(process.env.SCRAPER_REQUEST_TIMEOUT_MS || 15000),
  bucket: process.env.SCRAPER_BUCKET || "scraper",
  maxPages: Number(process.env.SCRAPER_MAX_PAGES || 200),
  respectRobots: (process.env.SCRAPER_RESPECT_ROBOTS || "true") === "true",
  sameDomainOnly: (process.env.SCRAPER_SAME_DOMAIN_ONLY || "true") === "true",
};
