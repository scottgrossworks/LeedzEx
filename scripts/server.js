// scripts/server.js
//
//
/*
*
# Get all marks
curl "http://localhost:3000/marks"

# Filter by name
curl "http://localhost:3000/marks?name=john%23doe"

# Filter by email
curl "http://localhost:3000/marks?email=john@example.com"

# Filter by linkedin
curl "http://localhost:3000/marks?linkedin=https://linkedin.com/in/johndoe"

# Get list of all emails
curl "http://localhost:3000/list?field=email"

# Get list of all names
curl "http://localhost:3000/list?field=name"

# Get list of all linkedin profiles
curl "http://localhost:3000/list?field=linkedin"
*
*
*/
const express = require("express");
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

// FIXME 
// this should come from config
const port = 3000;

const logFile = path.resolve(__dirname, "server.log");

function log(message) {
  const entry = `[${new Date().toISOString()}] ${message}\n`;
  try {
    fs.appendFileSync(logFile, entry);
  } catch (e) {
    console.error("Failed to write to log:", e.message);
  }
  console.log(message);
}

app.use(express.json());

app.use((req, res, next) => {
  log(`${req.method} ${req.url}`);
  next();
});


/**
 * Generates a unique ID in the format "first6letters#8digitnumber"
 * Takes a name, extracts first 6 alphanumeric chars (or pads with 'x'),
 * and appends a random 8-digit number for uniqueness.
 * @param {string} name - The name to derive the ID prefix from
 * @return {string} The generated custom ID
 */
function generateCustomId(name) {
  // Extract first 6 letters from the name (or fewer if name is shorter)
  // Remove any non-alphanumeric characters first
  const namePrefix = name
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase()
    .substring(0, 6)
    .padEnd(6, 'x'); // Pad with 'x' if name is shorter than 6 chars
    
  // Generate a random 8-digit number
  const randomNum = Math.floor(10000000 + Math.random() * 90000000);
  
  // Combine them with a # separator
  return `${namePrefix}#${randomNum}`;
}




/**
 * Generates a unique ID in the format "first6letters#8digitnumber"
 * Takes a name, extracts first 6 alphanumeric chars (or pads with 'x'),
 * and appends a random 8-digit number for uniqueness.
 * @param {string} name - The name to derive the ID prefix from
 * @return {string} The generated custom ID
 */

app.post("/marks", async (req, res) => {
  const data = req.body;
  
  // Require name field
  if (!data.name || data.name.trim() === '') {
    return res.status(400).json({ error: "Name is required" });
  }
  
  // Normalize name for storage: lowercase, remove extra spaces, replace spaces with #
  // We'll store this format in the existing name field and denormalize when retrieving
  const normalizedName = data.name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
    .replace(/\s/g, '#');  // Replace spaces with #
    
  // Store the normalized name in the name field
  data.name = normalizedName;
  
  // Handle phone as a string, just clean it up
  if (data.phone === '' || data.phone === undefined || data.phone === null) {
    data.phone = null;
  } else {
    // Remove non-numeric characters but keep as string
    data.phone = data.phone.toString().replace(/\D/g, '');
    // If empty after cleaning, set to null
    if (!data.phone) data.phone = null;
  }
  
  try {
    // Check if record exists by normalized name
    const existing = await prisma.mark.findFirst({ 
      where: { name: normalizedName } 
    });
    
    let result;
    if (existing) {
      // Update existing record
      result = await prisma.mark.update({ 
        where: { id: existing.id }, 
        data 
      });
      log(`Updated record with ID: ${existing.id}`);
    } else {
      // Generate custom ID for new record
      const customId = generateCustomId(normalizedName);
      
      // Create new record with custom ID
      result = await prisma.mark.create({ 
        data: {
          ...data,
          id: customId
        }
      });
      log(`Created new record with ID: ${customId}`);
    }
      
    res.json(result);
  } catch (e) {
    log("POST /marks failed: " + e.stack);
    res.status(500).json({ error: "Internal error" });
  }
});





app.get("/marks", async (req, res) => {
  const entries = Object.entries(req.query);
  let where = {};

  if (entries.length > 0) {
    const [key, val] = entries[0];
    if (!["name", "email", "linkedin"].includes(key)) {
      return res.status(400).json({ error: "Only name, email, or linkedin supported" });
    }
    where[key] = val;
  }

  try {
    const results = await prisma.mark.findMany({ where });
    res.json(results);
  } catch (e) {
    log("GET /marks failed: " + e.stack);
    res.status(500).json({ error: "Query failed" });
  }
});





