const { JSDOM } = require('jsdom');
const request = require('request-promise-native');
const Post = require('./post');

const getElementText = (element) =>
  element ? element.textContent.trim() : null;

const parse = async (_) => {
  const html = await request.get('https://sneakernews.com/release-dates/');
  const {
    window: { document },
  } = new JSDOM(html);

  const nodeList = document.querySelectorAll(
    '.release-post-list .releases-box'
  );
  const postsElements = Array.from(nodeList);
  return postsElements
    .map((element) => {
      const dateElement = element.querySelector('.release-date');
      const dateValue = getElementText(dateElement);
      const date = dateValue ? new Date(dateValue) : null;

      const imgElement = element.querySelector('.image-box img');
      const imgUrl = imgElement ? imgElement.src : null;

      const nameElement = element.querySelector('.content-box [id^="title"]');
      const name = getElementText(nameElement);

      const priceElement = element.querySelector('.release-price');
      const price = getElementText(priceElement);

      const urlElement = element.querySelector('.content-box [id^="title"]');
      const url = urlElement ? urlElement.href : null;

      if (!name || !price || !url) {
        return null;
      }

      return new Post({
        date: Number.isNaN(+date) ? null : date,
        imgUrl,
        name,
        price,
        url,
      });
    })
    .filter((post) => post);
};

module.exports = parse;
