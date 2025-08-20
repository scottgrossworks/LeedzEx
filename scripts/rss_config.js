const fs = require('fs');
const path = require('path');

function validateConfig(cfg) {
  if (!cfg.server) throw new Error('Missing server configuration');
  if (!cfg.server.port || typeof cfg.server.port !== 'number') 
    throw new Error('Invalid or missing server.port');
  if (!cfg.server.logFile || typeof cfg.server.logFile !== 'string') 
    throw new Error('Invalid or missing server.logFile');
  if (!cfg.server.outputDir || typeof cfg.server.outputDir !== 'string') 
    throw new Error('Invalid or missing server.outputDir');

  if (!cfg.processing) throw new Error('Missing processing configuration');
  if (!cfg.processing.checkInterval || typeof cfg.processing.checkInterval !== 'string') 
    throw new Error('Invalid or missing processing.checkInterval');
  if (!cfg.processing.maxItemsPerFeed || typeof cfg.processing.maxItemsPerFeed !== 'number') 
    throw new Error('Invalid or missing processing.maxItemsPerFeed');
  if (cfg.processing.relevanceThreshold === undefined || typeof cfg.processing.relevanceThreshold !== 'number') 
    throw new Error('Invalid or missing processing.relevanceThreshold');
  if (cfg.processing.matchThreshold === undefined || typeof cfg.processing.matchThreshold !== 'number' || 
      cfg.processing.matchThreshold < 0 || cfg.processing.matchThreshold > 1) 
    throw new Error('Invalid or missing processing.matchThreshold (must be between 0 and 1)');
  if (!cfg.processing.matchExpirationDays || typeof cfg.processing.matchExpirationDays !== 'number' || 
      cfg.processing.matchExpirationDays <= 0) 
    throw new Error('Invalid or missing processing.matchExpirationDays (must be positive)');

  if (!cfg.embedding) throw new Error('Missing embedding configuration');
  if (!cfg.embedding.endpoint || typeof cfg.embedding.endpoint !== 'string') 
    throw new Error('Invalid or missing embedding.endpoint');
  if (cfg.embedding.devMode === undefined) 
    throw new Error('Missing embedding.devMode flag');

  if (!cfg.keywords || !Array.isArray(cfg.keywords.global) || cfg.keywords.global.length === 0) 
    throw new Error('Invalid or missing keywords.global (must be a non-empty array)');

  if (!cfg.feeds || !Array.isArray(cfg.feeds) || cfg.feeds.length === 0) 
    throw new Error('Invalid or missing feeds (must be a non-empty array)');

  cfg.feeds.forEach((feed, index) => {
    if (!feed.url || typeof feed.url !== 'string') 
      throw new Error(`Invalid or missing url for feed at index ${index}`);
    if (!feed.name || typeof feed.name !== 'string') 
      throw new Error(`Invalid or missing name for feed at index ${index}`);
  });
}

let config;
(() => {
  const configPath = path.resolve(__dirname, './rss_config.json');
  const configData = fs.readFileSync(configPath, 'utf8');
  config = JSON.parse(configData);
  validateConfig(config);
})();

const port = config.server.port;
const logFile = path.resolve(__dirname, config.server.logFile);

const CONFIG = {
  checkInterval: config.processing.checkInterval,
  embeddingEndpoint: config.embedding.endpoint,
  outputDir: path.resolve(__dirname, config.server.outputDir),
  maxItemsPerFeed: config.processing.maxItemsPerFeed,
  relevanceThreshold: config.processing.relevanceThreshold,
  matchThreshold: config.processing.matchThreshold,
  matchExpirationDays: config.processing.matchExpirationDays,
  globalKeywords: config.keywords.global,
  devMode: config.embedding.devMode
};

const feeds = config.feeds;

// Setup directories
const RSS_OUTPUT_BASE = config.server.outputDir;
const RSS_PASS_DIR = config.server.passDir;
const RSS_FAIL_DIR = config.server.failDir;

if (!(RSS_OUTPUT_BASE && RSS_FAIL_DIR && RSS_PASS_DIR)) {
  throw new Error('Cannot find BASE/PASS/FAIL directories in rss_config.json');
}

// Ensure training data directories exist
if (!fs.existsSync(RSS_FAIL_DIR)) {
  fs.mkdirSync(RSS_FAIL_DIR, { recursive: true });
}

if (!fs.existsSync(RSS_PASS_DIR)) {
  fs.mkdirSync(RSS_PASS_DIR, { recursive: true });
}


// Ensure log dirs exists
const baseDir = path.dirname(RSS_OUTPUT_BASE);
if (!fs.existsSync(baseDir)) {
  fs.mkdirSync(baseDir, { recursive: true });
}

const logDir = path.dirname(logFile);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Logging function
function log(message) {
  const entry = `${message}\n`;
  try {
    fs.appendFileSync(logFile, entry);
  } catch (e) {
    console.error(`Failed to write to log: ${e.message}`);
  }
  console.log(message);
}

module.exports = { 
  port, 
  logFile, 
  CONFIG, 
  feeds,
  RSS_OUTPUT_BASE,
  RSS_PASS_DIR,
  RSS_FAIL_DIR,
  log
};
