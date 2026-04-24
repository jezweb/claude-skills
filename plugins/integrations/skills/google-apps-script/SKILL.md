---
name: google-apps-script
description: "Build Google Apps Script automation for Sheets and Workspace apps. Produces scripts with custom menus, triggers, dialogs, email automation, PDF export, and external API integration."
compatibility: Designed for Claude Code (or similar products)
---

# Google Apps Script

Build automation scripts for Google Sheets and Workspace apps. Scripts run server-side on Google's infrastructure with a generous free tier.

## What You Produce

- Apps Script code pasted into Extensions > Apps Script
- Custom menus, dialogs, sidebars
- Automated triggers (on edit, time-driven, form submit)
- Email notifications, PDF exports, API integrations

## Workflow

### Step 1: Understand the Automation

Ask what the user wants automated. Common scenarios:
- Custom menu with actions (report generation, data processing)
- Auto-triggered behaviour (on edit, on form submit, scheduled)
- Sidebar app for data entry
- Email notifications from sheet data
- PDF export and distribution

### Step 2: Generate the Script

Follow the structure template below. Every script needs a header comment, configuration constants at top, and `onOpen()` for menu setup.

### Step 3: Provide Installation Instructions

All scripts install the same way:
1. Open the Google Sheet
2. **Extensions > Apps Script**
3. Delete any existing code in the editor
4. Paste the script
5. Click **Save**
6. Close the Apps Script tab
7. **Reload the spreadsheet** (onOpen runs on page load)

### Step 4: First-Time Authorisation

Each user gets a Google OAuth consent screen on first run. For unverified scripts (most internal scripts), users must click:

**Advanced > Go to [Project Name] (unsafe) > Allow**

This is a one-time step per user. Warn users about this in your output.

---

## Script Structure Template

Every script should follow this pattern:

```javascript
/**
 * [Project Name] - [Brief Description]
 *
 * [What it does, key features]
 *
 * INSTALL: Extensions > Apps Script > paste this > Save > Reload sheet
 */

// --- CONFIGURATION ---
const SOME_SETTING = 'value';

// --- MENU SETUP ---
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('My Menu')
    .addItem('Do Something', 'myFunction')
    .addSeparator()
    .addSubMenu(ui.createMenu('More Options')
      .addItem('Option A', 'optionA'))
    .addToUi();
}

// --- FUNCTIONS ---
function myFunction() {
  // Implementation
}
```

---

## Critical Rules

### Public vs Private Functions

Functions ending with `_` (underscore) are **private** and CANNOT be called from client-side HTML via `google.script.run`. This is a silent failure -- the call simply doesn't work with no error.

```javascript
// WRONG - dialog can't call this, fails silently
function doWork_() { return 'done'; }

// RIGHT - dialog can call this
function doWork() { return 'done'; }
```

**Also applies to**: Menu item function references must be public function names as strings.

### Batch Operations (Critical for Performance)

Read/write data in bulk, never cell-by-cell. The difference is 70x.

```javascript
// SLOW (70 seconds on 100x100) - reads one cell at a time
for (let i = 1; i <= 100; i++) {
  const val = sheet.getRange(i, 1).getValue();
}

// FAST (1 second) - reads all at once
const allData = sheet.getRange(1, 1, 100, 1).getValues();
for (const row of allData) {
  const val = row[0];
}
```

Always use `getRange().getValues()` / `setValues()` for bulk reads/writes.

### V8 Runtime

V8 is the **only** runtime (Rhino was removed January 2026). Supports modern JavaScript: `const`, `let`, arrow functions, template literals, destructuring, classes, async/generators.

**NOT available** (use Apps Script alternatives):

| Missing API | Apps Script Alternative |
|-------------|------------------------|
| `setTimeout` / `setInterval` | `Utilities.sleep(ms)` (blocking) |
| `fetch` | `UrlFetchApp.fetch()` |
| `FormData` | Build payload manually |
| `URL` | String manipulation |
| `crypto` | `Utilities.computeDigest()` / `Utilities.getUuid()` |

### Flush Before Returning

Call `SpreadsheetApp.flush()` before returning from functions that modify the sheet, especially when called from HTML dialogs. Without it, changes may not be visible when the dialog shows "Done."

### Simple vs Installable Triggers

| Feature | Simple (`onEdit`) | Installable |
|---------|-------------------|-------------|
| Auth required | No | Yes |
| Send email | No | Yes |
| Access other files | No | Yes |
| URL fetch | No | Yes |
| Open dialogs | No | Yes |
| Runs as | Active user | Trigger creator |

Use simple triggers for lightweight reactions. Use installable triggers (via `ScriptApp.newTrigger()`) when you need email, external APIs, or cross-file access.

### Custom Spreadsheet Functions

