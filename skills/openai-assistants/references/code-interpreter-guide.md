# Code Interpreter Guide

Complete guide to using Code Interpreter with the Assistants API.

---

## What is Code Interpreter?

A built-in tool that executes Python code in a sandboxed environment, enabling:
- Data analysis and processing
- Mathematical computations
- Chart and graph generation
- File parsing (CSV, JSON, Excel, etc.)
- Data transformations

---

## Setup

```typescript
const assistant = await openai.beta.assistants.create({
  name: "Data Analyst",
  instructions: "You analyze data and create visualizations.",
  tools: [{ type: "code_interpreter" }],
  model: "gpt-4o",
});
```

---

## File Uploads

### Upload Data Files

```typescript
const file = await openai.files.create({
  file: fs.createReadStream("data.csv"),
  purpose: "assistants",
});
```

### Attach to Messages

```typescript
await openai.beta.threads.messages.create(thread.id, {
  role: "user",
  content: "Analyze this sales data",
  attachments: [{
    file_id: file.id,
    tools: [{ type: "code_interpreter" }],
  }],
});
```

---

## Supported File Formats

**Data Files**:
- `.csv`, `.json`, `.xlsx` - Tabular data
- `.txt`, `.md` - Text files
- `.pdf`, `.docx`, `.pptx` - Documents (text extraction)

**Code Files**:
- `.py`, `.js`, `.ts`, `.java`, `.cpp` - Source code

**Images** (for processing, not vision):
- `.png`, `.jpg`, `.jpeg`, `.gif` - Image manipulation

**Archives**:
- `.zip`, `.tar` - Compressed files

**Size Limit**: 512 MB per file

---

## Common Use Cases

### 1. Data Analysis

```typescript
const thread = await openai.beta.threads.create({
  messages: [{
    role: "user",
    content: "Calculate the average, median, and standard deviation of the revenue column",
    attachments: [{
      file_id: csvFileId,
      tools: [{ type: "code_interpreter" }],
    }],
  }],
});
```

### 2. Data Visualization

```typescript
await openai.beta.threads.messages.create(thread.id, {
  role: "user",
  content: "Create a line chart showing revenue over time",
});

// After run completes, download the generated image
const messages = await openai.beta.threads.messages.list(thread.id);
for (const content of messages.data[0].content) {
  if (content.type === 'image_file') {
    const imageData = await openai.files.content(content.image_file.file_id);
    const buffer = Buffer.from(await imageData.arrayBuffer());
    fs.writeFileSync('chart.png', buffer);
  }
}
```

### 3. File Conversion

```typescript
await openai.beta.threads.messages.create(thread.id, {
  role: "user",
  content: "Convert this Excel file to CSV format",
  attachments: [{
    file_id: excelFileId,
    tools: [{ type: "code_interpreter" }],
  }],
});
```

---

## Retrieving Outputs

### Text Output

```typescript
const messages = await openai.beta.threads.messages.list(thread.id);
const response = messages.data[0];

for (const content of response.content) {
  if (content.type === 'text') {
    console.log(content.text.value);
  }
}
```

### Generated Files (Charts, CSVs)

```typescript
for (const content of response.content) {
  if (content.type === 'image_file') {
    const fileId = content.image_file.file_id;
    const data = await openai.files.content(fileId);
    const buffer = Buffer.from(await data.arrayBuffer());
    fs.writeFileSync(`output_${fileId}.png`, buffer);
  }
}
```

### Execution Logs

```typescript
const runSteps = await openai.beta.threads.runs.steps.list(thread.id, run.id);

for (const step of runSteps.data) {
  if (step.step_details.type === 'tool_calls') {
    for (const toolCall of step.step_details.tool_calls) {
      if (toolCall.type === 'code_interpreter') {
        console.log('Code:', toolCall.code_interpreter.input);
        console.log('Output:', toolCall.code_interpreter.outputs);
      }
    }
  }
}
```

---

## Python Environment

### Available Libraries

