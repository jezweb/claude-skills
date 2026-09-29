/**
 * API Test Functions
 *
 * These functions call the Worker API routes and display the results.
 * Notice how API routes work seamlessly with static assets thanks to
 * the "run_worker_first" configuration in wrangler.jsonc
 */

const output = document.getElementById('output')

function displayResult(data, status = 200) {
	const formatted = JSON.stringify(data, null, 2)
	output.textContent = `Status: ${status}\n\n${formatted}`
	output.style.borderLeft = status === 200 ? '4px solid #4caf50' : '4px solid #f44336'
}

function displayError(error) {
	output.textContent = `Error: ${error.message}\n\nCheck console for details.`
	output.style.borderLeft = '4px solid #f44336'
	console.error('API Error:', error)
}

async function testHello() {
	try {
		const response = await fetch('/api/hello')
		const data = await response.json()
		displayResult(data, response.status)
	} catch (error) {
		displayError(error)
	}
}

async function testData() {
	try {
		const response = await fetch('/api/data')
		const data = await response.json()
		displayResult(data, response.status)
	} catch (error) {
		displayError(error)
	}
}

async function testEcho() {
	try {
		const payload = {
			test: 'data',
			timestamp: new Date().toISOString(),
			random: Math.random(),
		}

		const response = await fetch('/api/echo', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(payload),
		})

		const data = await response.json()
		displayResult(data, response.status)
	} catch (error) {
		displayError(error)
	}
}

async function testHealth() {
	try {
		const response = await fetch('/api/health')
		const data = await response.json()
		displayResult(data, response.status)
	} catch (error) {
		displayError(error)
	}
}

// Display welcome message on load
window.addEventListener('DOMContentLoaded', () => {
	displayResult({
		message: 'Welcome! Click a button above to test the API.',
		info: 'All API routes are handled by the Cloudflare Worker',
		static_assets: 'This HTML/CSS/JS is served from public/ directory',
	})
})
