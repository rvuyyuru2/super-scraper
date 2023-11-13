const { executablePath } = require("puppeteer");
const log = require("debug")("mega-scraper:get-puppeteer-options");

module.exports = function getPuppeteerOptions(options = {}) {
  const args = [
    "--no-sandbox",
    "--single-process",
    "--no-zygote",
    "--disable-setuid-sandbox",
    "--disable-infobars",
    "--no-first-run",
    `--window-size=${options.width || 1280},${options.height || 800}`,
    "--window-position=0,0",
    "--ignore-certificate-errors",
    "--ignore-certificate-errors-skip-list",
    "--disable-dev-shm-usage",
    "--disable-accelerated-2d-canvas",
    "--disable-gpu",
    "--hide-scrollbars",
    "--disable-notifications",
    "--disable-extensions",
    "--force-color-profile=srgb",
    "--mute-audio",
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
    "--disable-breakpad",
    "--disable-component-extensions-with-background-pages",
    "--disable-features=TranslateUI,BlinkGenPropertyTrees,IsolateOrigins,site-per-process",
    "--disable-ipc-flooding-protection",
    "--disable-renderer-backgrounding",
    "--enable-features=NetworkService,NetworkServiceInProcess",
  ];
  if (typeof options.proxy === "string") {
    log(`using --proxy-server=${options.proxy}`);
    args.push(`--proxy-server=${options.proxy}`);
  }
  if (options.proxy && typeof options.proxy.endpoint === "string") {
    log(`using --proxy-server=${options.proxy.endpoint}`);
    args.push(`--proxy-server=${options.proxy.endpoint}`);
  }
  if (options.incognito) {
    log(`using --incognito`);
    args.push("--incognito");
  }
  const puppeteerOptions = {
    args,
    ignoreHTTPSErrors: true,
    executablePath: executablePath(),
  };

  Object.assign(puppeteerOptions, { headless: "new" });

  if (options.browserWSEndpoint || process.env.BROWSER_WS_ENDPOINT) {
    const browserWSEndpoint =
      options.browserWSEndpoint || process.env.BROWSER_WS_ENDPOINT;
    log("browserWSEndpoint", browserWSEndpoint);
    Object.assign(puppeteerOptions, { browserWSEndpoint });
  }
  if (Number.isFinite(options.slowMo) || process.env.SLOW_DOWN === "true") {
    log("slowMo", options.slowMo, "ms");
    Object.assign(puppeteerOptions, { slowMo: options.slowMo || 250 });
  }

  return puppeteerOptions;
};