The Code Interpreter sandbox includes common libraries:
- **Data**: pandas, numpy
- **Math**: scipy, sympy
- **Plotting**: matplotlib, seaborn
- **ML**: scikit-learn (limited)
- **Utils**: requests, PIL, csv, json

**Note**: Not all PyPI packages available. Use standard library where possible.

### Environment Limits

- **Execution Time**: Part of 10-minute run limit
- **Memory**: Limited (exact amount not documented)
- **Disk Space**: Files persist during run only
- **Network**: No outbound internet access

---

## Best Practices

### 1. Clear Instructions

```typescript
// ❌ Vague
"Analyze the data"

// ✅ Specific
"Calculate the mean, median, and mode for each numeric column. Create a bar chart comparing these metrics."
```

### 2. File Download Immediately

```typescript
// Generated files are temporary - download right after completion
if (run.status === 'completed') {
  const messages = await openai.beta.threads.messages.list(thread.id);
  // Download all image files immediately
  for (const message of messages.data) {
    for (const content of message.content) {
      if (content.type === 'image_file') {
        await downloadFile(content.image_file.file_id);
      }
    }
  }
}
```

### 3. Error Handling

```typescript
const runSteps = await openai.beta.threads.runs.steps.list(thread.id, run.id);

for (const step of runSteps.data) {
  if (step.step_details.type === 'tool_calls') {
    for (const toolCall of step.step_details.tool_calls) {
      if (toolCall.type === 'code_interpreter') {
        const outputs = toolCall.code_interpreter.outputs;
        for (const output of outputs) {
          if (output.type === 'logs' && output.logs.includes('Error')) {
            console.error('Execution error:', output.logs);
          }
        }
      }
    }
  }
}
```

---

## Common Patterns

### Pattern: Iterative Analysis

```typescript
// 1. Upload data
const file = await openai.files.create({...});

// 2. Initial analysis
await sendMessage("What are the columns and data types?");

// 3. Follow-up based on results
await sendMessage("Show the distribution of the 'category' column");

// 4. Visualization
await sendMessage("Create a heatmap of correlations between numeric columns");
```

### Pattern: Multi-File Processing

```typescript
await openai.beta.threads.messages.create(thread.id, {
  role: "user",
  content: "Merge these two CSV files on the 'id' column",
  attachments: [
    { file_id: file1Id, tools: [{ type: "code_interpreter" }] },
    { file_id: file2Id, tools: [{ type: "code_interpreter" }] },
  ],
});
```

---

## Troubleshooting

### Issue: Code Execution Fails

**Symptoms**: Run completes but no output/error in logs

**Solutions**:
- Check file format compatibility
- Verify file isn't corrupted
- Ensure data is in expected format (headers, encoding)
- Try simpler request first to verify setup

### Issue: Generated Files Not Found

**Symptoms**: `image_file.file_id` doesn't exist

**Solutions**:
- Download immediately after run completes
- Check run steps for actual outputs
- Verify code execution succeeded

### Issue: Timeout on Large Files

**Symptoms**: Run exceeds 10-minute limit

**Solutions**:
- Split large files into smaller chunks
- Request specific analysis (not "analyze everything")
- Use sampling for exploratory analysis

---

## Example Prompts

**Data Exploration**:
- "Summarize this dataset: shape, columns, data types, missing values"
- "Show the first 10 rows"
- "What are the unique values in the 'status' column?"

**Statistical Analysis**:
- "Calculate descriptive statistics for all numeric columns"
- "Perform correlation analysis between price and quantity"
- "Detect outliers using the IQR method"

**Visualization**:
- "Create a histogram of the 'age' distribution"
- "Plot revenue trends over time with a moving average"
- "Generate a scatter plot of height vs weight, colored by gender"

**Data Transformation**:
- "Remove rows with missing values"
- "Normalize the 'sales' column to 0-1 range"
- "Convert dates to YYYY-MM-DD format"

---

**Last Updated**: 2025-10-25