Functions used as `=MY_FUNCTION()` in cells have strict limitations:

```javascript
/**
 * Calculates something custom.
 * @param {string} input The input value
 * @return {string} The result
 * @customfunction
 */
function MY_FUNCTION(input) {
  // Can use: basic JS, Utilities, CacheService
  // CANNOT use: MailApp, UrlFetchApp, SpreadsheetApp.getUi(), triggers
  return input.toUpperCase();
}
```

- Must include `@customfunction` JSDoc tag
- 30-second execution limit (vs 6 minutes for regular functions)
- Cannot access services requiring authorisation

---

## Quotas and Limits

| Resource | Free Account | Google Workspace |
|----------|-------------|-----------------|
| Script runtime | 6 min / execution | 6 min / execution |
| Time-driven trigger runtime | 30 min | 30 min |
| Triggers total daily runtime | 90 min | 6 hours |
| Triggers total | 20 per user per script | 20 per user per script |
| Email recipients/day | 100 | 1,500 |
| URL Fetch calls/day | 20,000 | 100,000 |
| Properties storage | 500 KB | 500 KB |
| Custom function runtime | 30 seconds | 30 seconds |
| Simultaneous executions | 30 | 30 |

---

## Modal Progress Dialog

Block user interaction during long operations with a spinner that auto-closes. Use for any operation taking more than a few seconds.

**Pattern: menu function > showProgress() > dialog calls action function > auto-close**

```javascript
function showProgress(message, serverFn) {
  const html = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: 'Google Sans', Arial, sans-serif; display: flex;
        flex-direction: column; align-items: center; justify-content: center;
        height: 100%; margin: 0; padding: 20px; box-sizing: border-box; }
      .spinner { width: 36px; height: 36px; border: 4px solid #e0e0e0;
        border-top: 4px solid #1a73e8; border-radius: 50%;
        animation: spin 0.8s linear infinite; margin-bottom: 16px; }
      @keyframes spin { to { transform: rotate(360deg); } }
      .message { font-size: 14px; color: #333; text-align: center; }
      .done { color: #1e8e3e; font-weight: 500; }
      .error { color: #d93025; font-weight: 500; }
    </style>
    <div class="spinner" id="spinner"></div>
    <div class="message" id="msg">${message}</div>
    <script>
      google.script.run
        .withSuccessHandler(function(r) {
          document.getElementById('spinner').style.display = 'none';
          var m = document.getElementById('msg');
          m.className = 'message done';
          m.innerText = 'Done! ' + (r || '');
          setTimeout(function() { google.script.host.close(); }, 1200);
        })
        .withFailureHandler(function(err) {
          document.getElementById('spinner').style.display = 'none';
          var m = document.getElementById('msg');
          m.className = 'message error';
          m.innerText = 'Error: ' + err.message;
          setTimeout(function() { google.script.host.close(); }, 3000);
        })
        .${serverFn}();
    </script>
  `).setWidth(320).setHeight(140);
  SpreadsheetApp.getUi().showModalDialog(html, 'Working...');
}

// Menu calls this wrapper
function menuDoWork() {
  showProgress('Processing data...', 'doTheWork');
}

// MUST be public (no underscore) for the dialog to call it
function doTheWork() {
  // ... do the work ...
  SpreadsheetApp.flush();
  return 'Processed 50 rows';  // shown in success message
}
```

---

## Common Patterns

### Toast Notifications

```javascript
SpreadsheetApp.getActiveSpreadsheet().toast('Operation complete!', 'Title', 5);
// Arguments: message, title, duration in seconds (-1 = until dismissed)
```

### Alert and Prompt Dialogs

```javascript
const ui = SpreadsheetApp.getUi();

// Yes/No confirmation
const response = ui.alert('Delete this data?', 'This cannot be undone.',
  ui.ButtonSet.YES_NO);
if (response === ui.Button.YES) { /* proceed */ }

// Prompt for input
const result = ui.prompt('Enter your name:', ui.ButtonSet.OK_CANCEL);
if (result.getSelectedButton() === ui.Button.OK) {
  const name = result.getResponseText();
}
```

### Sidebar Apps

HTML panel on the right. Use `google.script.run` to call server functions.

```javascript
function showSidebar() {
  const html = HtmlService.createHtmlOutput(`
    <h3>Quick Entry</h3>
    <select id="worker"><option>Craig</option><option>Steve</option></select>
    <input id="suburb" placeholder="Suburb">
    <button onclick="submit()">Add Job</button>
    <script>
      function submit() {
        google.script.run.withSuccessHandler(function() { alert('Added!'); })
          .addJob(document.getElementById('worker').value,
                  document.getElementById('suburb').value);
      }
    </script>
  `).setTitle('Job Entry').setWidth(300);
  SpreadsheetApp.getUi().showSidebar(html);
}

