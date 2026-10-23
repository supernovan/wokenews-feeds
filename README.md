# Woke News — Automated Feeds Engine 📰

Automated 24/7 RSS feed aggregator and data provider for [Woke News](https://wokenews.eu/).

## Live Data Endpoint

The curated news headlines are automatically updated every 5 minutes and available with full CORS support at:
- **GitHub Raw**: `https://raw.githubusercontent.com/supernovan/wokenews-feeds/main/news.json`
- **jsDelivr CDN**: `https://cdn.jsdelivr.net/gh/supernovan/wokenews-feeds@main/news.json`

## Curated Sources

- **Sweden**: SVT, Dagens Nyheter, Aftonbladet, Expressen, ETC, Flamman
- **Germany (EN)**: Der Spiegel, Deutsche Welle
- **International**: The New York Times, The Guardian, Vox, NPR, The Atlantic, Democracy Now!

## Automated Updates

Updated automatically via GitHub Actions in `.github/workflows/update.yml`.
