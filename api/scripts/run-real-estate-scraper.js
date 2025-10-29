#!/usr/bin/env node

/**
 * Playwright scraper for Avito apartment rentals in Birobidzhan.
 *
 * Compared to the Puppeteer variant, Playwright has better built-in proxy
 * support (including SOCKS) and allows you to run in headed mode to manually
 * solve Avito's "Доступ ограничен" interstitial when required.
 *
 * Usage examples:
 *   node api/scripts/run-real-estate-scraper-playwright.js --pages 2
 *   node api/scripts/run-real-estate-scraper-playwright.js --pages 2 --proxy socks5://user:pass@host:9050
 *   node api/scripts/run-real-estate-scraper-playwright.js --headless false --manual
 *
 * IMPORTANT: Avito blocks most non-Russian IPs and datacenter IP blocks.
 * Use a residential proxy located in Russia or run the script from an
 * allowed network. The script will raise descriptive errors when the proxy
 * is misconfigured or the IP is blocked.
 */

const { chromium } = require('playwright');
const { URL } = require('url');

const DEFAULT_SEARCH_URL =
  'https://www.avito.ru/birobidzhan/kvartiry/sdam-ASgBAgICAUSSA8gQ?context=H4sIAAAAAAAA_wFNALL_YToyOntzOjg6ImZyb21QYWdlIjtzOjEyOiJyZWNlbnRTZWFyY2giO3M6OToiZnJvbV9wYWdlIjtzOjEyOiJyZWNlbnRTZWFyY2giO32YQ9UcTQAAAA';

const HAR_USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 YaBrowser/25.8.0.0 Safari/537.36';

const HAR_EXTRA_HEADERS = {
  accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'accept-encoding': 'gzip, deflate, br, zstd',
  'accept-language': 'ru,en;q=0.9',
  'cache-control': 'max-age=0',
  referer: 'https://www.avito.ru/birobidzhan/nedvizhimost?localPriority=0',
  'sec-ch-ua': '"Not)A;Brand";v="8", "Chromium";v="138", "YaBrowser";v="25.8", "Yowser";v="2.5"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Linux"',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'same-origin',
  'sec-fetch-user': '?1',
  'upgrade-insecure-requests': '1',
};