function addJob(worker, suburb) { // MUST be public (no underscore)
  SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().appendRow([new Date(), worker, suburb]);
}
```

### Triggers

**onEdit (simple trigger)** -- limited permissions but no auth needed:

```javascript
function onEdit(e) {
  const sheet = e.source.getActiveSheet();
  if (sheet.getName() !== 'Data') return;
  if (e.range.getColumn() !== 3) return;
  // Auto-timestamp when column C is edited
  sheet.getRange(e.range.getRow(), 4).setValue(new Date());
}
```

**Installable triggers** -- create via script, run setup function once manually:

```javascript
function createTriggers() {
  // Time-driven: run every day at 8am
  ScriptApp.newTrigger('dailyReport')
    .timeBased().atHour(8).everyDays(1).create();

  // On edit with full permissions (can send email, fetch URLs)
  ScriptApp.newTrigger('onEditFull')
    .forSpreadsheet(SpreadsheetApp.getActive()).onEdit().create();

  // On form submit
  ScriptApp.newTrigger('onFormSubmit')
    .forSpreadsheet(SpreadsheetApp.getActive()).onFormSubmit().create();
}
```

### Email from Sheets

```javascript
function emailWeeklySchedule() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getRange('A2:E10').getDisplayValues();
  let body = '<h2>Weekly Schedule</h2><table border="1" cellpadding="8">';
  body += '<tr><th>Job</th><th>Suburb</th><th>Time</th><th>Price</th></tr>';
  for (const row of data) {
    if (row[0]) body += '<tr>' + row.map(c => '<td>' + c + '</td>').join('') + '</tr>';
  }
  body += '</table>';
  MailApp.sendEmail({ to: 'worker@example.com',
    subject: 'Schedule - Week ' + sheet.getName(), htmlBody: body });
}
```

### PDF Export

Non-obvious URL construction -- export parameters are undocumented:

```javascript
function exportSheetAsPdf() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const url = ss.getUrl().replace(/\/edit.*$/, '')
    + '/export?exportFormat=pdf&format=pdf&size=A4&portrait=true'
    + '&fitw=true&sheetnames=false&printtitle=false&gridlines=false'
    + '&gid=' + ss.getActiveSheet().getSheetId();
  const blob = UrlFetchApp.fetch(url, {
    headers: { 'Authorization': 'Bearer ' + ScriptApp.getOAuthToken() }
  }).getBlob().setName('report.pdf');
  MailApp.sendEmail({ to: 'boss@example.com', subject: 'Weekly Report PDF',
    body: 'Attached.', attachments: [blob] });
}
```

### External API Calls

```javascript
// GET
function fetchData() {
  const r = UrlFetchApp.fetch('https://api.example.com/data', {
    headers: { 'Authorization': 'Bearer ' + getApiKey() } });
  return JSON.parse(r.getContentText());
}

