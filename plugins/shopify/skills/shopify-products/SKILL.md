---
name: shopify-products
description: >
  Create and manage Shopify products via the Admin API.
  Workflow: gather product data, choose method (API or CSV), execute, verify.
  Use when adding products, bulk importing, updating variants, managing inventory,
  uploading product images, or assigning products to collections.
compatibility: Designed for Claude Code (or similar products)
---

# Shopify Products

Create, update, and bulk-import Shopify products. Produces live products in the store via the GraphQL Admin API or CSV import.

## Prerequisites

- Admin API access token (use the **shopify-setup** skill if not configured)
- Store URL and API version from `shopify.config.json` or `.dev.vars`

## Workflow

### Step 1: Gather Product Data

Determine what the user wants to create or update:

- **Product basics**: title, description (HTML), product type, vendor, tags
- **Variants**: options (size, colour, material), prices, SKUs, inventory quantities
- **Images**: URLs to upload, or local files
- **SEO**: page title, meta description, URL handle
- **Organisation**: collections, product type, tags

Accept data from:
- Direct conversation (user describes products)
- Spreadsheet/CSV file (user provides a file)
- Website scraping (user provides a URL to extract from)

### Step 2: Choose Method

| Scenario | Method |
|----------|--------|
| 1-5 products | GraphQL mutations |
| 6-20 products | GraphQL with batching |
| 20+ products | CSV import via admin |
| Updates to existing | GraphQL mutations |
| Inventory adjustments | `inventorySetQuantities` mutation |

---

### Step 3a: Create via GraphQL (Recommended)

#### productCreate

```graphql
mutation productCreate($product: ProductCreateInput!) {
  productCreate(product: $product) {
    product {
      id
      title
      handle
      status
      variants(first: 100) {
        edges {
          node { id title price sku inventoryQuantity }
        }
      }
    }
    userErrors { field message }
  }
}
```

Variables:

```json
{
  "product": {
    "title": "Example T-Shirt",
    "descriptionHtml": "<p>Premium cotton tee</p>",
    "vendor": "My Brand",
    "productType": "T-Shirts",
    "tags": ["summer", "cotton"],
    "status": "DRAFT",
    "options": ["Size", "Colour"],
    "variants": [
      {
        "optionValues": [
          {"optionName": "Size", "name": "S"},
          {"optionName": "Colour", "name": "Black"}
        ],
        "price": "29.95",
        "sku": "TSHIRT-S-BLK",
        "inventoryPolicy": "DENY",
        "inventoryItem": { "tracked": true }
      },
      {
        "optionValues": [
          {"optionName": "Size", "name": "M"},
          {"optionName": "Colour", "name": "Black"}
        ],
        "price": "29.95",
        "sku": "TSHIRT-M-BLK"
      },
      {
        "optionValues": [
          {"optionName": "Size", "name": "L"},
          {"optionName": "Colour", "name": "Black"}
        ],
        "price": "29.95",
        "sku": "TSHIRT-L-BLK"
      }
    ],
    "seo": {
      "title": "Example T-Shirt | My Brand",
      "description": "Premium cotton tee in multiple sizes"
    }
  }
}
```

Curl example:

```bash
curl -s https://{store}/admin/api/2025-01/graphql.json \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Access-Token: {token}" \
  -d '{"query": "mutation productCreate($product: ProductCreateInput!) { productCreate(product: $product) { product { id title } userErrors { field message } } }", "variables": { ... }}'
```

**Batching multiple products**: Create products sequentially with a short delay between each to respect rate limits (1,000 cost points/second).

#### productUpdate

```graphql
mutation productUpdate($input: ProductInput!) {
  productUpdate(input: $input) {
    product { id title }
    userErrors { field message }
  }
}
```

Variables include `id` (required) plus any fields to update.

#### productDelete

```graphql
mutation productDelete($input: ProductDeleteInput!) {
  productDelete(input: $input) {
    deletedProductId
    userErrors { field message }
  }
}
```

