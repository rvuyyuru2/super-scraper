const log = require("debug")("mega-scraper:create-browser");
const puppeteer = require("puppeteer-extra");
// import AnonymizePlugin from "puppeteer-extra-plugin-anonymize-ua";

const getFreeHttpsProxy = require("get-free-https-proxy");
const getPuppeteerOptions = require("./get-puppeteer-options");
const preparePage = require("./prepare-page");
// const { newInjectedPage } = require("fingerprint-injector");
puppeteer.use(require("puppeteer-extra-plugin-stealth")());
puppeteer.use(
  require("puppeteer-extra-plugin-adblocker")({ blockTrackers: true })
);
// puppeteer.use(require("puppeteer-extra-plugin-stealth")(
//   BlockResources({
//     blockedTypes: new Set(["image", "stylesheet", "font", "media"]),
//     // Optionally enable Cooperative Mode for several request interceptors
//     interceptResolutionPriority: DEFAULT_INTERCEPT_RESOLUTION_PRIORITY,
//   })
// ));
// puppeteer.use(AnonymizePlugin());
module.exports = async function createBrowser(
  options = {
    proxy: true,
    stylesheets: true,
    javascript: true,
    incognito: true,
    headless: "new",
    images: true,
    cookie: undefined,
    width: 1280,
    height: 800,
    slowMo: undefined,
    userAgent: undefined,
    timeout: 60000,
  }
) {
  log("create browser", options);
  if (options.proxy === true) {
    const proxies = await getFreeHttpsProxy();
    const { host, port } =
      proxies[Math.max(0, parseInt(proxies.length * Math.random()) - 1)];
    Object.assign(options, { proxy: `${host}:${port}` });
  }

  const puppeteerOptions = getPuppeteerOptions(options);
  console.log(puppeteerOptions);
  log("puppeteerOptions", puppeteerOptions);
  let instance;
  if (!puppeteerOptions.browserWSEndpoint) {
    instance = await puppeteer.launch(puppeteerOptions);
  } else {
    instance = await puppeteer.connect(puppeteerOptions);
  }

  log("new browser", options, puppeteerOptions);
  return {
    async newPage(url, { reusePage = true } = {}) {
      const pages = await instance.pages();
      let page =
        pages.length > 0 && reusePage ? pages[0] : await instance.newPage();
      console.log(page);
      // page = await newInjectedPage(instance, {
      //   // constraints for the generated fingerprint
      //   fingerprintOptions: {
      //     devices: ["desktop", "mobile"],
      //     operatingSystems: ["linux", "macos", "windows", "ios"],
      //     browsers: ["chrome", "edge", "firefox", "safari"],
      //   },
      // });
      page.on("dialog", async (dialog) => {
        log(`dismissing dialog`);
        await dialog.dismiss();
      });

      if (options.cookie && typeof options.cookie === "string") {
        try {
          let domain;
          if (url || options.url) {
            domain = (url || options.url)
              .replace(/^https?:\/\//, "")
              .replace(/\/.*/, "");
          }
          console.log({ domain, url });
          log("processing cookie", options.cookie);
          const cookieStrings = options.cookie.split(";");
          const cookies = cookieStrings
            .map((c) => c.split("="))
            .map(([name, value]) => ({
              name: name.trim(),
              value: value.trim(),
              domain: `${domain}`,
              secure: true,
              httpOnly: true,
              path: "/",
            }));
          log("setting cookies", cookies);
          await page.setCookie(...cookies);
        } catch (err) {
          log("failed to set cookie", err.message, err);
        }
      } else {
        log("no cookie", options.cookie);
      }

      if (
        typeof options.proxy === "object" &&
        options.proxy.username &&
        options.proxy.password
      ) {
        log("authenticating to proxy", options.proxy);
        await page.authenticate({
          username: options.proxy.username,
          password: options.proxy.password,
        });
      }

      if (url && typeof url === "string") {
        const gotoOptions = { timeout: options.timeout || 60000 };
        await page.goto(url, gotoOptions);
      }

      await preparePage(page, options);

      return page;
    },
    close: () => instance.close(),
    instance,
  };
};