// POST (muteHttpExceptions to handle errors yourself)
function postData(payload) {
  const r = UrlFetchApp.fetch('https://api.example.com/submit', {
    method: 'post', contentType: 'application/json',
    payload: JSON.stringify(payload), muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) throw new Error('API error: ' + r.getContentText());
  return JSON.parse(r.getContentText());
}
```

### Data Validation Dropdowns

```javascript
// Dropdown from list
const rule = SpreadsheetApp.newDataValidation()
  .requireValueInList(['Option A', 'Option B', 'Option C'], true)
  .setAllowInvalid(false).setHelpText('Select an option').build();
sheet.getRange('C3:C50').setDataValidation(rule);

// Dropdown from range (e.g. a Lookups sheet)
const rule2 = SpreadsheetApp.newDataValidation()
  .requireValueInRange(ss.getSheetByName('Lookups').getRange('A1:A100')).build();
sheet.getRange('B3:B50').setDataValidation(rule2);
```

### Properties Service (Persistent Storage)

Three scopes: `PropertiesService.getScriptProperties()` (shared), `.getUserProperties()` (per user), `.getDocumentProperties()` (per spreadsheet). All use `.setProperty(key, value)` / `.getProperty(key)`. 500 KB limit.

---

## Recipes

### Auto-Archive Completed Rows

Move rows with "Complete" status to an Archive sheet. Processes bottom-up to avoid shifting row indices.

```javascript
function archiveCompleted() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const source = ss.getSheetByName('Active');
  const archive = ss.getSheetByName('Archive');
  const data = source.getDataRange().getValues();
  const statusCol = 4; // column E (0-indexed)

  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][statusCol] === 'Complete') {
      archive.appendRow(data[i]);
      source.deleteRow(i + 1); // +1 for 1-indexed rows
    }
  }
  SpreadsheetApp.flush();
}
```

### Duplicate Detection and Highlighting

Pattern: read column with `getValues()`, track seen values in an object, highlight both the original and duplicate rows with `setBackground('#f4cccc')`. Process all data in one `getValues()` call, then set backgrounds individually (unavoidable for scattered highlights).

### Batch Email Sender

Key pattern: check `MailApp.getRemainingDailyQuota()` before sending, mark status per row, wrap each send in try/catch.

```javascript
function sendBatchEmails() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Recipients');
  const data = sheet.getRange('A2:C' + sheet.getLastRow()).getValues(); // Email, Name, Status
  const remaining = MailApp.getRemainingDailyQuota();
  if (remaining < data.length) {
    SpreadsheetApp.getUi().alert('Only ' + remaining + ' emails left. Need ' + data.length);
    return;
  }
  let sent = 0;
  for (let i = 0; i < data.length; i++) {
    const [email, name, status] = data[i];
    if (!email || status === 'Sent') continue;
    try {
      MailApp.sendEmail({ to: email, subject: 'Your Weekly Update',
        htmlBody: '<p>Hi ' + name + ',</p><p>Here is your update...</p>' });
      sheet.getRange(i + 2, 3).setValue('Sent'); sent++;
    } catch (e) { sheet.getRange(i + 2, 3).setValue('Error: ' + e.message); }
  }
  SpreadsheetApp.flush();
}
```

### Summary Dashboard Generator

Pattern: loop numbered weekly tabs (`01`-`52`), read summary cells from each, write aggregated rows into a Summary sheet. Use `ss.getSheetByName(tabName)` to iterate, `ss.insertSheet('Summary')` if it doesn't exist, `summary.autoResizeColumns()` at end, `flush()` before return.

---

## Error Handling

Always wrap external calls in try/catch. Use `muteHttpExceptions: true` to handle HTTP errors yourself. Re-throw for dialog error handlers.

```javascript
function fetchExternalData() {
  try {
    const response = UrlFetchApp.fetch('https://api.example.com/data', {
      headers: { 'Authorization': 'Bearer ' + getApiKey() },
      muteHttpExceptions: true
    });
    if (response.getResponseCode() !== 200)
      throw new Error('API returned ' + response.getResponseCode());
    return JSON.parse(response.getContentText());
  } catch (e) { Logger.log('Error: ' + e.message); throw e; }
}
```

---

## Error Prevention

| Mistake | Fix |
|---------|-----|
| Dialog can't call function | Remove trailing `_` from function name |
| Script is slow on large data | Use `getValues()`/`setValues()` batch operations |
| Changes not visible after dialog | Add `SpreadsheetApp.flush()` before return |
| `onEdit` can't send email | Use installable trigger via `ScriptApp.newTrigger()` |
| Custom function times out | 30s limit -- simplify or move to regular function |
| `setTimeout` not found | Use `Utilities.sleep(ms)` (blocking) |
| Script exceeds 6 min | Break into chunks, use time-driven trigger for batches |
| Auth popup doesn't appear | User must click Advanced > Go to (unsafe) > Allow |

## Debugging

- **Logger.log()** / **console.log()** -- View > Execution Log in Apps Script editor
- **Run manually** -- select function in editor dropdown > Run
- **Executions tab** -- shows all recent runs with errors and stack traces
- **Trigger failures** -- script.google.com > My Projects > Executions
- **Always test on a copy** of the sheet before deploying

## Deployment Checklist

- [ ] All functions called from HTML dialogs are public (no trailing underscore)
- [ ] `SpreadsheetApp.flush()` called before returning from modifying functions
- [ ] Error handling (try/catch) around external API calls and MailApp
- [ ] Configuration constants at the top of the file
- [ ] Header comment with install instructions
- [ ] Tested on a copy of the sheet
- [ ] Considered multi-user behaviour (different permissions, different active sheet)
- [ ] Long operations use modal progress dialogs
- [ ] No hardcoded sheet names -- use configuration constants
- [ ] Checked email quota before batch sends

---

## Optional Patterns (not inlined)

Omitted to keep this file focused. Reconstruct from Apps Script docs if needed:

- **Row/Column show/hide** -- `sheet.hideRows()`, `showRows()`, `isRowHiddenByUser()`
- **Formatting** -- `setBackground()`, `setFontWeight()`, `setBorder()`, `setNumberFormat()`, conditional formatting
- **Data protection** -- `range.protect()`, `setUnprotectedRanges()`, editor management
- **Multiple sheets** -- `getSheetByName()`, looping numbered tabs, `copyTo()`, `insertSheet()`
- **Auto-numbering rows** -- `onEdit` trigger to auto-number column A when column B is edited
- **Google Chat webhooks** -- POST to `chat.googleapis.com` with JSON payload
