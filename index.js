const puppeteer = require("puppeteer");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const port = process.env.PORT || 9000; // Use Render's port or default to 9000

app.use(bodyParser.json());

app.post("/get", async (req, res) => {
  let browser;
  try {
    console.log("Receiving data ...", req.body);
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    // Modified Puppeteer launch with Render-specific config
    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null, // Use system Chrome on Render, fallback to Puppeteer's bundled Chrome locally
      headless: "new", // Use new Headless mode for better performance
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    const html = await page.content();
    await browser.close();

    res.send({ html });
  } catch (error) {
    console.error("Error fetching HTML:", error);
    if (browser) await browser.close(); // Ensure browser is closed even on error
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