const HAR_COOKIE_STRING =
  'srv_id=Zto1KLGUaSkSvynG.Gwc2jhg4529UAnbdT1JurQ_hZLlNR6mbUCmZ1dW5U3vYEY6PFTQNABSKQCinOcAgn9ex.ojuFyto1xUnn0Sbir5O0J2e0PKAgHSJfMc_KBGIivvY=.web; gMltIuegZN2COuSe=EOFGWsm50bhh17prLqaIgdir1V0kgrvN; u=37bj1el5.1muygv3.pjrustwddu0; cookie_consent_shown=1; _ym_uid=1761551333939275276; _ym_d=1761551333; __ai_fp_uuid=671ac58dfe4a6a27%3A1; uxs_uid=650e5100-b309-11f0-9546-db3a646b149b; _gcl_au=1.1.1434067768.1761551339; __upin=vDbLIZFNGqzoxq6NgS+74Q; ma_id_api=05kOiZqz76D1E/6njqV8/njpZitiJphTQQVzmwlRcbm0z7t6AukbX5fQSP06fR+jQ20WjBjmXzkmcsXAlLbLLhme8j8Xt7G352MTYvB2y1WIOto5Gscocbh8gw/th9WOQOL67rLPqOIMJr/RzhMq/VJygC0sA9GRMeUo72c0ew9O+eJyDZ1uTL9pdRzbR+twQnWQX93Kw2HTQStDKn7EKMWdldEoy3NofqQOL6Qbn/cXrPmaBTJv0+82wTJLCvVtVbd7vyl8MAXkDRZjFmfa45EHmw5/29vO3Dt/WcFbw9EQD6qsg/ztMa+g/OqekbORMNszHYnYeC7Oa7MeYBHR7g==; ma_id=9474128101761551336203; _buzz_aidata=JTdCJTIydWZwJTIyJTNBJTIydkRiTElaRk5HcXpveHE2TmdTJTJCNzRRJTIyJTJDJTIyYnJvd3NlclZlcnNpb24lMjIlM0ElMjIyNS44JTIyJTJDJTIydHNDcmVhdGVkJTIyJTNBMTc2MTU1MTMzOTYyNSU3RA==; _buzz_mtsa=JTdCJTIydWZwJTIyJTNBJTIyNWNhZGVkNWNkMTBmN2Q1NzlkZTFkNWIxODlkZDhkN2MlMjIlMkMlMjJicm93c2VyVmVyc2lvbiUyMiUzQSUyMjI1LjglMjIlMkMlMjJ0c0NyZWF0ZWQlMjIlM0ExNzYxNTUxMzM5NjQ3JTdE; _ga=GA1.1.1879617030.1761551345; tmr_lvid=8d69466eb5edf5a8c941674d7c5c6961; tmr_lvidTS=1761551345906; adrcid=AOLR1h7TEA5MbvWKILGMlWA; adrcid=AOLR1h7TEA5MbvWKILGMlWA; buyer_location_id=626740; __zzatw-avito=MDA0dBA=Fz2+aQ==; __zzatw-avito=MDA0dBA=Fz2+aQ==; cfidsw-avito=Fx6bfWGqcrA3xX5Ouk+ZzH23eUfspRmgLKH9EExuvcO1rL36W8AiYv66AyiBx72Ic4E45UU9sYhHdCSwg0hI0Q2S6wRF0aluvSch1VqmW2jMoxNuGma4eGoBBFMB6IlxnQtq36dKWY+JCmiTFOTQyIsN; cfidsw-avito=Fx6bfWGqcrA3xX5Ouk+ZzH23eUfspRmgLKH9EExuvcO1rL36W8AiYv66AyiBx72Ic4E45UU9sYhHdCSwg0hI0Q2S6wRF0aluvSch1VqmW2jMoxNuGma4eGoBBFMB6IlxnQtq36dKWY+JCmiTFOTQyIsN; ma_cid=1761603649403483045; cfidsw-avito=Fc037rFsoPSAkUS+Yz0MMoqVMGa4rqh1oUxeatNr6XQAkBUtxH/MVJb2W7rl1JxeF/Ej8WxhfZemO5yEjTZGj/9YxukhLrRu76ROx/DmUGRdWe34kb2CenLjzNw8aQtFMuCtApz8ilDgowKilJbHFXT5Wns8UEwl72iP; SEARCH_HISTORY_IDS=1; _ym_isad=1; utm_source_ad=avito_banner; acs_3=%7B%22hash%22%3A%221aa3f9523ee6c2690cb34fc702d4143056487c0d%22%2C%22nst%22%3A1761784355761%2C%22sl%22%3A%7B%22224%22%3A1761697955761%2C%221228%22%3A1761697955761%7D%7D; acs_3=%7B%22hash%22%3A%221aa3f9523ee6c2690cb34fc702d4143056487c0d%22%2C%22nst%22%3A1761784355761%2C%22sl%22%3A%7B%22224%22%3A1761697955761%2C%221228%22%3A1761697955761%7D%7D; adrdel=1761697961807; adrdel=1761697961807; domain_sid=yib5FzzYDX2o_P-nvLVzM%3A1761697962401; f=5.0c4f4b6d233fb90636b4dd61b04726f1a6bb7312e5dad7c9a6bb7312e5dad7c9a6bb7312e5dad7c9a6bb7312e5dad7c919308f9a005528bd19308f9a005528bd19308f9a005528bda6bb7312e5dad7c9431077337c77cbe0431077337c77cbe00df103df0c26013a7b0d53c7afc06d0b2ebf3cb6fd35a0ac0df103df0c26013a8b1472fe2f9ba6b9c7f279391b0a395990d83bac5e6e82bd74c4a16376f87ccd915ac1de0d03411231a1058e37535dce34d62295fceb188df88859c11ff008953de19da9ed218fe2d50b96489ab264ed143114829cf33ca77fde300814b1e8553de19da9ed218fe23de19da9ed218fe2c772035eab81f5e1f88859c11ff00895b5b87f59517a23f2a9a996d174584814352c31daf983fa077a7b6c33f74d335c76ff288cd99dba461b4abd54a7aa79b003f2e1a870b7803b93c9b68e6a8180055a214da8ce6cc9426c077a27e7792376367747bffd95b6693e0333a5c4830a9d91e52da22a560f550df103df0c26013a0df103df0c26013aaaa2b79c1ae92595709a762f9985f319220041a3abc2001a3de19da9ed218fe2c772035eab81f5e123f5e56da7ec04f4f7a45c048c7c5f3a00f2cb9c31a9d42c; ft="x3+x2Fiz54meO5Yze0O4FH4f/Zct/1zJzR+ubbTJdTowNU+sOapKpE5o4VpUbqxjWs5lfGoEO08h4xvNKkiqhgzBcleO4mYajxxTLOpPwxzKQjZ10ANj5hzSNk2XOQrbIxjSuQIPe/k0f2FluQc9JjGTOaIsFb0MYmmLNa7EkyWL+hwv02qo37Me8kJMlb8g"; ma_ss_64a8dba6-67f3-4fe4-8625-257c4adae014=1761697956879003421.2.1761699044.2.1761697956; luri=birobidzhan; sx=H4sIAAAAAAAC%2F1zPzU4UQRAA4Hfp8xy6prt%2Beq%2BDEQjIqKzCsburCt11XSFGjGTe3XiYxOUFvuR7CRE4C6TYhChCEaCI7trYigFrDpuX8CtswsU83dy1qx9390q7engOQ7CwASbgOHKRZQgASgyxldgzltzqWD3SKN6jp%2Bq8UrsHeqJ7v%2FIP8%2B%2Fb7c35CYX0j8rMlMy6uhpVz9xBsZNxNuTGulKP49c31%2B%2BO43TZt7c%2FD%2FE%2FSjAzLkPgbpJsdK9RuHtCaG4mSbXXhiWt1KVuz54mmA8Xbf%2F57Hx%2FQiHQMgSJXFMmzKAYG8Ui1kdRhxRRhMtKfWd8n6%2BPkFUmOn7yk6BAWobQqpok91pyMTFC7pzQeybVkbmtFH37WMrD%2FOjPf97OX3b7V1Rclr8BAAD%2F%2F3XLVZrDAQAA; _ga_M29JC28873=GS2.1.s1761720741$o12$g1$t1761721757$j60$l0$h0; v=1761721758; tmr_detect=0%7C1761721760169; _ym_visorc=b; abp=0; _adcc=1.5tdKwCSSGQYVWqTT0h1s/RPHavMKLht+H/rm2bV3RYtXnB2ukUMvb4JkfLdw38U0vsYQvYQ; buyer_from_page=catalog; cssid=72f4b1b3-022f-4925-9985-79a0e36b5d8a; cssid_exp=1761725549276; csprefid=4ffb6268-bc1f-4c02-b137-2748cb622527';

