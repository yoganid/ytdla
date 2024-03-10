const puppeteer = require('puppeteer');
const fs = require('fs');
const ytdl = require('ytdl-core');
const readline = require('readline');
const cheerio = require('cheerio');

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



    const arrayTitlevideo = getTitles(elementContent)
    const arrayIdvideo = getId(elementContent);

    console.log(`Result: `, arrayTitlevideo, arrayIdvideo );

    createFolder(folderName);
    downloadVideos(arrayTitlevideo, arrayIdvideo, folderName);
  } catch (error) {
    console.error('An error occurred:', error);
  }
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

function getId(input) {

  const output = [];

  input.forEach(el => {
    const id = el.split('watch?v=')[1].split('&amp;list=')[0];
    if (id.length === 11 && !output.includes(id)) {
      output.push(id);
    }
  });
  return output;
}

function getTitles(data) {
  
  const videoTitles = [];
  
  for (let i = 0; i < data.length; i++) {
    const $ = cheerio.load(data[i]); // Load the HTML data using cheerio
     // Find all span elements with id "video-title"
  $('span#video-title').each((index, element) => {
    // Push the text content of each matching element to the videoTitles array
    videoTitles.push($(element).text().trim());
});
    
  }

  return videoTitles;
}

function downloadVideos(arrayTitle, arrayIdvideo, folderName, index = 0) {
  if (index >= arrayIdvideo.length) {
    console.log('All videos downloaded successfully!');
    return;
  }

  const id = arrayIdvideo[index];
  const title = arrayTitle[index];
  const videoUrl = `https://www.youtube.com/watch?v=${id}`;
  const outputFilePath = `./audio/${folderName}/${title}.mp3`;

  ytdl(videoUrl, { filter: 'audioonly' })
    .pipe(fs.createWriteStream(outputFilePath))
    .on('finish', () => {
      console.log(`File ${title} downloaded successfully!`);
      downloadVideos(arrayTitle, arrayIdvideo, folderName, index + 1);
    })
    .on('error', (err) => {
      console.error(`Error downloading video ${title}:`, err);
      downloadVideos(arrayTitle, arrayIdvideo, folderName, index + 1);
    });
}



