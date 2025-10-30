export const SCRAPING_CONFIG = {
  defaults: {
    maxPages: 5,
    requestDelayMs: 1200,
    fetchMaxRetries: 4,
    rateLimitBaseDelayMs: 1500,
    captchaBackoffMultiplier: 2,
    headlessNavigationTimeoutMs: 45000,
    headlessWaitUntil: 'domcontentloaded' as const,
    headlessWaitAfterLoadMs: 800,
    requestDelayJitterRatio: 0.35,
    manualWaitAfterMs: 5000,
  },

  urls: {
    avito: 'https://www.avito.ru/birobidzhan/kvartiry/sdam-ASgBAgICAUSSA8gQ',
    youla: [
      'https://youla.ru/birobidzhan/nedvijimost/arenda-kvartiri',
      'https://youla.ru/birobidzhan/nedvijimost/arenda-komnati',
      'https://youla.ru/birobidzhan/nedvijimost/arenda-doma',
      'https://youla.ru/birobidzhan/nedvijimost/arenda-kvartiri-posutochno',
      'https://youla.ru/birobidzhan/nedvijimost/arenda-komnati-posutochno',
      'https://youla.ru/birobidzhan/nedvijimost/arenda-doma-posutochno',
    ],
  },

  selectors: {
    avito: {
      card: [
        'div[data-marker="item"]',
        'div[data-marker="item-root"]',
        'div.iva-item-root-G3n7v',
      ] as const,
      title: [
        'a[data-marker="item-title"]',
        'a[itemprop="url"]',
        'a[class*="title-root"]',
        'a[class*="link-link"]',
      ] as const,
      price: [
        '[data-marker="item-price"]',
        '[class*="price-text"]',
        '[itemprop="price"]',
      ] as const,
      address: [
        '[data-marker="item-address"]',
        '[class*="geo-root"]',
        '[class*="geo-address"]',
      ] as const,
      description: [
        '[data-marker="item-description"]',
        '[class*="snippet-text"]',
        '[class*="description"]',
        '[data-marker="item-properties"]',
      ] as const,
      date: [
        '[data-marker="item-date"] time',
        '[data-marker="item-date"]',
        'time[datetime]',
        'time',
        '[class*="date"]',
      ] as const,
      image: [
        'img[data-marker="image-content"]',
        'img[data-marker="image"]',
        'img[data-marker="item-image"]',
        'img[class*="photo-slider-image"]',
        'img',
      ] as const,
      nextPage: 'a[data-marker="pagination-button/next"]',
    },
    youla: {
      card: [
        'article[data-id]',
        'div[data-test="product-card"]',
        'li[data-test="product-item"]',
      ] as const,
      title: [
        '[data-test="product-title"]',
        'a[data-test="product-card-link"]',
        'a[class*="ProductCardTitle"]',
      ] as const,
      price: [
        '[data-test="product-price"]',
        '[class*="ProductCard_price"]',
        '[itemprop="price"]',
      ] as const,
      address: [
        '[data-test="product-address"]',
        '[class*="ProductCard_address"]',
      ] as const,
      date: [
        '[data-test="product-date"] time',
        '[data-test="product-date"]',
        'time[datetime]',
        'time',
      ] as const,
      image: [
        'img[data-test="product-image"]',
        'img[class*="ProductCardPhoto__image"]',
        'img[data-src]',
        'img',
      ] as const,
      nextPage: 'a[data-test-pagination-link="next"]',
    },
  },

  cookies: {
    youlaLocation: '%7B%22isConfirmed%22%3Atrue%2C%22city%22%3A%7B%22coords%22%3A%7B%22latitude%22%3A48.788167%2C%22longitude%22%3A132.928807%7D%7D%7D',
    avitoBuyerLocationId: '626740',
  },

  rateLimit: {
    statusCodes: new Set([403, 429]),
    captchaMarkers: [
      '\u0434\u043e\u0441\u0442\u0443\u043f \u043e\u0433\u0440\u0430\u043d\u0438\u0447\u0435\u043d',
      'h-captcha',
      'captcha',
    ],
  },

  browser: {
    launchArgs: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--no-zygote',
      '--disable-gpu',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-default-apps',
      '--disable-sync',
      '--metrics-recording-only',
      '--mute-audio',
      '--disable-software-rasterizer',
      '--no-first-run',
    ] as const,
    defaultViewport: { width: 1280, height: 720 } as const,
  },
} as const;
