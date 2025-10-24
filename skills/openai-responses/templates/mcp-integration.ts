/**
 * MCP Server Integration Example
 *
 * Demonstrates how to connect to external MCP (Model Context Protocol) servers
 * for tool integration. MCP is built into the Responses API.
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function basicMCPIntegration() {
  console.log('=== Basic MCP Integration ===\n');

  // Connect to a public MCP server (dice rolling example)
  const response = await openai.responses.create({
    model: 'gpt-5',
    input: 'Roll 2d6 dice for me',
    tools: [
      {
        type: 'mcp',
        server_label: 'dice',
        server_url: 'https://dmcp.example.com', // Replace with real MCP server
      },
    ],
  });

  console.log('Response:', response.output_text);

  // Inspect MCP tool calls
  response.output.forEach((item) => {
    if (item.type === 'mcp_list_tools') {
      console.log('\nDiscovered tools:', item.tools);
    }
    if (item.type === 'mcp_call') {
      console.log('\nTool called:', item.name);
      console.log('Arguments:', item.arguments);
      console.log('Output:', item.output);
    }
  });
}

async function mcpWithAuthentication() {
  console.log('=== MCP with OAuth Authentication ===\n');

  // Connect to Stripe MCP server (requires OAuth token)
  const response = await openai.responses.create({
    model: 'gpt-5',
    input: 'Create a payment link for $20',
    tools: [
      {
        type: 'mcp',
        server_label: 'stripe',
        server_url: 'https://mcp.stripe.com',
        authorization: process.env.STRIPE_OAUTH_ACCESS_TOKEN, // ✅ OAuth token
      },
    ],
  });

  console.log('Response:', response.output_text);

  // Find payment link in output
  response.output.forEach((item) => {
    if (item.type === 'mcp_call' && item.name === 'create_payment_link') {
      console.log('\nPayment link created:', item.output);
    }
  });
}

async function multipleMCPServers() {
  console.log('=== Multiple MCP Servers ===\n');

  // Connect to multiple MCP servers at once
  const response = await openai.responses.create({
    model: 'gpt-5',
    input: 'Check my Stripe balance and create a payment link for the remaining amount',
    tools: [
      {
        type: 'mcp',
        server_label: 'stripe',
        server_url: 'https://mcp.stripe.com',
        authorization: process.env.STRIPE_OAUTH_TOKEN,
      },
      {
        type: 'mcp',
        server_label: 'database',
        server_url: 'https://db-mcp.example.com',
        authorization: process.env.DB_API_KEY,
      },
    ],
  });

  console.log('Response:', response.output_text);
}

async function mcpWithConversation() {
  console.log('=== MCP with Stateful Conversation ===\n');

  // Create conversation
  const conv = await openai.conversations.create();

  // First turn: Use MCP tool
  const response1 = await openai.responses.create({
    model: 'gpt-5',
    conversation: conv.id,
    input: 'Create a $50 payment link for premium subscription',
    tools: [
      {
        type: 'mcp',
        server_label: 'stripe',
        server_url: 'https://mcp.stripe.com',
        authorization: process.env.STRIPE_OAUTH_TOKEN,
      },
    ],
  });

  console.log('Turn 1:', response1.output_text);

  // Second turn: Model remembers previous action
  const response2 = await openai.responses.create({
    model: 'gpt-5',
    conversation: conv.id,
    input: 'Can you show me the details of that payment link?',
  });

  console.log('Turn 2:', response2.output_text);
  // Model recalls payment link from turn 1
}

async function handleMCPErrors() {
  console.log('=== MCP Error Handling ===\n');

  try {
    const response = await openai.responses.create({
      model: 'gpt-5',
      input: 'Use the Stripe tool',
      tools: [
        {
          type: 'mcp',
          server_label: 'stripe',
          server_url: 'https://mcp.stripe.com',
          authorization: process.env.STRIPE_OAUTH_TOKEN,
        },
      ],
    });

    console.log('Success:', response.output_text);
  } catch (error: any) {
    // Handle specific MCP errors
    if (error.type === 'mcp_connection_error') {
      console.error('MCP server connection failed:', error.message);
      console.error('Check server URL and network connectivity');
    } else if (error.type === 'mcp_authentication_error') {
      console.error('MCP authentication failed:', error.message);
      console.error('Verify authorization token is valid and not expired');
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

/**
 * Custom MCP Server Example
 *
 * If you want to build your own MCP server, it needs to implement:
 * 1. POST /mcp/list_tools - Return available tools
 * 2. POST /mcp/call_tool - Execute tool and return result
 *
 * Example MCP server response format:
 */
const exampleMCPListToolsResponse = {
  tools: [
    {
      name: 'get_weather',
      description: 'Get current weather for a city',
      input_schema: {
        type: 'object',
        properties: {
          city: { type: 'string' },
          units: { type: 'string', enum: ['celsius', 'fahrenheit'] },
        },
        required: ['city'],
      },
    },
  ],
};

const exampleMCPCallToolResponse = {
  result: {
    temperature: 72,
    condition: 'sunny',
    humidity: 45,
  },
};

// Run examples
basicMCPIntegration();
// mcpWithAuthentication();
// multipleMCPServers();
// mcpWithConversation();
// handleMCPErrors();