#### productVariantsBulkCreate

Add variants to an existing product:

```graphql
mutation productVariantsBulkCreate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
  productVariantsBulkCreate(productId: $productId, variants: $variants) {
    productVariants { id title price }
    userErrors { field message }
  }
}
```

#### productVariantsBulkUpdate

```graphql
mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
  productVariantsBulkUpdate(productId: $productId, variants: $variants) {
    productVariants { id title price }
    userErrors { field message }
  }
}
```

---

### Step 3b: Bulk Import via CSV

For 20+ products, generate a CSV and import through Shopify admin.

#### CSV Column Reference

**Required columns:**

| Column | Description | Example |
|--------|-------------|---------|
| `Handle` | URL slug (unique per product) | `classic-tshirt` |
| `Title` | Product name (first row per product) | `Classic T-Shirt` |
| `Body (HTML)` | Description in HTML | `<p>Premium cotton</p>` |
| `Vendor` | Brand or manufacturer | `My Brand` |
| `Product Category` | Shopify standard taxonomy | `Apparel & Accessories > Clothing > Shirts & Tops` |
| `Type` | Custom product type | `T-Shirts` |
| `Tags` | Comma-separated tags | `summer, cotton, casual` |
| `Published` | Whether product is visible | `TRUE` or `FALSE` |

**Variant columns:**

| Column | Description | Example |
|--------|-------------|---------|
| `Option1 Name` | First option name | `Size` |
| `Option1 Value` | First option value | `Medium` |
| `Option2 Name` | Second option name | `Colour` |
| `Option2 Value` | Second option value | `Black` |
| `Option3 Name` | Third option name | `Material` |
| `Option3 Value` | Third option value | `Cotton` |
| `Variant SKU` | Stock keeping unit | `TSHIRT-M-BLK` |
| `Variant Grams` | Weight in grams | `200` |
| `Variant Inventory Qty` | Stock quantity | `50` |
| `Variant Price` | Variant price | `29.95` |
| `Variant Compare At Price` | Original price (for sales) | `39.95` |
| `Variant Requires Shipping` | Physical product | `TRUE` |
| `Variant Taxable` | Subject to tax | `TRUE` |

**Image columns:**

| Column | Description | Example |
|--------|-------------|---------|
| `Image Src` | Image URL | `https://example.com/img.jpg` |
| `Image Position` | Display order (1-based) | `1` |
| `Image Alt Text` | Alt text for accessibility | `Classic T-Shirt front view` |

**SEO columns:**

| Column | Description | Example |
|--------|-------------|---------|
| `SEO Title` | Page title tag | `Classic T-Shirt | My Brand` |
| `SEO Description` | Meta description | `Premium cotton tee in 5 colours` |

#### Multi-Variant Row Format

The first row has the product title and details. Subsequent rows for the same product have only the `Handle` and variant-specific columns:

```csv
Handle,Title,Body (HTML),Vendor,Type,Tags,Published,Option1 Name,Option1 Value,Variant SKU,Variant Price,Variant Inventory Qty,Image Src
classic-tshirt,Classic T-Shirt,<p>Premium cotton</p>,My Brand,T-Shirts,"summer,cotton",TRUE,Size,Small,TSH-S,29.95,50,https://example.com/tshirt.jpg
classic-tshirt,,,,,,,,Medium,TSH-M,29.95,75,
classic-tshirt,,,,,,,,Large,TSH-L,29.95,60,
```

#### CSV Rules

- UTF-8 encoding required
- Maximum 50MB file size
- Handle must be unique per product -- duplicate handles update existing products
- Leave variant columns blank on variant rows for fields that don't change
- Images can be on any row -- they're associated by Handle
- `Published` = `TRUE` makes the product immediately visible

#### Import Steps

1. Generate CSV using the column format above
2. Use the template from `assets/product-csv-template.csv` if available
3. Navigate to `https://{store}.myshopify.com/admin/products/import`
4. Upload the CSV file
5. Review the preview and confirm import

