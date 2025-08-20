/*
// rss_server.js
//
// RSS Feed Monitor for PreCrime System
//
// Fetch and parse RSS feeds
// Filter and format the content
// Send data to an embedding server
// Log findings and output reports for debugging
*/



const express = require('express');
const fs = require('fs');
const path = require('path');
const Parser = require('rss-parser');
const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const axios = require('axios'); // Now needed for embedding API

// Import refactored modules
const { prepRSS, sendForEmbedding, processMatches } = require('./embedding.js');
const { filterAndScoreItems } = require('./keyword_score.js');
const { port, 
  CONFIG, feeds, RSS_OUTPUT_BASE,RSS_PASS_DIR, RSS_FAIL_DIR, log } = require('./rss_config.js');

// Initialize services
const app = express();
const parser = new Parser();
const prisma = new PrismaClient();

console.log('RSS server configuration loaded successfully');

// Express middleware
app.use(express.json());

app.use((req, res, next) => {
  log(`${req.method} ${req.url}`);
  next();
});


/**
 * Fetches and parses an RSS feed from the specified URL
 * @param {Object} feedConfig - Configuration object for the feed
 * @returns {Object|null} - Parsed feed object or null if fetch fails
 */
async function fetchFeed(feedConfig) {
  try {
    // log(`Fetching feed: ${feedConfig.name} (${feedConfig.url})`);
    const feed = await parser.parseURL(feedConfig.url);
    // log(`Successfully fetched ${feed.items.length} items from ${feedConfig.name}`);
    return feed;
  } catch (error) {
    log(`Error fetching feed ${feedConfig.name}: ${error.message}`);
    return null;
  }
}


/**
 * Removes expired matches from the database
 * Should be run periodically to clean up old data
 */
async function cleanupExpiredMatches() {
  try {
    const now = new Date();
    
    const result = await prisma.rssMarkUserRelation.deleteMany({
      where: {
        expiresAt: {
          lt: now
        }
      }
    });
    
    if (result.count > 0) {
      log(`Cleaned up ${result.count} expired matches`);
    }
  } catch (error) {
    log(`Error cleaning up expired matches: ${error.message}`);
  }
}






/**
 * Main function that processes all configured RSS feeds
 * Fetches, filters, scores, and prepares items for embedding
 * 
 * @returns {void}
 */
