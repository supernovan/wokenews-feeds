/**
 * Server-side RSS aggregator för Node.js / devServer
 */

const SOURCES = [
  // Tyska källor på engelska
  {
    id: 'spiegel',
    name: 'Der Spiegel',
    shortName: 'SPIEGEL',
    badgeColor: '#e64415',
    textColor: '#ffffff',
    country: 'DE',
    feedUrls: [
      'https://www.spiegel.de/international/index.rss'
    ]
  },
  {
    id: 'dw',
    name: 'Deutsche Welle',
    shortName: 'DW',
    badgeColor: '#002f6c',
    textColor: '#ffffff',
    country: 'DE',
    feedUrls: [
      'https://rss.dw.com/xml/rss-en-all'
    ]
  },

  // Svenska källor
  {
    id: 'svt',
    name: 'SVT Nyheter',
    shortName: 'SVT',
    badgeColor: '#002f6c',
    textColor: '#ffffff',
    country: 'SE',
    feedUrls: [
      'https://www.svt.se/rss.xml'
    ]
  },
  {
    id: 'etc',
    name: 'Dagens ETC',
    shortName: 'ETC',
    badgeColor: '#e50020',
    textColor: '#ffffff',
    country: 'SE',
    feedUrls: [
      'https://www.etc.se/rss.xml'
    ]
  },
  {
    id: 'aftonbladet',
    name: 'Aftonbladet',
    shortName: 'AFTONBLADET',
    badgeColor: '#ffe500',
    textColor: '#121212',
    country: 'SE',
    feedUrls: [
      'https://rss.aftonbladet.se/rss2/small/pages/sections/senastenytt/'
    ]
  },
  {
    id: 'dn',
    name: 'Dagens Nyheter',
    shortName: 'DN',
    badgeColor: '#0a3875',
    textColor: '#ffffff',
    country: 'SE',
    feedUrls: [
      'https://www.dn.se/rss/'
    ]
  },
  {
    id: 'expressen',
    name: 'Expressen',
    shortName: 'EXPRESSEN',
    badgeColor: '#e30613',
    textColor: '#ffffff',
    country: 'SE',
    feedUrls: [
      'https://feeds.expressen.se/nyheter/',
      'https://feeds.expressen.se/nyheter/varlden/',
      'https://feeds.expressen.se/debatt/'
    ]
  },
  {
    id: 'flamman',
    name: 'Flamman',
    shortName: 'FLAMMAN',
    badgeColor: '#9d0208',
    textColor: '#ffffff',
    country: 'SE',
    feedUrls: [
      'https://flamman.se/feed/'
    ]
  },

  // Internationella källor
  {
    id: 'guardian',
    name: 'The Guardian',
    shortName: 'GUARDIAN',
    badgeColor: '#052962',
    textColor: '#ffe500',
    country: 'INT',
    feedUrls: [
      'https://www.theguardian.com/world/rss',
      'https://www.theguardian.com/us-news/rss'
    ]
  },
  {
    id: 'nyt',
    name: 'The New York Times',
    shortName: 'NY TIMES',
    badgeColor: '#121212',
    textColor: '#ffffff',
    country: 'INT',
    feedUrls: [
      'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
      'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml'
    ]
  },
  {
    id: 'vox',
    name: 'Vox',
    shortName: 'VOX',
    badgeColor: '#fff200',
    textColor: '#121212',
    country: 'INT',
    feedUrls: [
      'https://www.vox.com/rss/index.xml'
    ]
  },
  {
    id: 'npr',
    name: 'NPR',
    shortName: 'NPR',
    badgeColor: '#d62027',
    textColor: '#ffffff',
    country: 'INT',
    feedUrls: [
      'https://feeds.npr.org/1001/rss.xml'
    ]
  },
  {
    id: 'atlantic',
    name: 'The Atlantic',
    shortName: 'ATLANTIC',
    badgeColor: '#2b2d42',
    textColor: '#ffffff',
    country: 'INT',
    feedUrls: [
      'https://www.theatlantic.com/feed/all/',
      'https://feeds.feedburner.com/TheAtlantic'
    ]
  },
  {
    id: 'democracynow',
    name: 'Democracy Now!',
    shortName: 'DEMOCRACY NOW',
    badgeColor: '#005f73',
    textColor: '#ffffff',
    country: 'INT',
    feedUrls: [
      'https://www.democracynow.org/democracynow.rss'
    ]
  }
]

