import { defineConfig } from 'vite'
import { cloudflare } from '@cloudflare/vite-plugin'

export default defineConfig({
	plugins: [
		cloudflare({
			// Optional: Configure the plugin if needed
			// See: https://developers.cloudflare.com/workers/vite-plugin/
		}),
	],
})
