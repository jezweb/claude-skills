/**
 * Firecrawl Basic Scraping Example (TypeScript)
 *
 * This template demonstrates how to scrape a single webpage using Firecrawl API.
 *
 * Requirements:
 *   npm install firecrawl-js
 *   npm install -D @types/node
 *
 * Environment Variables:
 *   FIRECRAWL_API_KEY - Your Firecrawl API key (get from https://www.firecrawl.dev)
 *
 * Usage:
 *   npx tsx firecrawl-scrape-typescript.ts
 *   # or compile first:
 *   tsc firecrawl-scrape-typescript.ts && node firecrawl-scrape-typescript.js
 */

import FirecrawlApp from 'firecrawl-js';
import fs from 'fs/promises';

/**
 * Scrape a single webpage and return markdown content
 */
async function scrapeSinglePage(url: string): Promise<{
  markdown: string;
  html: string;
  metadata: Record<string, any>;
}> {
  // Initialize Firecrawl client
  // NEVER hardcode API keys! Always use environment variables
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error('FIRECRAWL_API_KEY environment variable not set');
  }

  const app = new FirecrawlApp({ apiKey });

  try {
    // Scrape the URL
    const result = await app.scrapeUrl(url, {
      // Output formats - can include multiple
      formats: ['markdown', 'html'],

      // Only extract main content (removes nav, footer, ads)
      // This saves credits and improves content quality
      onlyMainContent: true,

      // Wait time before scraping (ms) - useful for dynamic content
      // waitFor: 3000,

      // Remove base64 images to reduce response size
      // removeBase64Images: true,

      // Include screenshot
      // formats: ['markdown', 'screenshot'],
    });

    return result;
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    throw error;
  }
}

/**
 * Main function demonstrating basic scraping
 */
async function main() {
  // Example URL to scrape
  const url = 'https://docs.firecrawl.dev';

  console.log(`Scraping: ${url}`);

  // Scrape the page
  const result = await scrapeSinglePage(url);

  // Access different parts of the result
  const { markdown, html, metadata } = result;

  // Print results
  console.log('\n' + '='.repeat(80));
  console.log('MARKDOWN CONTENT:');
  console.log('='.repeat(80));
  console.log(markdown.substring(0, 500)); // First 500 characters
  console.log('...');

  console.log('\n' + '='.repeat(80));
  console.log('METADATA:');
  console.log('='.repeat(80));
  console.log(`Title: ${metadata.title || 'N/A'}`);
  console.log(`Description: ${metadata.description || 'N/A'}`);
  console.log(`Language: ${metadata.language || 'N/A'}`);
  console.log(`Source URL: ${metadata.sourceURL || 'N/A'}`);

  // Save to file (optional)
  const outputFile = 'scraped_content.md';
  await fs.writeFile(outputFile, markdown, 'utf-8');
  console.log(`\n✅ Full content saved to: ${outputFile}`);
}

// Run main function
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
