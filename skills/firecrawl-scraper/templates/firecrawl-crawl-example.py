#!/usr/bin/env python3
"""
Firecrawl Full Site Crawling Example (Python)

This template demonstrates how to crawl an entire website and save results.

Requirements:
    pip install firecrawl-py python-dotenv

Environment Variables:
    FIRECRAWL_API_KEY - Your Firecrawl API key (get from https://www.firecrawl.dev)

Usage:
    python firecrawl-crawl-example.py
"""

import os
import json
from pathlib import Path
from dotenv import load_dotenv
from firecrawl import FirecrawlApp

# Load environment variables from .env file
load_dotenv()


def crawl_website(
    url: str,
    limit: int = 100,
    max_depth: int = 3,
    output_dir: str = "crawled_data"
) -> list:
    """
    Crawl an entire website and save results to disk.

    Args:
        url: Starting URL to crawl
        limit: Maximum number of pages to crawl
        max_depth: How many links deep to follow
        output_dir: Directory to save scraped content

    Returns:
        List of crawled page data
    """
    # Initialize Firecrawl client
    api_key = os.environ.get("FIRECRAWL_API_KEY")
    if not api_key:
        raise ValueError("FIRECRAWL_API_KEY environment variable not set")

    app = FirecrawlApp(api_key=api_key)

    print(f"Starting crawl of: {url}")
    print(f"Limit: {limit} pages")
    print(f"Max depth: {max_depth}")

    try:
        # Start the crawl
        # This will poll the API until the crawl is complete
        result = app.crawl_url(
            url=url,
            params={
                # Maximum number of pages to crawl
                "limit": limit,

                # Maximum depth to follow links
                "maxDepth": max_depth,

                # Scrape options for each page
                "scrapeOptions": {
                    "formats": ["markdown"],
                    "onlyMainContent": True,
                    "removeBase64Images": True,
                },

                # Only crawl pages within the same domain
                # "allowedDomains": ["docs.example.com"],

                # Exclude certain paths (e.g., login pages, admin)
                # "excludePaths": ["/admin/*", "/login"],

                # Include certain paths only
                # "includePaths": ["/docs/*"],
            },
            poll_interval=5  # Check crawl status every 5 seconds
        )

        # Get crawled pages
        pages = result.get("data", [])
        print(f"\n✅ Crawled {len(pages)} pages successfully")

        # Save results
        save_crawled_data(pages, output_dir)

        return pages

    except Exception as e:
        print(f"Error crawling {url}: {e}")
        raise


def save_crawled_data(pages: list, output_dir: str):
    """
    Save crawled pages to disk as markdown files and JSON metadata.

    Args:
        pages: List of scraped page data
        output_dir: Directory to save files
    """
    # Create output directory
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)

    markdown_dir = output_path / "markdown"
    markdown_dir.mkdir(exist_ok=True)

    metadata_list = []

    for i, page in enumerate(pages):
        url = page.get("url", "")
        markdown = page.get("markdown", "")
        metadata = page.get("metadata", {})

        # Create safe filename from URL
        filename = url.replace("https://", "").replace("http://", "")
        filename = filename.replace("/", "_").replace(":", "_")
        filename = f"{i:04d}_{filename}.md"

        # Save markdown content
        markdown_file = markdown_dir / filename
        with open(markdown_file, "w", encoding="utf-8") as f:
            f.write(f"# {metadata.get('title', 'Untitled')}\n\n")
            f.write(f"**Source**: {url}\n\n")
            f.write("---\n\n")
            f.write(markdown)

        print(f"Saved: {markdown_file}")

        # Collect metadata
        metadata_list.append({
            "filename": filename,
            "url": url,
            "title": metadata.get("title"),
            "description": metadata.get("description"),
            "language": metadata.get("language"),
        })

    # Save metadata as JSON
    metadata_file = output_path / "metadata.json"
    with open(metadata_file, "w", encoding="utf-8") as f:
        json.dump(metadata_list, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Metadata saved to: {metadata_file}")


def main():
    """Main function demonstrating website crawling."""

    # Configuration
    url = "https://docs.firecrawl.dev"
    limit = 50  # Crawl up to 50 pages
    max_depth = 2  # Follow links 2 levels deep
    output_dir = "firecrawl_output"

    # Crawl the website
    pages = crawl_website(
        url=url,
        limit=limit,
        max_depth=max_depth,
        output_dir=output_dir
    )

    # Print summary
    print("\n" + "=" * 80)
    print("CRAWL SUMMARY")
    print("=" * 80)
    print(f"Total pages crawled: {len(pages)}")
    print(f"Output directory: {output_dir}")

    if pages:
        print("\nFirst 5 pages:")
        for page in pages[:5]:
            print(f"  - {page.get('url')}")


if __name__ == "__main__":
    main()
