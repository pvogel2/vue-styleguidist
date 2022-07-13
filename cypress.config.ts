import { defineConfig } from 'cypress'
import makeWebpackConfig from './packages/vue-styleguidist/src/scripts/make-webpack-config'
import getConfig from './packages/vue-styleguidist/src/scripts/config'

const webpackConfig = async () => {
	const conf = await makeWebpackConfig(
		await getConfig({
			webpackConfig: {
				module: {
					rules: [
						{
							test: /\.{ts,js,tsx,jsx}$/,
							loader: 'babel-loader'
						}
					]
				}
			}
		}),
		'development'
	)
	console.log(conf?.module?.rules)
	return conf
}

export default defineConfig({
	fixturesFolder: false,
	screenshotsFolder: 'test/cypress/screenshots',
	videosFolder: 'test/cypress/videos',
	video: false,

	e2e: {
		baseUrl: 'http://localhost:6060',
		specPattern: 'test/cypress/integration/**/*.cy.{js,jsx,ts,tsx}',
		supportFile: false
	},

	component: {
		specPattern: 'packages/vue-styleguidist/src/client/**/*.cy.{js,jsx,ts,tsx}',
		devServer: {
			framework: 'vue',
			bundler: 'webpack',
			webpackConfig
		}
	}
})
