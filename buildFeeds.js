/**
 * 24/7 RSS News Fetcher for Woke News
 * Fetches all curated feeds and saves to news.json
 */

const fs = require('fs')
const path = require('path')
const { fetchAllFeeds } = require('./serverRss')

const ROOT_URLS = new Set([
  'https://www.svt.se/nyheter',
  'https://www.svt.se/nyheter/',
  'https://www.expressen.se/nyheter',
  'https://www.expressen.se/nyheter/',
  'https://www.aftonbladet.se',
  'https://www.aftonbladet.se/',
  'https://www.dn.se',
  'https://www.dn.se/',
  'https://www.theguardian.com/environment',
  'https://www.theguardian.com/environment/',
  'https://www.nytimes.com',
  'https://www.nytimes.com/',
  'https://www.vox.com',
  'https://www.vox.com/',
  'https://www.theatlantic.com',
  'https://www.theatlantic.com/',
  'https://www.npr.org',
  'https://www.npr.org/',
  'https://www.democracynow.org',
  'https://www.democracynow.org/'
])

function isRealArticle(item) {
  if (!item || !item.link || !item.title) return false
  if (item.id && (item.id.includes('offline') || item.id.includes('mock'))) return false
  if (ROOT_URLS.has(item.link)) return false
  return true
}

async function buildStaticFeeds() {
  console.log('🔄 Hämtar nyheter från RSS-källorna...')

  const maxTimeout = setTimeout(() => {
    console.log('⏱️ RSS-hämtningen tog för lång tid, sparar befintliga.')
    process.exit(0)
  }, 25000)

  try {
    const news = await fetchAllFeeds(true, false)
    clearTimeout(maxTimeout)

    const filePath = path.join(__dirname, 'news.json')

    let existing = []
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, 'utf-8')
        existing = JSON.parse(raw)
      } catch (e) {
        existing = []
      }
    }

    const seenLinks = new Set()
    const merged = []

    for (const item of (news || [])) {
      if (isRealArticle(item) && !seenLinks.has(item.link)) {
        seenLinks.add(item.link)
        merged.push(item)
      }
    }

    for (const item of (existing || [])) {
      if (isRealArticle(item) && !seenLinks.has(item.link)) {
        seenLinks.add(item.link)
        merged.push(item)
      }
    }

    merged.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))

    const finalArticles = merged.slice(0, 1000)

    fs.writeFileSync(filePath, JSON.stringify(finalArticles, null, 2), 'utf-8')
    console.log(`✅ ${finalArticles.length} färska nyheter sparades till news.json!`)
  } catch (err) {
    console.error('❌ Fel vid RSS-hämtning:', err.message)
  }

  process.exit(0)
}

buildStaticFeeds()