async function scrapeWithPlaywright(options = {}) {
  const {
    searchUrl = DEFAULT_SEARCH_URL,
    maxPages = 1,
    headless = true,
    slowMo = 0,
    proxy = process.env.AVITO_PROXY,
    manual = false,
    waitAfterManualMs = 5_000,
    waitUntil = 'domcontentloaded',
  } = options;

  const proxyConfig = proxy ? parseProxy(proxy) : null;

  const browser = await chromium.launch({
    headless,
    slowMo,
    proxy: proxyConfig
      ? {
          server: proxyConfig.server,
          username: proxyConfig.credentials?.username,
          password: proxyConfig.credentials?.password,
        }
      : undefined,
  });

  const context = await browser.newContext({
    locale: 'ru-RU',
    userAgent: HAR_USER_AGENT,
    extraHTTPHeaders: HAR_EXTRA_HEADERS,
  });

  const cookies = parseCookieString(HAR_COOKIE_STRING);
  if (cookies.length) {
    await context.addCookies(cookies);
  }

  const page = await context.newPage();
  const debugLog = [];
  const allListings = [];
  let skipNextNavigation = false;

  // Allow the operator to manually solve Avito's access wall in headed mode.
  if (!headless && manual) {
    console.log('Manual mode: the browser is open. Solve any captchas/walls, then press Enter.');
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
    await waitForEnterKey();
    await page.waitForTimeout(waitAfterManualMs);
    skipNextNavigation = true;
  }

  try {
    for (let pageIndex = 1; pageIndex <= maxPages; pageIndex += 1) {
      const targetUrl = buildPageUrl(searchUrl, pageIndex);
      debugLog.push(`Navigating to ${targetUrl}`);

      const listings = await scrapeSingleResultsPage(page, targetUrl, {
        proxyConfig,
        waitUntil,
        skipNavigation: skipNextNavigation,
      });
      debugLog.push(`Page ${pageIndex}: extracted ${listings.length} listings.`);

      allListings.push(...listings);
      skipNextNavigation = false;

      if (!listings.length) {
        debugLog.push('No listings on current page, stopping pagination.');
        break;
      }
    }

    return { listings: deduplicateListings(allListings), debugLog };
  } finally {
    await browser.close();
  }
}