async function processFeeds() {
  // log('Starting RSS feed processing cycle');
  
  const summaryReport = {
    timestamp: new Date().toISOString(),
    feedsProcessed: 0,
    itemsFound: 0,
    itemsSelected: 0,
    passSaved: 0,
    failSaved: 0,
    feedDetails: []
  };
  
  for (const feedConfig of feeds) {
    try {
      log(`Processing feed: ${feedConfig.name}`);
      
      // Fetch the feed
      const feed = await fetchFeed(feedConfig);
      if (!feed) {
        log(`Failed to fetch feed: ${feedConfig.name}`);
        continue;
      }
      
      summaryReport.feedsProcessed++;
      summaryReport.itemsFound += feed.items.length;
      
      const feedSummary = {
        name: feedConfig.name,
        url: feedConfig.url,
        itemsFound: feed.items.length,
        itemsSelected: 0,
        passSaved: 0,
        failSaved: 0
      };
      
      // Filter and score items
      const scoredItems = filterAndScoreItems(feed.items, feedConfig, CONFIG);
      
      // Partition by threshold
      const relevantItems = scoredItems.filter(item => 
        item.relevanceScore >= CONFIG.relevanceThreshold
      );
      const rejectedItems = scoredItems.filter(item => 
        item.relevanceScore < CONFIG.relevanceThreshold
      );
      
      // Save ALL items to training data (pass/fail) - prep once per item
      for (const item of relevantItems) {
        const prepared = prepRSS(item);
        saveTrainingItem(prepared, true);
        feedSummary.passSaved++;
        summaryReport.passSaved++;
      }
      for (const item of rejectedItems) {
        const prepared = prepRSS(item);
        saveTrainingItem(prepared, false);
        feedSummary.failSaved++;
        summaryReport.failSaved++;
      }

      // Log rejected items for debugging
      rejectedItems.forEach(item => {
        log(`REJECTED: "${item.title}" (Score: ${item.relevanceScore}, Threshold: ${CONFIG.relevanceThreshold})`);
      });

      // Still apply a maximum limit for embedding calls
      const topItems = relevantItems.slice(0, CONFIG.maxItemsPerFeed);

      summaryReport.itemsSelected += topItems.length;
      feedSummary.itemsSelected = topItems.length;
      
      // Log feed processing summary
      log(`Feed "${feedConfig.name}": ${feed.items.length} total, ` +
          `${relevantItems.length} passed threshold, ${rejectedItems.length} rejected, ` +
          `${topItems.length} selected for embedding, saved ${feedSummary.passSaved} pass / ${feedSummary.failSaved} fail for training`);
      
      // Process each selected item (embedding) - pass the already prepped item
      for (const item of topItems) {
        log(`Processing item: ${item.title} (Score: ${item.relevanceScore})`);
        const prepared = prepRSS(item);
        await sendForEmbedding(prepared, CONFIG, log, processMatches);
      }
      
      summaryReport.feedDetails.push(feedSummary);
    } catch (error) {
      log(`Error processing feed ${feedConfig.name}: ${error.message}`);
    }
  }
  
  // Write summary report to /output/rss
  const reportFile = path.join(RSS_OUTPUT_BASE, `report_${Date.now()}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(summaryReport, null, 2));
  
  log(`Completed RSS processing cycle. Processed ${summaryReport.feedsProcessed} feeds, ` +
      `found ${summaryReport.itemsFound} items, selected ${summaryReport.itemsSelected} for embedding. ` +
      `Saved ${summaryReport.passSaved} pass / ${summaryReport.failSaved} fail for training.`);
}



// Helper for training data files
function sanitizeForFilename(s) {
  return String(s).replace(/[^a-z0-9]/gi, '_');
}



function saveTrainingItem(preparedItem, passed) {
  try {
    const dir = passed ? RSS_PASS_DIR : RSS_FAIL_DIR;
    const filename = `${Date.now()}_${sanitizeForFilename(preparedItem.id)}.json`;
    const outputFile = path.join(dir, filename);
    fs.writeFileSync(outputFile, JSON.stringify(preparedItem, null, 2));
    return outputFile;
  } catch (e) {
    log(`Failed to save training item: ${e.message}`);
    return null;
  }
}







//
//
// API ENDPOINTS
//
//

/**
 * API endpoint to get all configured RSS feeds
 * Returns the complete list of feeds being monitored
 * 
// Get all configured feeds
 */
app.get('/feeds', (req, res) => {
  res.json(feeds);
});

/**
 * API endpoint to manually trigger feed processing
 * Initiates an immediate feed fetch and processing cycle
 */
app.post('/process', async (req, res) => {
  try {
    log('Manual feed processing triggered');
    await processFeeds();
    res.json({ success: true, message: 'Feed processing completed' });
  } catch (error) {
    log(`Error in manual processing: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add a new feed
app.post('/feeds', express.json(), (req, res) => {
  const { url, name, category, keywords } = req.body;
  
  if (!url || !name) {
    return res.status(400).json({ error: 'URL and name are required' });
  }
  
  const newFeed = {
    url,
    name,
    category: category || 'general',
    keywords: keywords || []
  };
  
  feeds.push(newFeed);
  log(`Added new feed: ${name} (${url})`);
  res.status(201).json(newFeed);
});

// Start the server and scheduled tasks
(async () => {
  try {
    await prisma.$connect();
    
    // Schedule the feed processing task
    cron.schedule(CONFIG.checkInterval, () => {
      processFeeds().catch(err => {
        log(`Scheduled processing error: ${err.message}`);
      });
    });
    
    // Schedule cleanup of expired matches (run daily at midnight)
    cron.schedule('0 0 * * *', () => {
      cleanupExpiredMatches().catch(err => {
        log(`Scheduled cleanup error: ${err.message}`);
      });
    });
    
    // Initial processing on startup
    await processFeeds();
    
    // Start the server
    app.listen(port, () => {
      log(`RSS Server running on http://localhost:${port}`);
    });
  } catch (err) {
    log(`Failed to start RSS server: ${err.stack}`);
    process.exit(1);
  }
})();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  log('RSS Server shutting down');
  await prisma.$disconnect();
  process.exit(0);
});