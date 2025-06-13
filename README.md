# LeedzEx

LeedzEx is a Chrome extension and local server system for extracting, enriching, and storing contact information from websites like LinkedIn. It supports job outreach and lead generation by turning passive browsing into structured, actionable data.

## Project Goal

Enable users to:
- Open a sidebar while browsing professional profiles
- Highlight and assign data such as name, email, phone
- Save that information to a local database for follow-up
- Build a high-quality, self-managed contact pipeline for outreach

This is part of a broader system aimed at identifying hiring intent before jobs are posted.

## Directory Structure

This is a unified project containing both frontend (extension) and backend (Node server):

LOCAL/
├── ext/ # Chrome extension source files
│ ├── css/
│ ├── icons/
│ ├── js/
│ ├── manifest.json
│ └── sidebar.html
├── scripts/ # Local Express server and data handling logic
│ ├── server.js # Main entry point for the API
│ ├── query.js # Support scripts for DB ops
│ └── server.log # Logs for incoming API calls
├── prisma/ # Prisma schema and migrations
├── node_modules/
├── package.json
└── .gitignore


## How It Works

1. User visits a page like a LinkedIn profile
2. User clicks the LeedzEx extension icon
3. The sidebar UI opens, showing fields like name, email, etc.
4. The user can highlight and assign data from the page
5. Clicking "Save" sends the contact to the local API at `http://localhost:3000/marks`
6. The API inserts or updates the contact in a SQLite database using Prisma

## Getting Started

1. Start the local backend:



2. Load the Chrome extension:
- Go to `chrome://extensions/`
- Enable "Developer mode"
- Click "Load unpacked"
- Select the `ext/` directory

3. Open a target webpage (e.g. LinkedIn)
4. Click the extension icon to launch the sidebar
5. Enter or assign data, then click Save

## Stack

- Chrome Extension (Manifest V3)
- HTML/CSS/JavaScript UI
- Express server (Node.js)
- Prisma ORM with SQLite

## Status

This repo reflects the current working directory 
and is now the canonical version for both frontend and backend. 
Remaining work includes improving content script logic, 
highlight-to-field automation, and building out the full 
Pre-Crime contact pipeline.


