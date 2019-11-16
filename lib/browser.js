const log = require('debug')('sar:browser')
const puppeteer = require('puppeteer')
const got = require('got')
const UA = require('user-agents')
const getFreeHttpsProxy = require('get-free-https-proxy')

module.exports = async function browser (options = { useProxy: process.env.USE_PROXY !== 'false', headless: false, width: 1280, height: 800 }) {
  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-infobars',
    '--no-first-run',
    `--window-size=${options.width},${options.height}`,
    '--window-position=0,0',
    '--ignore-certifcate-errors',
    '--ignore-certifcate-errors-skip-list',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
    '--hide-scrollbars',
    '--disable-notifications'

  ]

  const browserOptions = { args, ignoreHTTPSErrors: true }
  if (options.headless === true || options.headless === false) {
    log('headless', options.headless)
    Object.assign(browserOptions, { headless: options.headless })
  }
  if (Number.isFinite(options.slowMo)) {
    log('slowMo', options.slowMo, 'ms')
    Object.assign(browserOptions, { slowMo: options.slowMo })
  }

  const instance = await puppeteer.launch(browserOptions)

  log('new browser', options)
  return {
    async newPage (url) {
      const pages = await instance.pages()
      const page = (pages.length > 0) ? pages[0] : await instance.newPage()
      const userAgent = randomUA()
      log('userAgent', userAgent)
      await page.setUserAgent(userAgent)
      await page.setViewport({ width: options.width, height: options.height })
      if (options.useProxy) {
        await setProxy(page)
      }

      if (url) {
        try {
          await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false })
            Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] })
            window.navigator.chrome = { runtime: {} }
          })

          await page.goto(url, {
            timeout: 5000,
            waitUntil: 'networkidle2'
          })
        } catch (err) {
          log(err.message)
        }
      }
      return page
    },
    instance
  }
}

async function setProxy (page) {
  let proxies = await getFreeHttpsProxy()
  await page.setRequestInterception(true)
  page.on('request', async (interceptedRequest) => {
    const blockedResourceTypes = [
      'image',
      'media',
      'font',
      'ws',
      'texttrack',
      'object',
      'beacon',
      'csp_report',
      'imageset',
      'stylesheet',
      'javascript'
    ]

    const skippedResources = [
      'quantserve',
      'adzerk',
      'doubleclick',
      'adition',
      'exelator',
      'sharethrough',
      'cdn.api.twitter',
      'google-analytics',
      'googletagmanager',
      'google',
      'fontawesome',
      'facebook',
      'analytics',
      'optimizely',
      'clicktale',
      'mixpanel',
      'zedo',
      'clicksor',
      'tiqcdn'
    ]

    const requestUrl = interceptedRequest._url.split('?')[0].split('#')[0]
    if (
      blockedResourceTypes.indexOf(interceptedRequest.resourceType()) !== -1 ||
      skippedResources.some(resource => requestUrl.indexOf(resource) !== -1)
    ) {
      return interceptedRequest.abort().catch(Function.prototype)
    }

    const index = Math.min(proxies.length, parseInt(Math.random() * proxies.length, 10))
    const proxy = proxies[index]
    if (!proxy) {
      return interceptedRequest.continue().catch(Function.prototype)
    }
    // log('using proxy', proxy, index)
    await got({
      url: interceptedRequest.url(),
      method: interceptedRequest.method(),
      headers: interceptedRequest.headers(),
      body: interceptedRequest.postData(),
      proxy: `https://${proxy.host}:${proxy.port}`
    })
      .then(response => interceptedRequest.respond({
        status: response.statusCode,
        contentType: response.headers['content-type'],
        headers: response.headers,
        body: response.body
      }))
      .catch(async (_) => {
        proxies = proxies.filter((_, i) => i !== index)
        if (proxies.length === 0) {
          proxies = await getFreeHttpsProxy()
        }
      })

    await interceptedRequest.continue().catch(Function.prototype)
  })
}

function randomUA () {
  return new UA({ deviceCategory: 'desktop' }).toString()
}