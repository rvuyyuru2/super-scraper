const {
  browser: { createBrowser },
} = require(".");

(async () => {
  const browser = await createBrowser();
  console.log(browser);
  const page = await browser.newPage();
  await page.goto(
    "https://www.sfchronicle.com/sports/michaelsilver/article/49ers-defense-dominated-jaguars-regained-mojo-18486716.php"
  );
  await page.goto(url, {
    waitUntil: "networkidle2",
    timeout: 60000,
  });
  const content = await page.content();

  console.log(content);

  await page.waitFor(1000);
  await page.close();
  await browser.close();

  process.exit(0);
})();
