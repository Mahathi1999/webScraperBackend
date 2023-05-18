const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const port = process.env.PORT|| 3001;

// Enable CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

// Route for scraping product information
app.get('/scrape', async (req, res) => {
  try {
    const searchTerm = req.query.term;

    const amazonUrl = `https://www.amazon.in/s?k=${searchTerm}`;
    const flipkartUrl = `https://www.flipkart.com/search?q=${searchTerm}`;
    const snapdealUrl = `https://www.snapdeal.com/search?keyword=${searchTerm}`;

    const [amazonResponse, flipkartResponse, snapdealResponse] = await Promise.all([
      axios.get(amazonUrl),
      axios.get(flipkartUrl),
      axios.get(snapdealUrl)
    ]);

    const amazonProducts = scrapeAmazon(amazonResponse.data);
    const flipkartProducts = scrapeFlipkart(flipkartResponse.data);
    const snapdealProducts = scrapeSnapdeal(snapdealResponse.data);

    const scrapedData = {
      amazon: amazonProducts,
      flipkart: flipkartProducts,
      snapdeal: snapdealProducts
    };

    res.json(scrapedData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// Function to scrape Amazon
function scrapeAmazon(html) {
  const $ = cheerio.load(html);

  const products = [];

  $('.s-result-item').each((index, element) => {
    const name = $(element).find('.a-link-normal .a-text-normal').text().trim();
    const price = $(element).find('.a-offscreen').text().trim();
    const imageUrl = $(element).find('.s-image').attr('src');

    if (name && price && imageUrl) {
      products.push({ name, price, imageUrl });
    }
  });

  return products;
}

// Function to scrape Flipkart
function scrapeFlipkart(html) {
  const $ = cheerio.load(html);

  const products = [];

  $('._1AtVbE').each((index, element) => {
    const name = $(element).find('a._4rR01T').text().trim();
    const price = $(element).find('div._30jeq3._1_WHN1').text().trim();
    const imageUrl = $(element).find('img._396cs4._3exPp9').attr('src');

    if (name && price && imageUrl) {
      products.push({ name, price, imageUrl });
    }
  });

  return products;
}

// Function to scrape Snapdeal
function scrapeSnapdeal(html) {
  const $ = cheerio.load(html);

  const products = [];

  $('.product-tuple-listing').each((index, element) => {
    const name = $(element).find('.product-title').text().trim();
    const price = $(element).find('.product-price').text().trim();
    const imageUrl = $(element).find('.product-image img').attr('src');

    if (name && price && imageUrl) {
      products.push({ name, price, imageUrl });
    }
  });

  return products;
}

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