const NAMED_ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  lsquo: '‘',
  rsquo: '’',
  sbquo: '‚',
  ldquo: '“',
  rdquo: '”',
  bdquo: '„',
  hellip: '…',
  euro: '€',
  pound: '£',
  copy: '©',
  reg: '®',
  trade: '™'
}

function cleanText(text) {
  if (!text) return ''
  return text
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
    .replace(/<[^>]+>/g, '')
    // Hex-entiteter (t.ex. &#x27;)
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      try { return String.fromCodePoint(parseInt(hex, 16)) } catch { return '' }
    })
    // Decimala entiteter (t.ex. &#039;, &#39;, &#8217;)
    .replace(/&#(\d+);/g, (_, dec) => {
      try { return String.fromCodePoint(parseInt(dec, 10)) } catch { return '' }
    })
    // Namngivna entiteter
    .replace(/&([a-zA-Z]+);/g, (match, name) => NAMED_ENTITIES[name.toLowerCase()] || match)
    // Extra pass vid dubbelkodning som &amp;#039;
    .replace(/&#(\d+);/g, (_, dec) => {
      try { return String.fromCodePoint(parseInt(dec, 10)) } catch { return '' }
    })
    .replace(/\s+/g, ' ')
    .trim()
}

function parseXmlFeed(xmlString, source) {
  const items = []
  if (!xmlString) return items

  // 1. Sök RSS <item>...</item>
  const itemMatches = xmlString.match(/<item[\s>].*?<\/item>/gs)
  if (itemMatches && itemMatches.length > 0) {
    for (let i = 0; i < itemMatches.length; i++) {
      const block = itemMatches[i]

      const titleMatch = block.match(/<title(?:\s[^>]*)?>(.*?)<\/title>/s)
      const linkMatch = block.match(/<link(?:\s[^>]*)?>(.*?)<\/link>/s)
      const guidMatch = block.match(/<guid(?:\s[^>]*)?>(.*?)<\/guid>/s)
      const dateMatch = block.match(/<(?:pubDate|dc:date)(?:\s[^>]*)?>(.*?)<\/(?:pubDate|dc:date)>/s)

      const title = cleanText(titleMatch ? titleMatch[1] : '')
      let link = cleanText(linkMatch ? linkMatch[1] : '')
      if (!link && guidMatch) {
        const guid = cleanText(guidMatch[1])
        if (guid.startsWith('http')) link = guid
      }

      // Hämta kategori
      const catMatch = block.match(/<category(?:\s[^>]*)?>(.*?)<\/category>/s)
      let category = cleanText(catMatch ? catMatch[1] : '')
      if (category.length > 25) category = category.slice(0, 25)

      // Fallback: extrahera från sektions-URL för t.ex. Expressen och The Atlantic
      if (!category && link) {
        if (source.id === 'expressen') {
          const subMatch = link.match(/expressen\.se\/nyheter\/([^/]+)\/([^/]+)/)
          if (subMatch && subMatch[1] && !subMatch[1].includes('-')) {
            const cat = subMatch[1].toLowerCase()
            if (cat === 'varlden') category = 'Världen'
            else if (cat === 'sverige') category = 'Sverige'
            else category = cat.charAt(0).toUpperCase() + cat.slice(1)
          } else {
            const secMatch = link.match(/expressen\.se\/(debatt|ledare|kultur|ekonomi|sport)\//)
            if (secMatch && secMatch[1]) {
              category = secMatch[1].charAt(0).toUpperCase() + secMatch[1].slice(1)
            } else if (link.includes('expressen.se/nyheter/')) {
              category = 'Nyheter'
            }
          }
        } else if (source.id === 'atlantic') {
          const m = link.match(/theatlantic\.com\/([^/]+)\/\d{4}\//)
          if (m && m[1]) {
            category = m[1].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
          }
        }
      }

      if (title && link) {
        let pubDate = new Date().toISOString()
        if (dateMatch) {
          const parsed = new Date(cleanText(dateMatch[1]))
          if (!isNaN(parsed.getTime())) pubDate = parsed.toISOString()
        }

        items.push({
          id: `${source.id}-${i}-${encodeURIComponent(link).slice(-20)}`,
          title,
          link,
          pubDate,
          sourceId: source.id,
          sourceName: source.name,
          sourceShort: source.shortName,
          badgeColor: source.badgeColor,
          textColor: source.textColor,
          country: source.country || 'INT',
          category: category || undefined
        })
      }
    }
    return items
  }

  // 2. Sök Atom <entry>...</entry>
  const entryMatches = xmlString.match(/<entry[\s>].*?<\/entry>/gs)
  if (entryMatches && entryMatches.length > 0) {
    for (let i = 0; i < entryMatches.length; i++) {
      const block = entryMatches[i]

      const titleMatch = block.match(/<title(?:\s[^>]*)?>(.*?)<\/title>/s)
      const linkHrefMatch = block.match(/<link[^>]*href=["']([^"']+)["']/s)
      const linkMatch = block.match(/<link(?:\s[^>]*)?>(.*?)<\/link>/s)
      const dateMatch = block.match(/<(?:published|updated)(?:\s[^>]*)?>(.*?)<\/(?:published|updated)>/s)

      const title = cleanText(titleMatch ? titleMatch[1] : '')
      let link = ''
      if (linkHrefMatch) {
        link = linkHrefMatch[1].trim()
      } else if (linkMatch) {
        link = cleanText(linkMatch[1])
      }

      // Hämta Atom kategori
      const catTermMatch = block.match(/<category[^>]*term=["']([^"']+)["']/s)
      const catMatch = block.match(/<category(?:\s[^>]*)?>(.*?)<\/category>/s)
      let category = ''
      if (catTermMatch) {
        category = cleanText(catTermMatch[1])
      } else if (catMatch) {
        category = cleanText(catMatch[1])
      }
      if (category.length > 25) category = category.slice(0, 25)

      if (title && link) {
        let pubDate = new Date().toISOString()
        if (dateMatch) {
          const parsed = new Date(cleanText(dateMatch[1]))
          if (!isNaN(parsed.getTime())) pubDate = parsed.toISOString()
        }

        items.push({
          id: `${source.id}-${i}-${encodeURIComponent(link).slice(-20)}`,
          title,
          link,
          pubDate,
          sourceId: source.id,
          sourceName: source.name,
          sourceShort: source.shortName,
          badgeColor: source.badgeColor,
          textColor: source.textColor,
          country: source.country || 'INT',
          category: category || undefined
        })
      }
    }
  }

  return items
}

// Minnescache för RSS-anrop
let cachedNews = null
let lastFetchedTime = 0
const CACHE_TTL_MS = 60 * 1000 // 1 minut för snabba uppdateringar

async function fetchAllFeeds(forceRefresh = false, allowFallback = true) {
  const now = Date.now()
  if (!forceRefresh && cachedNews && (now - lastFetchedTime < CACHE_TTL_MS)) {
    return cachedNews
  }

  const tasks = []

  for (const source of SOURCES) {
    for (const url of source.feedUrls) {
      tasks.push(
        (async () => {
          for (let attempt = 0; attempt < 2; attempt++) {
            try {
              const controller = new AbortController()
              const timer = setTimeout(() => controller.abort(), 9000)

              const res = await fetch(url, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                  'Accept': 'application/rss+xml, application/xml, text/xml, */*;q=0.8'
                },
                signal: controller.signal
              })
              clearTimeout(timer)

              if (res.ok) {
                const xml = await res.text()
                const items = parseXmlFeed(xml, source)
                if (items && items.length > 0) return items
              }
            } catch {
              // Vid fel, vänta lite och försök en gång till
            }
            if (attempt === 0) {
              await new Promise(r => setTimeout(r, 600))
            }
          }
          return []
        })()
      )
    }
  }

  const results = await Promise.all(tasks)
  const combined = results.flat()

  // Ta bort eventuella dubbletter baserat på länk
  const seenLinks = new Set()
  const uniqueItems = []
  for (const item of combined) {
    if (!seenLinks.has(item.link)) {
      seenLinks.add(item.link)
      uniqueItems.push(item)
    }
  }

  // Sortera efter nyaste publiceringsdatum
  uniqueItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))

  if (uniqueItems.length > 0) {
    cachedNews = uniqueItems
    lastFetchedTime = now
    return cachedNews
  }

  // Fallback-artiklar om nätverket är otillgängligt
  if (cachedNews && cachedNews.length > 0) {
    return cachedNews
  }

  if (!allowFallback) {
    return []
  }

  return [
    {
      id: 'spiegel-offline-1',
      title: 'Europe Looks Ahead: How Germany and Allies Are Reshaping Green Industrial Policy',
      link: 'https://www.spiegel.de/international/europe-looks-ahead-green-industrial-policy',
      pubDate: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      sourceId: 'spiegel',
      sourceName: 'Der Spiegel',
      sourceShort: 'SPIEGEL',
      badgeColor: '#e64415',
      textColor: '#ffffff',
      country: 'DE'
    },
    {
      id: 'dw-offline-1',
      title: 'Berlin Summit Concludes with Historic Agreement on International Humanitarian Aid',
      link: 'https://www.dw.com/en/berlin-summit-concludes-with-historic-agreement',
      pubDate: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
      sourceId: 'dw',
      sourceName: 'Deutsche Welle',
      sourceShort: 'DW',
      badgeColor: '#002f6c',
      textColor: '#ffffff',
      country: 'DE'
    },
    {
      id: 'svt-offline-1',
      title: 'Ny klimatutredning presenterad: Föreslår kraftigt utbyggd kollektivtrafik',
      link: 'https://www.svt.se/nyheter/inrikes/ny-klimatutredning-presenterad-foreslar-kollektivtrafik',
      pubDate: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      sourceId: 'svt',
      sourceName: 'SVT Nyheter',
      sourceShort: 'SVT',
      badgeColor: '#002f6c',
      textColor: '#ffffff',
      country: 'SE',
      category: 'Klimat'
    },
    {
      id: 'expressen-offline-1',
      title: 'Nya budgetförhandlingarna: Här är punkterna parterna är överens om',
      link: 'https://www.expressen.se/nyheter/politik/nya-budgetforhandlingarna-har-ar-punkterna',
      pubDate: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
      sourceId: 'expressen',
      sourceName: 'Expressen',
      sourceShort: 'EXPRESSEN',
      badgeColor: '#e30613',
      textColor: '#ffffff',
      country: 'SE',
      category: 'Politik'
    },
    {
      id: 'etc-offline-1',
      title: 'Avslöjande: Bankernas rekordvinster slår hårdast mot unga och låginkomsttagare',
      link: 'https://www.etc.se/ekonomi/avslojande-bankernas-rekordvinster',
      pubDate: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      sourceId: 'etc',
      sourceName: 'Dagens ETC',
      sourceShort: 'ETC',
      badgeColor: '#e50020',
      textColor: '#ffffff',
      country: 'SE',
      category: 'Ekonomi'
    },
    {
      id: 'aftonbladet-offline-1',
      title: 'Just nu: Regeringen kallas till krismöte om skolsatsningar',
      link: 'https://www.aftonbladet.se/nyheter/a/just-nu-regeringen-kallas-till-krismote',
      pubDate: new Date(Date.now() - 1000 * 60 * 32).toISOString(),
      sourceId: 'aftonbladet',
      sourceName: 'Aftonbladet',
      sourceShort: 'AFTONBLADET',
      badgeColor: '#ffe500',
      textColor: '#121212',
      country: 'SE',
      category: 'Samhälle'
    },
    {
      id: 'dn-offline-1',
      title: 'Historiskt beslut om naturvård väntas i riksdagen i eftermiddag',
      link: 'https://www.dn.se/sverige/historiskt-beslut-om-naturvard-vantas-i-riksdagen',
      pubDate: new Date(Date.now() - 1000 * 60 * 48).toISOString(),
      sourceId: 'dn',
      sourceName: 'Dagens Nyheter',
      sourceShort: 'DN',
      badgeColor: '#0a3875',
      textColor: '#ffffff',
      country: 'SE',
      category: 'Sverige'
    },
    {
      id: 'flamman-offline-1',
      title: 'Fackförbunden kräver bindande regler mot hyvling av arbetstid',
      link: 'https://flamman.se/fackforbunden-kraver-bindande-regler',
      pubDate: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
      sourceId: 'flamman',
      sourceName: 'Flamman',
      sourceShort: 'FLAMMAN',
      badgeColor: '#9d0208',
      textColor: '#ffffff',
      country: 'SE'
    },
    {
      id: 'guardian-offline-1',
      title: 'Global Climate Summit Reaches Landmark Accord on Renewable Energy Funding',
      link: 'https://www.theguardian.com/environment/global-climate-summit-renewable-energy-funding',
      pubDate: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      sourceId: 'guardian',
      sourceName: 'The Guardian',
      sourceShort: 'GUARDIAN',
      badgeColor: '#052962',
      textColor: '#ffe500',
      country: 'INT'
    },
    {
      id: 'nyt-offline-1',
      title: 'Investigation Details Big Tech Lobbying Against AI Transparency Regulations',
      link: 'https://www.nytimes.com/technology/investigation-big-tech-ai-transparency',
      pubDate: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      sourceId: 'nyt',
      sourceName: 'The New York Times',
      sourceShort: 'NY TIMES',
      badgeColor: '#121212',
      textColor: '#ffffff',
      country: 'INT'
    },
    {
      id: 'vox-offline-1',
      title: 'Why the 4-Day Workweek Movement is Accelerating Across European Economies',
      link: 'https://www.vox.com/economy/why-the-4-day-workweek-movement-is-accelerating',
      pubDate: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
      sourceId: 'vox',
      sourceName: 'Vox',
      sourceShort: 'VOX',
      badgeColor: '#fff200',
      textColor: '#121212',
      country: 'INT'
    },
    {
      id: 'atlantic-offline-1',
      title: 'The Real Threat to Democratic Institutions Isn’t What You Think',
      link: 'https://www.theatlantic.com/ideas/real-threat-to-democratic-institutions',
      pubDate: new Date(Date.now() - 1000 * 60 * 68).toISOString(),
      sourceId: 'atlantic',
      sourceName: 'The Atlantic',
      sourceShort: 'ATLANTIC',
      badgeColor: '#2b2d42',
      textColor: '#ffffff',
      country: 'INT'
    },
    {
      id: 'npr-offline-1',
      title: 'Supreme Court Weighs Milestone Free Speech and Digital Privacy Rights Case',
      link: 'https://www.npr.org/supreme-court-weighs-milestone-free-speech',
      pubDate: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
      sourceId: 'npr',
      sourceName: 'NPR',
      sourceShort: 'NPR',
      badgeColor: '#d62027',
      textColor: '#ffffff',
      country: 'INT'
    },
    {
      id: 'democracynow-offline-1',
      title: 'Grassroots Community Organizers Win Historic Victory on Affordable Housing Mandate',
      link: 'https://www.democracynow.org/grassroots-community-organizers-win-affordable-housing',
      pubDate: new Date(Date.now() - 1000 * 60 * 130).toISOString(),
      sourceId: 'democracynow',
      sourceName: 'Democracy Now!',
      sourceShort: 'DEMOCRACY NOW',
      badgeColor: '#005f73',
      textColor: '#ffffff',
      country: 'INT'
    }
  ]
}

module.exports = {
  SOURCES,
  fetchAllFeeds,
  parseXmlFeed
}

