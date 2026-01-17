# Shoppey - Universal Shopping Cart Extension

## 🚀 Quick Start

1. **Replace the logo**: Copy your `logo icon (1).png` file to `shoppey-extension/icons/logo.png`
2. Open Chrome → `chrome://extensions/`
3. Enable "Developer mode" (top right toggle)
4. Click "Load unpacked"
5. Select the `shoppey-extension/` folder
6. Extension is ready to use!

## 🎯 How to Use

1. Visit any product page on Amazon, eBay, Walmart, etc.
2. Right-click anywhere on the page
3. Select "Add to Shoppey Cart"
4. Click the Shoppey icon in your toolbar to view cart
5. Switch currencies and manage items

## ✨ Latest Features

- **🖼️ Product Images**: Automatically extracts and displays product preview images
- **🏪 Store Names**: Shows which store/website the product is from
- **📦 Stock Status**: Displays if items are in stock, out of stock, or unknown
- **🐦 Twitter Link**: Follow button linking to https://x.com/mintvait
- **ℹ️ Info Button**: Click for detailed explanation of how it works
- **📏 Larger Popup**: Increased width (450px) for better viewing
- **📜 Scrollable List**: Can scroll through many cart items
- **🎨 Custom Logo**: Uses your logo icon for branding
- **🎯 Smart Product Detection**: Avoids service pages, focuses on viable products
- **🔍 Enhanced Price Detection**: Looks for price/pricing/kaina classes and near buy buttons

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
│   ├── logo.png          # 🎨 YOUR CUSTOM LOGO HERE
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

## 🔧 Customization

### Replace the Logo
1. Copy your `logo icon (1).png` file
2. Rename it to `logo.png`
3. Place it in `shoppey-extension/icons/`
4. Reload the extension in Chrome

### Info Modal
- Click the **ℹ️ info button** to learn how it works
- Explains limitations and support request process
- Links to your Twitter for feature requests

### Twitter Link
- Automatically links to https://x.com/mintvait
- Hover text: "Follow Me!"
- Opens in new tab

## 🧪 Test Sites

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
- **🐦 Social Integration**: Direct link to your Twitter
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