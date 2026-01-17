const elements = {
  currencySelect: document.getElementById('currency-select'),
  cartContainer: document.getElementById('cart-container'),
  cartItems: document.getElementById('cart-items'),
  emptyCart: document.getElementById('empty-cart'),
  cartFooter: document.getElementById('cart-footer'),
  totalAmount: document.getElementById('total-amount'),
  clearCartBtn: document.getElementById('clear-cart-btn'),
  loading: document.getElementById('loading'),
  errorMessage: document.getElementById('error-message'),
  infoBtn: document.getElementById('info-btn'),
  infoModal: document.getElementById('info-modal'),
  closeModal: document.getElementById('close-modal')
};
let currentCurrency = 'USD';
let cartItems = [];
document.addEventListener('DOMContentLoaded', async () => {
  await initializePopup();
  setupEventListeners();
});
async function initializePopup() {
  try {
    showLoading();
    const result = await chrome.storage.local.get(['shoppey_preferences']);
    if (result.shoppey_preferences && result.shoppey_preferences.currency) {
      currentCurrency = result.shoppey_preferences.currency;
      elements.currencySelect.value = currentCurrency;
    }
    await loadCartItems();
    hideLoading();
  } catch (error) {
    console.error('Error initializing popup:', error);
    showError('Failed to load cart');
    hideLoading();
  }
}
function setupEventListeners() {
  elements.currencySelect.addEventListener('change', handleCurrencyChange);
  elements.clearCartBtn.addEventListener('click', handleClearCart);
  elements.infoBtn.addEventListener('click', showInfoModal);
  elements.closeModal.addEventListener('click', hideInfoModal);
  elements.infoModal.addEventListener('click', (e) => {
    if (e.target === elements.infoModal) {
      hideInfoModal();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elements.infoModal.style.display !== 'none') {
      hideInfoModal();
    }
  });
}
async function loadCartItems() {
  try {
    const response = await sendMessageToBackground({ action: 'getCartItems' });
    if (response.success) {
      cartItems = response.items;
      renderCart();
    } else {
      throw new Error(response.error || 'Failed to load cart items');
    }
  } catch (error) {
    console.error('Error loading cart items:', error);
    showError('Failed to load cart items');
  }
}
async function renderCart() {
  const hasItems = cartItems.length > 0;
  elements.emptyCart.style.display = hasItems ? 'none' : 'flex';
  elements.cartItems.style.display = hasItems ? 'block' : 'none';
  elements.cartFooter.style.display = hasItems ? 'block' : 'none';
  if (!hasItems) {
    return;
  }
  elements.cartItems.innerHTML = '';
  for (const item of cartItems) {
    const itemElement = await createCartItemElement(item);
    elements.cartItems.appendChild(itemElement);
  }
  await updateTotal();
}
function formatCurrency(amount, currency) {
  const symbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    CAD: 'C$',
    AUD: 'A$',
    JPY: '¥',
    CHF: 'Fr',
    SEK: 'kr',
    NOK: 'kr',
    DKK: 'kr',
    PLN: 'zł',
    CZK: 'Kč',
    HUF: 'Ft'
  };
  const symbol = symbols[currency] || currency;
  if (currency === 'JPY') {
    return `${symbol}${Math.round(amount)}`;
  }
  return `${symbol}${amount.toFixed(2)}`;
}
async function createCartItemElement(item) {
  const itemDiv = document.createElement('div');
  itemDiv.className = 'cart-item';
  itemDiv.dataset.itemId = item.id;
  let formattedPrice;
  let originalPriceText = '';
  let priceClass = '';
  if (item.price === 0 || !item.price) {
    formattedPrice = 'Price Undetected';
    priceClass = 'item-price-price-undetected';
  } else {
    const convertedPrice = await convertCurrency(item.price, item.currency, currentCurrency);
    formattedPrice = formatCurrency(convertedPrice, currentCurrency);
    if (item.currency !== currentCurrency) {
      originalPriceText = ` (${formatCurrency(item.price, item.currency)})`;
    }
  }
  const truncatedTitle = item.title.length > 80 ? item.title.substring(0, 77) + '...' : item.title;
  const stockClass = item.stockStatus === 'in_stock' ? 'stock-in-stock' :
                     item.stockStatus === 'out_of_stock' ? 'stock-out-of-stock' : 'stock-unknown';
  const stockText = item.stockStatus === 'in_stock' ? '✓ In Stock' :
                    item.stockStatus === 'out_of_stock' ? '✗ Out of Stock' : '? Status Unknown';
  const imageSrc = item.image || 'icons/logo.png';
  itemDiv.innerHTML = `
    <div class="item-image">
      <img src="${imageSrc}" alt="${item.title}" onerror="this.src='icons/logo.png'">
    </div>
    <div class="item-content">
      <div class="item-header">
        <div class="item-title" title="${item.title}">${truncatedTitle}</div>
        <div class="item-store">${item.storeName || 'Unknown Store'}</div>
      </div>
      <div class="item-details">
        <div class="item-price ${priceClass}">${formattedPrice}${originalPriceText}</div>
        <div class="item-stock ${stockClass}">${stockText}</div>
      </div>
    </div>
    <div class="item-actions">
      <button class="visit-btn" data-url="${item.url}" title="Visit product page">
        <img src="icons/logo.png" alt="Visit" class="action-icon">
      </button>
      <button class="remove-btn" data-item-id="${item.id}" title="Remove from cart">×</button>
    </div>
  `;
  const visitBtn = itemDiv.querySelector('.visit-btn');
  const removeBtn = itemDiv.querySelector('.remove-btn');
  visitBtn.addEventListener('click', () => handleVisitProduct(item.url));
  removeBtn.addEventListener('click', () => handleRemoveItem(item.id));
  return itemDiv;
}
async function updateTotal() {
  try {
    let total = 0;
    for (const item of cartItems) {
      const convertedPrice = await convertCurrency(item.price, item.currency, currentCurrency);
      total += convertedPrice;
    }
    const formattedTotal = formatCurrency(total, currentCurrency);
    elements.totalAmount.textContent = formattedTotal;
  } catch (error) {
    console.error('Error updating total:', error);
    elements.totalAmount.textContent = 'Error';
  }
}
async function handleCurrencyChange(event) {
  const newCurrency = event.target.value;
  if (newCurrency === currentCurrency) return;
  currentCurrency = newCurrency;
  await chrome.storage.local.set({
    shoppey_preferences: { currency: currentCurrency }
  });
  await renderCart();
}
function handleVisitProduct(url) {
  chrome.tabs.create({ url: url });
  window.close(); // Close popup
}
async function handleRemoveItem(itemId) {
  try {
    showLoading();
    const response = await sendMessageToBackground({
      action: 'removeCartItem',
      itemId: itemId
    });
    if (response.success) {
      cartItems = cartItems.filter(item => item.id !== itemId);
      await renderCart();
    } else {
      throw new Error('Failed to remove item');
    }
    hideLoading();
  } catch (error) {
    console.error('Error removing item:', error);
    showError('Failed to remove item');
    hideLoading();
  }
}
async function handleClearCart() {
  if (!confirm('Are you sure you want to clear your entire cart?')) {
    return;
  }
  try {
    showLoading();
    const response = await sendMessageToBackground({ action: 'clearCart' });
    if (response.success) {
      cartItems = [];
      await renderCart();
    } else {
      throw new Error('Failed to clear cart');
    }
    hideLoading();
  } catch (error) {
    console.error('Error clearing cart:', error);
    showError('Failed to clear cart');
    hideLoading();
  }
}
async function convertCurrency(amount, fromCurrency, toCurrency) {
  try {
    const response = await sendMessageToBackground({
      action: 'convertCurrency',
      amount: amount,
      fromCurrency: fromCurrency,
      toCurrency: toCurrency
    });
    return response.success ? response.convertedAmount : amount;
  } catch (error) {
    console.error('Error converting currency:', error);
    return amount;
  }
}
function sendMessageToBackground(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}
function showLoading() {
  elements.loading.style.display = 'flex';
  elements.errorMessage.style.display = 'none';
}
function hideLoading() {
  elements.loading.style.display = 'none';
}
function showInfoModal() {
  elements.infoModal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}
function hideInfoModal() {
  elements.infoModal.style.display = 'none';
  document.body.style.overflow = '';
}
function showError(message) {
  elements.errorMessage.querySelector('.error-text').textContent = message;
  elements.errorMessage.style.display = 'flex';
  elements.loading.style.display = 'none';
}