app.delete("/marks/:idOrName", async (req, res) => {
  const idOrName = req.params.idOrName;
  
  try {
    let record;
    
    // Check if the parameter is a number (ID) or string (name)
    const id = parseInt(idOrName, 10);
    
    if (!isNaN(id)) {
      // If it's a valid number, look up by ID
      log(`Looking for record with numeric ID: ${id}`);
      record = await prisma.mark.findUnique({
        where: { id }
      });
    } else {
      // If it's not a number, treat it as a name
      // Normalize the name as we do in other endpoints
      const normalizedName = decodeURIComponent(idOrName)
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/\s/g, '#');
      
      log(`Looking for record with normalized name: "${normalizedName}"`);
      
      // Try to find by normalized name
      record = await prisma.mark.findFirst({
        where: { name: normalizedName }
      });
      
      // Debug: Log all records to see what's in the database
      const allRecords = await prisma.mark.findMany();
      log(`All records in database: ${JSON.stringify(allRecords.map(r => ({id: r.id, name: r.name})))}`);
    }
    
    if (!record) {
      return res.status(404).json({ 
        error: "Record not found", 
        message: `No record found with identifier: ${idOrName}` 
      });
    }
    
    log(`Found record to delete: ${JSON.stringify(record)}`);
    
    // If record exists, delete it by ID
    await prisma.mark.delete({ where: { id: record.id } });
    res.json({ 
      success: true, 
      message: `Successfully deleted record with ID: ${record.id}` 
    });
  } catch (e) {
    log("DELETE /marks failed: " + e.stack);
    res.status(500).json({ error: "Delete failed", message: e.message });
  }
});




app.get("/list", async (req, res) => {
  const field = req.query.field;
  if (!["email", "name", "linkedin"].includes(field)) {
    return res.status(400).send("Field must be 'email', 'name', or 'linkedin'");
  }

  try {
    const results = await prisma.mark.findMany({ select: { [field]: true } });
    const lines = results.map((r) => r[field]).filter(Boolean).join("\n");
    res.type("text/plain").send(lines);
  } catch (e) {
    log("GET /list failed: " + e.stack);
    res.status(500).send("Error");
  }
});

/**
 * Get active RSS matches that exceed the threshold
 * Returns matches with their related RSS items, marks, and scores
 * Can filter by userId, markId, or minimum score
 */
app.get("/matches", async (req, res) => {
  try {
    // Parse query parameters
    const minScore = req.query.minScore ? parseFloat(req.query.minScore) : 0;
    const userId = req.query.userId || undefined;
    const markId = req.query.markId || undefined;
    
    // Build where clause
    const where = {
      expiresAt: { gt: new Date() }, // Only return non-expired matches
    };
    
    // Add optional filters
    if (minScore > 0) {
      where.score = { gte: minScore };
    }
    
    if (userId) {
      where.userId = userId;
    }
    
    if (markId) {
      where.markId = markId;
    }
    
    // Get matches with related data
    const matches = await prisma.rssMarkUserRelation.findMany({
      where,
      include: {
        rssItem: true,
        mark: true,
        user: true
      },
      orderBy: {
        score: 'desc'
      }
    });
    
    log(`Retrieved ${matches.length} active matches`);
    res.json(matches);
  } catch (e) {
    log("GET /matches failed: " + e.stack);
    res.status(500).json({ error: "Query failed" });
  }
});

/**
 * Mark a match as actioned (user has taken action on this match)
 */
app.post("/matches/:id/action", async (req, res) => {
  try {
    const id = req.params.id;
    
    // Update the match
    const match = await prisma.rssMarkUserRelation.update({
      where: { id },
      data: { actioned: true },
      include: {
        rssItem: true,
        mark: true,
        user: true
      }
    });
    
    log(`Marked match ${id} as actioned`);
    res.json(match);
  } catch (e) {
    log("POST /matches/:id/action failed: " + e.stack);
    res.status(500).json({ error: "Update failed" });
  }
});

/**
 * Get match statistics
 * Returns counts of total matches, actioned matches, and expired matches
 */
app.get("/matches/stats", async (req, res) => {
  try {
    const now = new Date();
    
    // Get total matches
    const totalMatches = await prisma.rssMarkUserRelation.count();
    
    // Get active (non-expired) matches
    const activeMatches = await prisma.rssMarkUserRelation.count({
      where: {
        expiresAt: { gt: now }
      }
    });
    
    // Get actioned matches
    const actionedMatches = await prisma.rssMarkUserRelation.count({
      where: {
        actioned: true
      }
    });
    
    // Get expired matches
    const expiredMatches = await prisma.rssMarkUserRelation.count({
      where: {
        expiresAt: { lte: now }
      }
    });
    
    res.json({
      total: totalMatches,
      active: activeMatches,
      actioned: actionedMatches,
      expired: expiredMatches
    });
  } catch (e) {
    log("GET /matches/stats failed: " + e.stack);
    res.status(500).json({ error: "Query failed" });
  }
});

(async () => {
  try {
    await prisma.$connect();
    const server = app.listen(port, () => {
      log(`! Local API running on http://localhost:${port}`);
    });

    server.on("error", (err) => {
      log("* Server listen failed: " + err.stack);
      process.exit(1);
    });
  } catch (err) {
    log("* Failed to start server: " + err.stack);
    process.exit(1);
  }
})();

process.on("uncaughtException", (err) => {
  log("* Uncaught Exception: " + err.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  log("* Unhandled Rejection: " + (reason?.stack || reason));
  process.exit(1);
});