function buildPageUrl(baseUrl, pageNumber) {
  if (pageNumber <= 1) {
    return baseUrl;
  }

  const url = new URL(baseUrl);
  url.searchParams.set('p', String(pageNumber));
  return url.toString();
}

async function scrapeSingleResultsPage(page, url, navigationOptions) {
  const { proxyConfig, waitUntil, skipNavigation } = navigationOptions;
  const needsNavigation = !skipNavigation || page.url().split('#')[0] !== url;

  if (needsNavigation) {
    try {
      await page.goto(url, {
        waitUntil,
        timeout: 60_000,
      });
    } catch (error) {
      throw enhanceNavigationError(error, proxyConfig);
    }
  } else {
    await page.waitForLoadState(waitUntil, { timeout: 60_000 }).catch(() => {});
  }

  const html = await page.content();

  if (/Доступ ограничен/i.test(html) || /Access\s+Denied/i.test(html)) {
    throw new Error(
      [
        'Avito blocked the current IP address.',
        'Use a residential Russian proxy or rerun with --headless false --manual to solve the interstitial manually.',
      ].join(' '),
    );
  }

  const locator = page.locator('[data-marker="item"], div.iva-item-root-G3n7v');
  const count = await locator.count();

  if (!count) {
    throw new Error(
      'No listing cards found. Avito markup may have changed or additional interaction is required.',
    );
  }

  const listings = [];

  for (let index = 0; index < count; index += 1) {
    const card = locator.nth(index);
    const record = await extractListing(card);
    if (record) {
      listings.push(record);
    }
  }

  return listings;
}

async function extractListing(card) {
  const normalize = (text) =>
    typeof text === 'string' ? text.replace(/\s+/g, ' ').trim() : '';

  const extractNumber = (text) => {
    const digits = (text || '').match(/\d+/g);
    return digits ? Number(digits.join('')) : null;
  };

  const id = await card.getAttribute('data-item-id');

  const titleElement = card.locator('a[data-marker="item-title"], a[itemprop="url"], a[class*="title-root"]');
  const title = normalize(await safeInnerText(titleElement));
  const url = normalize(await safeHref(titleElement));

  const priceElement = card.locator('[data-marker="item-price"], [class*="price-text"]');
  const priceText = normalize(await safeInnerText(priceElement));
  const price = priceText ? extractNumber(priceText) : null;

  const addressElement = card.locator('[data-marker="item-address"], [class*="geo-root"], [class*="geo-address"]');
  const address = normalize(await safeInnerText(addressElement));

  const descriptionElement = card.locator('[data-marker="item-description"], [class*="snippet-text"], [class*="description"]');
  const description = normalize(await safeInnerText(descriptionElement));

  const timeElement = card.locator('[data-marker="item-date"] time, time, [class*="date"]');
  const publishedAt = await safeDatetime(timeElement);

  if (!title && !url) {
    return null;
  }

  return {
    id,
    title,
    url,
    priceText,
    price,
    address,
    description,
    publishedAt,
  };
}

async function safeInnerText(locator) {
  try {
    if (!(await locator.count())) {
      return null;
    }
    return await locator.innerText();
  } catch {
    return null;
  }
}

async function safeHref(locator) {
  try {
    if (!(await locator.count())) {
      return null;
    }
    const href = await locator.first().getAttribute('href');
    if (!href) {
      return null;
    }
    return new URL(href, 'https://www.avito.ru').href;
  } catch {
    return null;
  }
}

async function safeDatetime(locator) {
  try {
    if (!(await locator.count())) {
      return null;
    }
    const timeHandle = locator.first();
    const datetime = await timeHandle.getAttribute('datetime');
    if (datetime) {
      return datetime;
    }
    return await timeHandle.innerText();
  } catch {
    return null;
  }
}

function deduplicateListings(listings) {
  const map = new Map();

  for (const item of listings) {
    const key = item.id || item.url;
    if (!key || map.has(key)) {
      continue;
    }
    map.set(key, item);
  }

  return Array.from(map.values());
}

