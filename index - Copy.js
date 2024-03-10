const puppeteer = require('puppeteer');
const fs = require('fs');
const ytdl = require('ytdl-core');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter the YouTube link: ', (link) => {
  rl.question('Enter the folder name: ', (folderName) => {
    rl.close();
    startProgram(link, folderName);
  });
});

async function startProgram(link, folderName) {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(link);
    await page.waitForSelector('#wc-endpoint');
    const elementContent = await page.$$eval('#wc-endpoint', elements => elements.map(el => el.outerHTML));
    await browser.close();
    const arrayIdvideo = getId(elementContent);
    console.log(`Result: `, arrayIdvideo);
    createFolder(folderName);
    downloadVideos(arrayIdvideo, folderName);
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

function getId(input) {
  const output = [];
  input.forEach(yo => {
    const yo2 = yo.split('watch?v=')[1].split('&amp;list=')[0];
    if (yo2.length === 11 && !output.includes(yo2)) {
      output.push(yo2);
    }
  });
  return output;
}

function downloadVideos(arrayIdvideo, folderName, index = 0) {
  if (index >= arrayIdvideo.length) {
    console.log('All videos downloaded successfully!');
    return;
  }

  const id = arrayIdvideo[index];
  const videoUrl = `https://www.youtube.com/watch?v=${id}`;
  const outputFilePath = `./audio/${folderName}/${id}.mp3`;

  ytdl(videoUrl, { filter: 'audioonly' })
    .pipe(fs.createWriteStream(outputFilePath))
    .on('finish', () => {
      console.log(`File ${id} downloaded successfully!`);
      downloadVideos(arrayIdvideo, folderName, index + 1);
    })
    .on('error', (err) => {
      console.error(`Error downloading video ${id}:`, err);
      downloadVideos(arrayIdvideo, folderName, index + 1);
    });
}

function createFolder(folderName) {
  const folderPath = `./audio/${folderName}`;
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
    console.log(`Folder "${folderName}" created successfully.`);
  } else {
    console.log(`Folder "${folderName}" already exists.`);
  }
}