Use browser automation to assist with the upload if needed.

---

### Step 4: Upload Product Images

Images require a two-step process -- staged upload then attach.

#### stagedUploadsCreate

```graphql
mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
  stagedUploadsCreate(input: $input) {
    stagedTargets {
      url
      resourceUrl
      parameters { name value }
    }
    userErrors { field message }
  }
}
```

Input per file:

```json
{
  "filename": "product-image.jpg",
  "mimeType": "image/jpeg",
  "httpMethod": "POST",
  "resource": "IMAGE"
}
```

Then upload to the staged URL, and attach with `productCreateMedia`:

#### productCreateMedia

```graphql
mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
  productCreateMedia(productId: $productId, media: $media) {
    media { alt status }
    mediaUserErrors { field message }
  }
}
```

**Shortcut**: If images are already hosted at a public URL, pass `src` directly in the product creation:

```json
{
  "images": [
    { "src": "https://example.com/image.jpg", "alt": "Product front view" }
  ]
}
```

---

### Step 5: Assign to Collections

#### collectionAddProducts

```graphql
mutation collectionAddProducts($id: ID!, $productIds: [ID!]!) {
  collectionAddProducts(id: $id, productIds: $productIds) {
    collection { title productsCount }
    userErrors { field message }
  }
}
```

To find collection IDs:

```graphql
{
  collections(first: 50) {
    edges {
      node { id title handle productsCount }
    }
  }
}
```

---

### Step 6: Set Inventory

#### inventorySetQuantities

```graphql
mutation inventorySetQuantities($input: InventorySetQuantitiesInput!) {
  inventorySetQuantities(input: $input) {
    inventoryAdjustmentGroup { reason }
    userErrors { field message }
  }
}
```

Input:

```json
{
  "reason": "correction",
  "name": "available",
  "quantities": [{
    "inventoryItemId": "gid://shopify/InventoryItem/123",
    "locationId": "gid://shopify/Location/456",
    "quantity": 50
  }]
}
```

To find location IDs:

```graphql
{
  locations(first: 10) {
    edges {
      node { id name isActive }
    }
  }
}
```

---

### Step 7: Verify

Query back the created products to confirm:

```graphql
{
  products(first: 50) {
    edges {
      node {
        id title handle status productType vendor
        variants(first: 10) {
          edges { node { id title price sku inventoryQuantity } }
        }
        images(first: 3) { edges { node { url altText } } }
      }
    }
    pageInfo { hasNextPage endCursor }
  }
}
```

Provide the admin URL for the user to review: `https://{store}.myshopify.com/admin/products`

---

## Critical Patterns

### Product Status

New products default to `DRAFT`. To make them visible:

```json
{ "status": "ACTIVE" }
```

Always confirm with the user before setting status to `ACTIVE`.

### Variant Limits

Shopify allows max **100 variants** per product and **3 options** (e.g. Size, Colour, Material). If you need more, split into separate products.

### Price Formatting

Prices are strings, not numbers. Always quote them: `"price": "29.95"` not `"price": 29.95`.

### HTML Descriptions

Product descriptions accept HTML. Keep it simple -- Shopify's editor handles basic tags:
- `<p>`, `<strong>`, `<em>`, `<ul>`, `<ol>`, `<li>`, `<h2>`-`<h6>`
- `<a href="...">` for links
- `<img>` is stripped -- use product images instead

### Bulk Operations for Large Imports

For 50+ products via API, use Shopify's bulk operation:

```graphql
mutation {
  bulkOperationRunMutation(
    mutation: "mutation ($input: ProductInput!) { productCreate(input: $input) { product { id } userErrors { message } } }"
    stagedUploadPath: "tmp/bulk-products.jsonl"
  ) {
    bulkOperation { id status }
    userErrors { message }
  }
}
```

This accepts a JSONL file with one product per line, processed asynchronously.

---

## Asset Files

- `assets/product-csv-template.csv` -- Blank CSV template with Shopify import headers
