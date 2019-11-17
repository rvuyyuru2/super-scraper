const log = require('debug')('sar:storage:html-cache')
const extractAsin = require('../extract-asin')
const extractPage = require('../extract-page')
const normalizeUrl = require('../normalize-url')
const path = require('path')
const fs = require('fs')

module.exports = {
  htmlPathFor,
  htmlDirFor,
  jsonPathFor,
  jsonDirFor,
  saveHtmlFor,
  saveJSONFor,
  readHtmlFor,
  readJSONFor
}

function pathFor (url, type) {
  const basepath = path.resolve(__dirname, '..', '..', type)
  const asin = extractAsin(url)
  const pageNumber = extractPage(url)
  if (asin && pageNumber) {
    return path.resolve(basepath, 'amazon', asin, `${asin}-${pageNumber}.${type}`)
  }
  return path.resolve(basepath, 'page', `${normalizeUrl(url)}.${type}`)
}
function dirFor (url, type) {
  const basepath = path.resolve(__dirname, '..', '..', type)
  const asin = extractAsin(url)
  if (asin) {
    return path.resolve(basepath, 'amazon', asin)
  }
  return path.resolve(basepath, 'page')
}

function htmlPathFor (url) {
  return pathFor(url, 'html')
}

function htmlDirFor (url) {
  return dirFor(url, 'html')
}
function jsonPathFor (url) {
  return pathFor(url, 'json')
}

function jsonDirFor (url) {
  return dirFor(url, 'json')
}

function saveHtmlFor (url, content) {
  const htmlPath = htmlPathFor(url)
  const htmlDir = htmlDirFor(url)
  log(`saving ${htmlPath}`)
  try { fs.mkdirSync(htmlDir) } catch (err) { }
  try {
    fs.writeFileSync(htmlPath, content, { encoding: 'utf8' })
    log(`saved ${htmlPath}`)
  } catch (err) { log(`failed to save ${htmlPath}`, err.message) }
}
function saveJSONFor (url, content) {
  const jsonPath = jsonPathFor(url)
  const jsonDir = jsonDirFor(url)
  log(`saving ${jsonPath}`)
  try { fs.mkdirSync(jsonDir) } catch (err) { }
  try {
    fs.writeFileSync(jsonPath, JSON.stringify(content), { encoding: 'utf8' })
    log(`saved ${jsonPath}`)
  } catch (err) { log(`failed to save ${jsonPath}`, err.message) }
}

function readHtmlFor (url) {
  const htmlPath = htmlPathFor(url)
  log(`reading ${htmlPath}`)
  try {
    return fs.readFileSync(htmlPath, { encoding: 'utf8' }).toString('utf-8')
  } catch (err) { log(`failed to read ${htmlPath}`, err.message) }
}
function readJSONFor (url) {
  const jsonPath = jsonPathFor(url)
  log(`reading ${jsonPath}`)
  try {
    const content = fs.readFileSync(jsonPath, { encoding: 'utf8' }).toString('utf-8')
    return JSON.parse(content)
  } catch (err) { log(`failed to read ${jsonPath}`, err.message) }
}