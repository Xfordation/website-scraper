const puppeteer = require("puppeteer");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const port = process.env.PORT || 9000;

app.use(bodyParser.json());

// Configure Puppeteer launch options
const getBrowserConfig = () => {
  const chromiumPaths = [
    process.env.PUPPETEER_EXECUTABLE_PATH, // Render's environment path
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    puppeteer.executablePath(), // Fallback to Puppeteer's bundled Chrome
  ];

  // Find the first valid executable path
  const validPath = chromiumPaths.find((path) => {
    try {
      if (path && require("fs").existsSync(path)) return true;
    } catch (e) {
      return false;
    }
    return false;
  });

  console.log(`Using browser at: ${validPath}`);

  return {
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
    ],
    executablePath: validPath,
    headless: "new",
    ignoreHTTPSErrors: true,
  };
};

app.post("/get", async (req, res) => {
  let browser;
  try {
    console.log("Receiving data ...", req.body);
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    browser = await puppeteer.launch(getBrowserConfig());
    const page = await browser.newPage();

    // Set reasonable timeouts
    await page.setDefaultNavigationTimeout(30000);
    await page.setDefaultTimeout(10000);

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    const html = await page.content();
    res.send({ html });
  } catch (error) {
    console.error("Error fetching HTML:", error);
    res.status(500).json({
      error: error.message,
      advice:
        "This might be due to temporary resource constraints. Try again in a few seconds.",
    });
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.warn("Browser cleanup error:", e.message);
      }
    }
  }
});

app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
