#!/usr/bin/env python3
"""
Firecrawl Basic Scraping Example (Python)

This template demonstrates how to scrape a single webpage using Firecrawl API.

Requirements:
    pip install firecrawl-py python-dotenv

Environment Variables:
    FIRECRAWL_API_KEY - Your Firecrawl API key (get from https://www.firecrawl.dev)

Usage:
    python firecrawl-scrape-python.py
"""

import os
from dotenv import load_dotenv
from firecrawl import FirecrawlApp

# Load environment variables from .env file
load_dotenv()

def scrape_single_page(url: str) -> dict:
    """
    Scrape a single webpage and return markdown content.

    Args:
        url: The URL to scrape

    Returns:
        dict containing scraped data (markdown, html, metadata)
    """
    # Initialize Firecrawl client
    # NEVER hardcode API keys! Always use environment variables
    api_key = os.environ.get("FIRECRAWL_API_KEY")
    if not api_key:
        raise ValueError("FIRECRAWL_API_KEY environment variable not set")

    app = FirecrawlApp(api_key=api_key)

    try:
        # Scrape the URL
        result = app.scrape_url(
            url=url,
            params={
                # Output formats - can include multiple
                "formats": ["markdown", "html"],

                # Only extract main content (removes nav, footer, ads)
                # This saves credits and improves content quality
                "onlyMainContent": True,

                # Wait time before scraping (ms) - useful for dynamic content
                # "waitFor": 3000,

                # Remove base64 images to reduce response size
                # "removeBase64Images": True,

                # Include screenshot
                # "formats": ["markdown", "screenshot"],
            }
        )

        return result

    except Exception as e:
        print(f"Error scraping {url}: {e}")
        raise


def main():
    """Main function demonstrating basic scraping."""

    # Example URL to scrape
    url = "https://docs.firecrawl.dev"

    print(f"Scraping: {url}")

    # Scrape the page
    result = scrape_single_page(url)

    # Access different parts of the result
    markdown = result.get("markdown", "")
    html = result.get("html", "")
    metadata = result.get("metadata", {})

    # Print results
    print("\n" + "=" * 80)
    print("MARKDOWN CONTENT:")
    print("=" * 80)
    print(markdown[:500])  # First 500 characters
    print("...")

    print("\n" + "=" * 80)
    print("METADATA:")
    print("=" * 80)
    print(f"Title: {metadata.get('title', 'N/A')}")
    print(f"Description: {metadata.get('description', 'N/A')}")
    print(f"Language: {metadata.get('language', 'N/A')}")
    print(f"Source URL: {metadata.get('sourceURL', 'N/A')}")

    # Save to file (optional)
    output_file = "scraped_content.md"
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(markdown)
    print(f"\n✅ Full content saved to: {output_file}")


if __name__ == "__main__":
    main()
