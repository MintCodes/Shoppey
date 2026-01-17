chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractProductInfo') {
    const productInfo = extractProductInfo();
    sendResponse({ productInfo });
  }
  return true; // Keep message channel open for async response
});
function extractProductInfo() {
  try {
    if (isServicePage()) {
      console.log('Detected service/non-product page, skipping extraction');
      return { error: 'service_page' };
    }
    const title = extractTitle();
    const priceInfo = extractPrice();
    if (!title) {
      console.warn('Could not extract product title');
      return { error: 'no_title' };
    }
    if (!priceInfo) {
      console.warn('Could not extract product price');
      return {
        title: title.trim(),
        error: 'price_undetected',
        image: extractProductImage(),
        storeName: extractStoreName(),
        url: window.location.href
      };
    }
    if (!isProductPage(title, priceInfo.amount)) {
      console.log('Page does not appear to be a viable product page');
      return { error: 'not_product_page' };
    }
    const image = extractProductImage();
    const storeName = extractStoreName();
    const stockStatus = extractStockStatus();
    const url = window.location.href;
    return {
      title: title.trim(),
      price: priceInfo.amount,
      currency: priceInfo.currency,
      image: image,
      storeName: storeName,
      stockStatus: stockStatus,
      url: url
    };
  } catch (error) {
    console.error('Error extracting product info:', error);
    return { error: 'extraction_failed' };
  }
}
function extractTitle() {
  const titleSelectors = [
    '[data-cy="title-recipe"]',
    '.product-title',
    '.product-name',
    '.item-title',
    '.product-detail-title',
    '.product__title',
    '.product-title-text',
    '.a-size-large.product-title-word-break',
    '.productTitle',
    '#productTitle',
    '#title',
    'h1',
    '#productTitle',
    '.a-size-large.a-spacing-none',
    '#itemTitle',
    '.it-ttl',
    '[data-automation-id="product-title"]',
    '.prod-ProductTitle',
    'h1:first-of-type',
    'title'
  ];
  for (const selector of titleSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      return cleanTitle(element.textContent.trim());
    }
  }
  if (document.title) {
    return cleanTitle(document.title);
  }
  return null;
}
function extractPrice() {
  const priceSelectors = [
    '.a-price .a-offscreen',
    '.a-price-whole',
    '.a-color-price',
    '#priceblock_ourprice',
    '#priceblock_dealprice',
    '#priceblock_saleprice',
    '.notranslate',
    '.u-flL',
    '.vi-price',
    '#prcIsum',
    '#mm-saleDscPrc',
    '.u-flL .notranslate',
    '.vi-VR-cvipPrice',
    '.u-flL .vi-price',
    '[data-testid="x-price-primary"]',
    '[data-automation-id="product-price"]',
    '.prod-PriceHero',
    '.price-characteristic',
    '.price',
    '.pricing',
    '.kaina',
    '.product-price',
    '.item-price',
    '.sale-price',
    '.current-price',
    '[data-price]',
    '[data-testid*="price"]',
    '[class*="price"]',
    '[class*="pricing"]',
    '[class*="kaina"]',
    '.product__price',
    '.price--current',
    '.price-current',
    '.price-value',
    '.price-amount',
    '.cost',
    '.amount',
    '.u-flL .notranslate:first-child',
    '.vi-binPrce .notranslate',
    '.u-dspn .notranslate'
  ];
  for (const selector of priceSelectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      const text = element.textContent || element.getAttribute('data-price') || '';
      const priceInfo = parsePriceString(text);
      if (priceInfo) {
        return priceInfo;
      }
    }
  }
  if (window.location.hostname.includes('ebay')) {
    const ebayPrice = extractEbayPrice();
    if (ebayPrice) {
      return ebayPrice;
    }
  }
  const buyButtonSelectors = [
    'button[class*="buy"]',
    'button[class*="cart"]',
    'button[class*="purchase"]',
    'button[class*="add-to-cart"]',
    'a[class*="buy"]',
    'a[class*="cart"]',
    'input[type="submit"][value*="buy" i]',
    'input[type="submit"][value*="cart" i]',
    '.buy-button',
    '.cart-button',
    '.add-to-cart',
    '.purchase-button',
    '#buy-button',
    '#add-to-cart'
  ];
  for (const buttonSelector of buyButtonSelectors) {
    const buttons = document.querySelectorAll(buttonSelector);
    for (const button of buttons) {
      let parent = button.parentElement;
      for (let i = 0; i < 3 && parent; i++) { // Check up to 3 levels up
        const priceElements = parent.querySelectorAll('*');
        for (const elem of priceElements) {
          if (elem !== button) {
            const text = elem.textContent || '';
            const priceInfo = parsePriceString(text);
            if (priceInfo) {
              return priceInfo;
            }
          }
        }
        parent = parent.parentElement;
      }
    }
  }
  const pageText = document.body.textContent;
  const priceRegex = /[$€£]\s?\d[\d\.,]*/g;
  const matches = pageText.match(priceRegex);
  if (matches) {
    for (const match of matches) {
      const priceInfo = parsePriceString(match);
      if (priceInfo && priceInfo.amount > 0 && priceInfo.amount < 100000) { // Sanity check
        return priceInfo;
      }
    }
  }
  const priceFromJsonLd = extractPriceFromJsonLd();
  if (priceFromJsonLd) {
    return priceFromJsonLd;
  }
  return null;
}
function extractPriceFromJsonLd() {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent);
      const products = Array.isArray(data) ? data : [data];
      for (const product of products) {
        if (product['@type'] === 'Product' && product.offers) {
          const offers = Array.isArray(product.offers) ? product.offers : [product.offers];
          for (const offer of offers) {
            if (offer.price && offer.priceCurrency) {
              const amount = parseFloat(offer.price);
              if (!isNaN(amount) && amount > 0) {
                return {
                  amount: amount,
                  currency: offer.priceCurrency
                };
              }
            }
          }
        }
      }
    } catch (error) {
      continue;
    }
  }
  return null;
}
function extractEbayPrice() {
  const ebaySelectors = [
    '#prcIsum',
    '.notranslate.u-flL',
    '.vi-price .notranslate',
    '#mm-saleDscPrc',
    '.u-flL .notranslate:first-child',
    '[data-testid="x-price-primary"] .notranslate',
    '.vi-binPrce .notranslate'
  ];
  for (const selector of ebaySelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const text = element.textContent.trim();
      const cleanText = text.replace(/^(US\s*|GBP\s*|EUR\s*|CAD\s*|AUD\s*)/i, '');
      const priceInfo = parsePriceString(cleanText);
      if (priceInfo) {
        return priceInfo;
      }
    }
  }
  const priceContainers = document.querySelectorAll('.u-flL, .vi-price, .notranslate');
  for (const container of priceContainers) {
    const text = container.textContent.trim();
    if (/[\$£€]\s*\d/.test(text) || /^\d/.test(text)) {
      const priceInfo = parsePriceString(text);
      if (priceInfo) {
        return priceInfo;
      }
    }
  }
  return null;
}
function extractEbayStock() {
  const soldOutSelectors = [
    '.notranslate',
    '.u-flL',
    '.vi-qtyS',
    '.u-dspn'
  ];
  for (const selector of soldOutSelectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      const text = element.textContent.toLowerCase();
      if (text.includes('sold out') || text.includes('out of stock') ||
          text.includes('unavailable') || text.includes('ended')) {
        return 'out_of_stock';
      }
    }
  }
  const qtyElement = document.querySelector('.vi-qtyS, .u-flL .notranslate');
  if (qtyElement) {
    const qtyText = qtyElement.textContent.toLowerCase();
    if (qtyText.includes('available') || qtyText.includes('left') ||
        /\d+\s*(available|left)/.test(qtyText)) {
      return 'in_stock';
    }
  }
  const buyButtons = document.querySelectorAll('[data-testid*="buy"], .vi-VR-btnWdth, .u-flL input[type="submit"]');
  if (buyButtons.length > 0) {
    return 'in_stock';
  }
  return 'unknown';
}
function parsePriceString(priceString) {
  if (!priceString || typeof priceString !== 'string') return null;
  const cleanString = priceString.replace(/\s+/g, ' ').trim();
  const patterns = [
    { regex: /\$\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/, currency: 'USD' },
    { regex: /€\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{1,2})?)/, currency: 'EUR' },
    { regex: /£\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/, currency: 'GBP' },
    { regex: /USD\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/i, currency: 'USD' },
    { regex: /EUR\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{1,2})?)/i, currency: 'EUR' },
    { regex: /GBP\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/i, currency: 'GBP' },
    { regex: /CAD\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/i, currency: 'CAD' },
    { regex: /AUD\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/i, currency: 'AUD' },
    { regex: /JPY\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/i, currency: 'JPY' },
    { regex: /CHF\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{1,2})?)/i, currency: 'CHF' },
    { regex: /SEK\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{1,2})?)/i, currency: 'SEK' },
    { regex: /NOK\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{1,2})?)/i, currency: 'NOK' },
    { regex: /DKK\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{1,2})?)/i, currency: 'DKK' },
    { regex: /PLN\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{1,2})?)/i, currency: 'PLN' },
    { regex: /CZK\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{1,2})?)/i, currency: 'CZK' },
    { regex: /HUF\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{1,2})?)/i, currency: 'HUF' }
  ];
  for (const pattern of patterns) {
    const match = cleanString.match(pattern.regex);
    if (match && match[1]) {
      let amountStr = match[1].replace(/,/g, '');
      if (amountStr.includes('.') && amountStr.includes(',')) {
        const parts = amountStr.split(',');
        if (parts.length === 2) {
          amountStr = parts[0].replace(/\./g, '') + '.' + parts[1];
        }
      }
      const amount = parseFloat(amountStr);
      if (!isNaN(amount) && amount > 0 && amount < 10000000) {
        return { amount, currency: pattern.currency };
      }
    }
  }
  return null;
}
function extractProductImage() {
  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage?.getAttribute('content')) {
    return ogImage.getAttribute('content');
  }
  const twitterImage = document.querySelector('meta[name="twitter:image"]');
  if (twitterImage?.getAttribute('content')) {
    return twitterImage.getAttribute('content');
  }
  const selectors = [
    '.product-image img',
    '.product-photo img',
    '#product-image img',
    '.main-image img',
    '[data-testid="primary-image"]',
    '.zoom img'
  ];
  for (const selector of selectors) {
    const img = document.querySelector(selector);
    if (img?.src && img.src.includes('http') && !img.src.includes('icon') && !img.src.includes('logo')) {
      return img.src;
    }
  }
  let largestImg = null;
  let maxArea = 0;
  document.querySelectorAll('img').forEach(img => {
    if (img.src && img.src.includes('http') && img.offsetWidth > 150 && img.offsetHeight > 150) {
      const area = img.offsetWidth * img.offsetHeight;
      if (area > maxArea) {
        maxArea = area;
        largestImg = img;
      }
    }
  });
  return largestImg?.src || null;
}
function extractStoreName() {
  const ogSiteName = document.querySelector('meta[property="og:site_name"]');
  if (ogSiteName && ogSiteName.getAttribute('content')) {
    return ogSiteName.getAttribute('content');
  }
  if (document.title) {
    const titleParts = document.title.split('|').map(part => part.trim());
    if (titleParts.length > 1) {
      return titleParts[titleParts.length - 1];
    }
    const dashParts = document.title.split('-').map(part => part.trim());
    if (dashParts.length > 1) {
      return dashParts[dashParts.length - 1];
    }
  }
  try {
    const hostname = new URL(window.location.href).hostname;
    return hostname.replace(/^www\./, '').split('.')[0].replace(/^\w/, c => c.toUpperCase());
  } catch (error) {
    return null;
  }
}
function extractStockStatus() {
  if (window.location.hostname.includes('ebay')) {
    const ebayStock = extractEbayStock();
    if (ebayStock !== 'unknown') {
      return ebayStock;
    }
  }
  const stockSelectors = [
    '.a-color-success',
    '.availability',
    '.u-flL',
    '.notranslate',
    '.vi-qtyS',
    '.u-flL .notranslate',
    '[data-testid="out-of-stock"]',
    '.prod-ProductCTA--outOfStock',
    '.stock-status',
    '.availability',
    '.in-stock',
    '.out-of-stock',
    '[data-stock-status]'
  ];
  for (const selector of stockSelectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      const text = element.textContent.toLowerCase();
      if (text.includes('out of stock') || text.includes('unavailable') ||
          text.includes('sold out') || text.includes('discontinued')) {
        return 'out_of_stock';
      }
      if (text.includes('in stock') || text.includes('available') ||
          text.includes('ready to ship') || text.includes('ships within')) {
        return 'in_stock';
      }
    }
  }
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent);
      const products = Array.isArray(data) ? data : [data];
      for (const product of products) {
        if (product['@type'] === 'Product' && product.offers) {
          const offers = Array.isArray(product.offers) ? product.offers : [product.offers];
          for (const offer of offers) {
            if (offer.availability) {
              if (offer.availability.includes('InStock') || offer.availability.includes('In stock')) {
                return 'in_stock';
              }
              if (offer.availability.includes('OutOfStock') || offer.availability.includes('Out of stock')) {
                return 'out_of_stock';
              }
            }
          }
        }
      }
    } catch (error) {
      continue;
    }
  }
  return 'unknown';
}
function isServicePage() {
  const pageText = document.body.textContent.toLowerCase();
  const title = document.title.toLowerCase();
  const url = window.location.href.toLowerCase();
  const serviceKeywords = [
    'service', 'consulting', 'consultation', 'freelance', 'gig',
    'tutoring', 'coaching', 'mentoring', 'training', 'course',
    'workshop', 'webinar', 'subscription', 'membership',
    'software as a service', 'saas', 'platform', 'app',
    'digital product', 'download', 'ebook', 'guide',
    'template', 'theme', 'plugin', 'extension'
  ];
  if (url.includes('/services') || url.includes('/consulting') ||
      url.includes('/courses') || url.includes('/training') ||
      url.includes('/coaching') || url.includes('/mentoring')) {
    return true;
  }
  for (const keyword of serviceKeywords) {
    if (title.includes(keyword) || pageText.includes(keyword)) {
      const productKeywords = ['product', 'item', 'buy', 'purchase', 'cart', 'shop'];
      let hasProductContext = false;
      for (const productKeyword of productKeywords) {
        if (title.includes(productKeyword) || pageText.includes(productKeyword)) {
          hasProductContext = true;
          break;
        }
      }
      if (!hasProductContext) {
        return true;
      }
    }
  }
  return false;
}
function isProductPage(title, price) {
  if (price < 0.01 || price > 1000000) {
    return false; // Unreasonable price range
  }
  const titleLower = title.toLowerCase();
  const productIndicators = [
    'product', 'item', 'new', 'brand', 'size', 'color',
    'model', 'version', 'edition', 'pack', 'set', 'bundle',
    'wireless', 'bluetooth', 'usb', 'hdmi', '4k', '1080p'
  ];
  const serviceIndicators = [
    'service', 'consulting', 'training', 'course', 'coaching',
    'mentoring', 'tutoring', 'subscription', 'membership'
  ];
  let productScore = 0;
  let serviceScore = 0;
  for (const indicator of productIndicators) {
    if (titleLower.includes(indicator)) productScore++;
  }
  for (const indicator of serviceIndicators) {
    if (titleLower.includes(indicator)) serviceScore++;
  }
  if (serviceScore > productScore) {
    return false;
  }
  const buyElements = document.querySelectorAll([
    'button[class*="buy"]', 'button[class*="cart"]', 'button[class*="purchase"]',
    'a[class*="buy"]', 'a[class*="cart"]', '.add-to-cart', '#add-to-cart',
    'input[value*="buy" i]', 'input[value*="cart" i]'
  ].join(', '));
  return buyElements.length > 0 || productScore > 0;
}
function cleanTitle(title) {
  return title
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[\n\r\t]/g, ' ') // Replace newlines/tabs with spaces
    .replace(/^\s*[-•*]\s*/, '') // Remove leading bullets
    .replace(/\s*[-•*]\s*$/, '') // Remove trailing bullets
    .trim();
}