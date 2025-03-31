const puppeteer = require("puppeteer");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const port = process.env.PORT || 9000;

app.use(bodyParser.json());

app.post("/get", async (req, res) => {
  let browser;
  try {
    console.log("Receiving data ...", req.body);
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    browser = await puppeteer.launch({
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--single-process",
      ],
      executablePath:
        process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium-browser",
      headless: "new",
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });
    const html = await page.content();

    res.send({ html });
  } catch (error) {
    console.error("Error fetching HTML:", error);
    res.status(500).json({ error: error.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