function parseCliArguments(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    switch (token) {
      case '--pages':
      case '-p':
        args.maxPages = Number(argv[++index] ?? 1);
        break;
      case '--proxy':
        args.proxy = argv[++index];
        break;
      case '--headless':
        args.headless = parseHeadless(argv[++index]);
        break;
      case '--slowmo':
        args.slowMo = Number(argv[++index] ?? 0);
        break;
      case '--url':
        args.searchUrl = argv[++index];
        break;
      case '--manual':
        args.manual = true;
        break;
      case '--wait-manual-ms':
        args.waitAfterManualMs = Number(argv[++index] ?? 5_000);
        break;
      case '--wait-until':
        args.waitUntil = parseWaitUntil(argv[++index]);
        break;
      default:
        break;
    }
  }

  return args;
}

function parseHeadless(value) {
  if (value === undefined) {
    return true;
  }

  if (value === 'false' || value === '0') {
    return false;
  }

  if (value === 'true' || value === '1') {
    return true;
  }

  throw new Error(`Invalid value for --headless: ${value}`);
}

function parseWaitUntil(value) {
  const allowed = new Set(['domcontentloaded', 'load', 'networkidle', 'commit']);
  if (!value || !allowed.has(value)) {
    throw new Error(
      `Invalid value for --wait-until: ${value}. Supported: domcontentloaded, load, networkidle, commit.`,
    );
  }
  return value;
}

function parseProxy(raw) {
  try {
    const proxyUrl = new URL(raw);

    if (!proxyUrl.hostname) {
      throw new Error('missing host');
    }

    const scheme = proxyUrl.protocol.replace(/:$/, '');
    const supportedSchemes = new Set([
      'http',
      'https',
      'socks4',
      'socks4a',
      'socks5',
      'socks5h',
    ]);

    if (!supportedSchemes.has(scheme)) {
      throw new Error(`unsupported scheme "${scheme}"`);
    }

    const credentials =
      proxyUrl.username || proxyUrl.password
        ? {
            username: decodeURIComponent(proxyUrl.username),
            password: decodeURIComponent(proxyUrl.password),
          }
        : null;

    return {
      server: `${scheme}://${proxyUrl.host}`,
      credentials,
      scheme,
    };
  } catch (error) {
    throw new Error(
      `Invalid proxy value "${raw}". Expected format scheme://user:pass@host:port`,
      { cause: error },
    );
  }
}

function enhanceNavigationError(error, proxyConfig) {
  const message = error?.message || '';

  if (message.includes('ERR_NO_SUPPORTED_PROXIES')) {
    const schemeLabel = proxyConfig?.scheme || 'provided';
    return new Error(
      `Chromium rejected the proxy scheme "${schemeLabel}". Use an HTTP/HTTPS proxy or install a local Chrome build and expose it via PLAYWRIGHT_BROWSERS_PATH=0.`,
      { cause: error },
    );
  }

  if (message.includes('ERR_PROXY_CONNECTION_FAILED')) {
    const target = proxyConfig?.server || 'the configured proxy';
    return new Error(
      `Failed to connect to ${target}. Verify the proxy host, port, credentials, and that the service is reachable from this machine.`,
      { cause: error },
    );
  }

  return error instanceof Error ? error : new Error(String(error));
}

async function waitForEnterKey() {
  return new Promise((resolve, reject) => {
    try {
      process.stdin.resume();
      process.stdin.once('data', () => {
        process.stdin.pause();
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}

function parseCookieString(rawCookies) {
  if (!rawCookies) {
    return [];
  }

  const expires = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;

  return rawCookies
    .split(/;\s*/)
    .map((pair) => {
      const [name, ...rest] = pair.split('=');
      if (!name || !rest.length) {
        return null;
      }
      return {
        name,
        value: rest.join('='),
        domain: '.avito.ru',
        path: '/',
        expires,
        httpOnly: false,
        secure: true,
      };
    })
    .filter(Boolean);
}

if (require.main === module) {
  const cliOptions = parseCliArguments(process.argv.slice(2));

  scrapeWithPlaywright(cliOptions)
    .then(({ listings, debugLog }) => {
      console.log(JSON.stringify({ listings, debugLog }, null, 2));
    })
    .catch((error) => {
      console.error('Scraping failed.');
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}

module.exports = { scrapeWithPlaywright };
