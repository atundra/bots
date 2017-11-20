const {JSDOM} = require('jsdom');
const request = require('request-promise-native');
const Post = require('./post');


const getElementText = element => element ? element.textContent.trim() : null;

const parse = async _ => {
  const html = await request.get('https://sneakernews.com/release-dates/');
  const {window: {document}} = new JSDOM(html);

  const nodeList = document.querySelectorAll('.release-post-list .sneaker-post-main');
  const postsElements = Array.from(nodeList);
  return postsElements.map(element => {
    const dateElement = element.querySelector('.release-date');
    const dateValue = dateElement ? dateElement.textContent : null;
    const date = dateValue ? new Date(dateValue) : null;

    const imgElement = element.querySelector('.release-img img');
    const imgUrl = imgElement ? imgElement.src : null;

    const nameElement = element.querySelector('.post-header .header-title');
    const name = getElementText(nameElement);

    const priceElement = element.querySelector('.release-price');
    const price = getElementText(priceElement);

    const urlElement = element.querySelector('.post-header .header-title a');
    const url = urlElement ? urlElement.href : null;

    return new Post({
      date: Number.isNaN(+date) ? null : date,
      imgUrl,
      name,
      price,
      url,
    });
  });
}

module.exports = parse;
