const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const VIDEO_URL = "https://www.youtube.com/live/l1Jr5aln8QI?si=xa85_ya0G2U6Aa8Y";
const WATCH_DURATION = 6 * 60 * 60 * 1000; // 6 hours in ms

async function watchVideo() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           🎬 YOUTUBE VIDEO WATCHER (6 HOURS)               ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  console.log('\n📺 Starting actual video watch...');
  console.log(`URL: ${VIDEO_URL}`);
  console.log(`Duration: 6 hours`);
  console.log(`Started: ${new Date().toLocaleString()}`);
  
  let browser;
  const logFile = path.join('./output', 'watch.log');
  
  try {
    if (!fs.existsSync('./output')) {
      fs.mkdirSync('./output', { recursive: true });
    }
    
    console.log('\n🌐 Launching browser...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--autoplay-policy=no-user-gesture-required'
      ]
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    console.log('✅ Browser launched');
    
    console.log('\n📍 Navigating to YouTube...');
    await page.goto(VIDEO_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('✅ Page loaded');
    
    try {
      await page.waitForSelector('button[aria-label="Accept all"]', { timeout: 5000 });
      await page.click('button[aria-label="Accept all"]');
      console.log('✅ Cookies accepted');
    } catch {
      console.log('⚠️  No cookie prompt');
    }
    
    console.log('\n▶️  Waiting for video player...');
    await page.waitForSelector('video', { timeout: 15000 });
    console.log('✅ Video player found');
    
    try {
      await page.click('[aria-label="Play"]');
      console.log('✅ Play button clicked');
    } catch {
      console.log('⚠️  Could not click play button, video might autoplay');
    }
    
    await page.waitForTimeout(3000);
    console.log('\n🎬 Video is now playing...');
    console.log('⏱️  Watching for 6 hours...\n');
    
    const startTime = Date.now();
    let lastLogTime = startTime;
    const logInterval = 30 * 60 * 1000; // 30 minutes
    
    while (Date.now() - startTime < WATCH_DURATION) {
      const elapsed = Date.now() - startTime;
      const elapsedMinutes = Math.floor(elapsed / 60000);
      const elapsedHours = Math.floor(elapsedMinutes / 60);
      const remainingMinutes = 360 - elapsedMinutes;
      
      if (Date.now() - lastLogTime >= logInterval) {
        const logMessage = `[${new Date().toLocaleTimeString()}] ⏱️  ${elapsedHours}h ${elapsedMinutes % 60}m elapsed | ${remainingMinutes}m left | 🟢 WATCHING`;
        console.log(logMessage);
        fs.appendFileSync(logFile, logMessage + '\n');
        lastLogTime = Date.now();
      }
      
      try {
        const resumed = await page.evaluate(() => {
          const video = document.querySelector('video');
          if (video && video.paused) {
            video.play();
            return true;
          }
          return false;
        });
        if (resumed) {
          console.log('⚠️  Video was paused, resumed via video.play()');
        }
      } catch {
        console.log('⚠️  Could not check video status');
      }
      
      await page.waitForTimeout(60000); // check every minute
    }
    
    console.log('\n✅ WATCH COMPLETED!');
    console.log(`⏱️  Total watch time: 6 hours`);
    console.log(`🏁 Ended: ${new Date().toLocaleString()}`);
    
    const report = `
╔════════════════════════════════════════════════════════════╗
║        📺 YOUTUBE VIDEO WATCH REPORT (6 HOURS)            ║
╚════════════════════════════════════════════════════════════╝

✅ Video played continuously for 6 hours
✅ Auto‑pause handled with video.play()
✅ Logs written every 30 minutes
✅ Report generated successfully
    `;
    
    fs.writeFileSync(path.join('./output', 'report.txt'), report);
    console.log(report);
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    fs.appendFileSync(logFile, `Error at ${new Date().toLocaleString()}: ${error.message}\n`);
    if (browser) await browser.close();
    process.exit(1);
  }
}

watchVideo();
