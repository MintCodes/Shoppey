# Shoppey - Universal Shopping Cart Extension

## 🚀 Quick Start


1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `shoppey-extension/` folder
5. Extension is ready to use!

## 🎯 How to Use

1. Visit any product page on Amazon, eBay, Walmart, etc.
2. Right-click anywhere on the page
3. Select "Add to Shoppey Cart"
4. Click the Shoppey icon in your toolbar to view cart
5. Switch currencies and manage items

## 📁 File Structure

```
shoppey-extension/
├── manifest.json          # Extension configuration
├── background.js          # Service worker with enhanced storage
├── contentScript.js       # Advanced product extraction
├── popup.html            # Enhanced popup with Twitter link
├── popup.js              # Updated logic for new features
├── popup.css             # Styling for larger popup + images
├── icons/
│   ├── logo.png          # Logo
│   ├── icon16.png        # Extension icons (can replace with logo)
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── utils/                 # Utility files
```

## 🎯 Smart Product Detection

The extension now extracts:
- **Product Title** - Accurate title extraction
- **Price & Currency** - Precise pricing with enhanced detection
- **Product Image** - Preview images from multiple sources
- **Store Name** - Website/store name extraction
- **Stock Status** - In stock/out of stock detection
- **Page Validation** - Checks if it's a viable product (not services)

### Enhanced Price Detection:
- Looks for `<price>`, `<pricing>`, `<kaina>` classes
- Searches near buy/cart buttons for pricing
- Improved regex patterns for accuracy
- European decimal format support (1.234,56)
- **eBay-specific price detection** with custom selectors
- **Price undetected handling** - adds items with "Price Undetected" label
- Avoids service pages automatically

Try these product pages to test all features:
- **Amazon**: Full images + stock status
- **eBay**: Store names + availability
- **Walmart**: Product images + pricing
- **Vinted**: Enhanced price detection
- **Any E-commerce**: Universal compatibility (avoids service sites)

## 💡 Features

- **🖼️ Visual Cart**: Product images make items easy to identify
- **🏪 Store Tracking**: Know which store each item is from
- **📦 Stock Awareness**: See availability before purchasing
- **💱 Currency Conversion**: 14 currencies with live rates
- **🔄 Persistent Cart**: Saves items across browser sessions
- **📏 Larger Display**: More items visible, better scrolling
- **ℹ️ User Guidance**: Info modal explains functionality
- **🎯 Smart Filtering**: Avoids service pages automatically

## 🔧 Troubleshooting

**"Manifest file is missing" error:**
- Select the `shoppey-extension` folder directly (not a parent folder)
- Ensure `manifest.json` exists in the selected folder

**Images not loading:**
- Some sites block image extraction
- Extension falls back to logo placeholder

**Stock status unknown:**
- Not all sites provide structured stock data
- Extension shows "? Status Unknown" in these cases

**Not working on some sites:**
- Extension automatically detects and skips service pages
- For unsupported product sites: Click info button → Tweet me!

**Prices showing wrong:**
- Enhanced detection looks for price/pricing classes
- Searches near buy/cart buttons
- Contact me on Twitter for site-specific fixes

**Price shows as "Undetected":**
- Extension still adds the item but couldn't find the price
- Check if the site uses unusual price formatting
- Click info button to request support for the site

**Service page detected:**
- Extension automatically skips service/consulting pages
- Only works on actual product pages
- This is normal behavior

**Extension not loading:**
- Check Chrome DevTools console for errors
- Ensure all files are in correct structure
- Try restarting Chrome

## 📞 Support

**Need support for a specific site?**
- Click the **ℹ️ info button** in the extension
- Follow the Twitter link to contact me
- Mention the site URL and I'll add support!

**Found a bug or have feedback?**
- Use the Twitter link to reach out
- Include screenshots and site URLs when possible
