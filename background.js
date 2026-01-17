const CART_STORAGE_KEY = 'shoppey_cart';
const EXCHANGE_RATE_API = 'https://api.exchangerate.host/latest';
const CACHE_DURATION = 60 * 60 * 1000;
const STORAGE_KEY_RATES = 'shoppey_exchange_rates';
const STORAGE_KEY_TIMESTAMP = 'shoppey_rates_timestamp';
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
async function getCartItems() {
  try {
    const result = await chrome.storage.local.get([CART_STORAGE_KEY]);
    return result[CART_STORAGE_KEY] || [];
  } catch (error) {
    console.error('Error getting cart items:', error);
    return [];
  }
}
async function addCartItem(item) {
  try {
    const cartItems = await getCartItems();
    const newItem = {
      id: generateId(),
      title: item.title,
      price: item.price,
      currency: item.currency,
      image: item.image || null,
      storeName: item.storeName || null,
      stockStatus: item.stockStatus || 'unknown',
      url: item.url,
      addedAt: new Date().toISOString()
    };
    cartItems.push(newItem);
    await chrome.storage.local.set({ [CART_STORAGE_KEY]: cartItems });
    return newItem;
  } catch (error) {
    console.error('Error adding cart item:', error);
    throw error;
  }
}
async function removeCartItem(itemId) {
  try {
    const cartItems = await getCartItems();
    const filteredItems = cartItems.filter(item => item.id !== itemId);
    if (filteredItems.length === cartItems.length) {
      return false; // Item not found
    }
    await chrome.storage.local.set({ [CART_STORAGE_KEY]: filteredItems });
    return true;
  } catch (error) {
    console.error('Error removing cart item:', error);
    return false;
  }
}
async function clearCart() {
  try {
    await chrome.storage.local.set({ [CART_STORAGE_KEY]: [] });
    return true;
  } catch (error) {
    console.error('Error clearing cart:', error);
    return false;
  }
}
async function getCartStats() {
  try {
    const cartItems = await getCartItems();
    return {
      itemCount: cartItems.length,
      items: cartItems
    };
  } catch (error) {
    console.error('Error getting cart stats:', error);
    return { itemCount: 0, items: [] };
  }
}
async function fetchExchangeRates() {
  try {
    const currencies = 'USD,EUR,GBP,CAD,AUD,JPY,CHF,SEK,NOK,DKK,PLN,CZK,HUF';
    const response = await fetch(`${EXCHANGE_RATE_API}?base=USD&symbols=${currencies}`);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    const data = await response.json();
    if (!data.success || !data.rates) {
      throw new Error('Invalid API response');
    }
    return data.rates;
  } catch (error) {
    console.warn('Exchange rate API failed, using fallback rates:', error.message);
    return {
      USD: 1,
      EUR: 0.85,
      GBP: 0.75,
      CAD: 1.35,
      AUD: 1.50,
      JPY: 110,
      CHF: 0.92,
      SEK: 10.5,
      NOK: 10.8,
      DKK: 6.8,
      PLN: 4.2,
      CZK: 23.5,
      HUF: 365
    };
  }
}
async function getExchangeRates() {
  try {
    const cache = await chrome.storage.local.get([STORAGE_KEY_RATES, STORAGE_KEY_TIMESTAMP]);
    const now = Date.now();
    if (cache[STORAGE_KEY_RATES] && cache[STORAGE_KEY_TIMESTAMP] &&
        (now - cache[STORAGE_KEY_TIMESTAMP]) < CACHE_DURATION) {
      return cache[STORAGE_KEY_RATES];
    }
    const rates = await fetchExchangeRates();
    await chrome.storage.local.set({
      [STORAGE_KEY_RATES]: rates,
      [STORAGE_KEY_TIMESTAMP]: now
    });
    return rates;
  } catch (error) {
    console.warn('Error getting exchange rates, using fallback rates:', error.message);
    return {
      USD: 1,
      EUR: 0.85,
      GBP: 0.75,
      CAD: 1.35,
      AUD: 1.50,
      JPY: 110,
      CHF: 0.92,
      SEK: 10.5,
      NOK: 10.8,
      DKK: 6.8,
      PLN: 4.2,
      CZK: 23.5,
      HUF: 365
    };
  }
}
async function convertCurrency(amount, fromCurrency, toCurrency) {
  if (!amount || amount === 0) return 0;
  if (fromCurrency === toCurrency) return amount;
  try {
    const rates = await getExchangeRates();
    const amountInUSD = fromCurrency === 'USD' ? amount : amount / rates[fromCurrency];
    const convertedAmount = toCurrency === 'USD' ? amountInUSD : amountInUSD * rates[toCurrency];
    return Math.round(convertedAmount * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    console.error('Error converting currency:', error);
    return amount; // Return original amount if conversion fails
  }
}
function createContextMenu() {
  chrome.contextMenus.create({
    id: 'add-to-shoppey-cart',
    title: 'Add to Shoppey Cart',
    contexts: ['page'],
    documentUrlPatterns: ['http://*/*', 'https://*/*']
  });
}
async function handleContextMenuClick(info, tab) {
  if (info.menuItemId === 'add-to-shoppey-cart') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'extractProductInfo'
    }, async (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error sending message to content script:', chrome.runtime.lastError.message || chrome.runtime.lastError);
        showNotification('Error communicating with page', 'Please refresh and try again');
        return;
      }
      if (response && response.productInfo) {
        const productInfo = response.productInfo;
        if (productInfo.error) {
          switch (productInfo.error) {
            case 'service_page':
              showNotification('Service Page Detected', 'This appears to be a service page, not a product page');
              break;
            case 'no_title':
              showNotification('No Product Title Found', 'Could not identify the product title');
              break;
            case 'price_undetected':
              await addProductToCart(productInfo, true);
              break;
            case 'not_product_page':
              showNotification('Not a Product Page', 'This doesn\'t appear to be a product page');
              break;
            case 'extraction_failed':
              showNotification('Extraction Failed', 'Could not extract product information');
              break;
            default:
              showNotification('Unknown Error', 'Something went wrong');
          }
          return;
        }
        await addProductToCart(productInfo);
      } else {
        console.warn('No product info received from content script');
        showNotification('No Product Info', 'Could not extract product information');
      }
    });
  }
}
function showNotification(title, message) {
  try {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/logo.png'),
      title: title,
      message: message
    });
  } catch (error) {
    console.error('Error showing notification:', error);
  }
}
async function addProductToCart(productInfo, priceUndetected = false) {
  try {
    if (priceUndetected) {
      const item = await addCartItem({
        title: productInfo.title,
        price: 0, // Default price when undetected
        currency: 'USD',
        image: productInfo.image,
        storeName: productInfo.storeName,
        stockStatus: 'unknown',
        url: productInfo.url
      });
      showNotification('Product added (Price Undetected)', `${productInfo.title} - Price could not be detected`);
      return;
    }
    const item = await addCartItem(productInfo);
    showNotification('Product added to cart!', productInfo.title);
  } catch (error) {
    console.error('Error adding product to cart:', error);
    showNotification('Failed to add product', 'Please try again');
  }
}
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install' || details.reason === 'update') {
    createContextMenu();
    initializeStorage();
  }
});
chrome.contextMenus.onClicked.addListener((info, tab) => {
  handleContextMenuClick(info, tab);
});
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sender, sendResponse);
  return true;
});
async function handleMessage(request, sender, sendResponse) {
  try {
    switch (request.action) {
      case 'addToCart':
        const item = await addCartItem(request.item);
        sendResponse({ success: true, item });
        break;
      case 'getCartItems':
        const items = await getCartItems();
        sendResponse({ success: true, items });
        break;
      case 'removeCartItem':
        const removed = await removeCartItem(request.itemId);
        sendResponse({ success: removed });
        break;
      case 'clearCart':
        const cleared = await clearCart();
        sendResponse({ success: cleared });
        break;
      case 'convertCurrency':
        const convertedAmount = await convertCurrency(
          request.amount,
          request.fromCurrency,
          request.toCurrency
        );
        sendResponse({ success: true, convertedAmount });
        break;
      case 'getExchangeRates':
        const rates = await getExchangeRates();
        sendResponse({ success: true, rates });
        break;
      case 'getCartStats':
        const stats = await getCartStats();
        sendResponse({ success: true, stats });
        break;
      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ success: false, error: error.message });
  }
}
async function initializeStorage() {
  try {
    const result = await chrome.storage.local.get(['shoppey_preferences']);
    if (!result.shoppey_preferences) {
      await chrome.storage.local.set({
        shoppey_preferences: {
          currency: 'USD'
        }
      });
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
}