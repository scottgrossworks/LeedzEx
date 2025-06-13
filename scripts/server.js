// scripts/server.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();
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

app.post("/marks", async (req, res) => {
  const data = req.body;
  if (!data.email) return res.status(400).json({ error: "Missing email" });

  try {
    const existing = await prisma.mark.findFirst({ where: { email: data.email } });
    const result = existing
      ? await prisma.mark.update({ where: { email: data.email }, data })
      : await prisma.mark.create({ data });
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

app.delete("/marks/:id", async (req, res) => {
  const id = req.params.id;
  try {
    await prisma.mark.delete({ where: { id } });
    res.json({ success: true });
  } catch (e) {
    log("DELETE /marks failed: " + e.stack);
    res.status(500).json({ error: "Delete failed" });
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
