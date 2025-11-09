import { MODEL_COSTS } from '../../shared/config/constants.js';

/**
 * Cost Logger Utility
 * Tracks free and paid LLM usage
 */
class CostLogger {
	constructor() {
		this.usage = {
			free: [],
			paid: [],
		};
	}

	/**
	 * Log free LLM usage
	 */
	logFreeLLM(provider, model, context = '') {
		const logEntry = {
			provider,
			model,
			context,
			timestamp: new Date().toISOString(),
			cost: 0,
		};

		this.usage.free.push(logEntry);
		console.log(
			`✅ [Free LLM] ${provider} - ${model}${context ? ` (${context})` : ''}`
		);
	}

	/**
	 * Log paid LLM usage
	 */
	logPaidLLM(provider, model, context = '') {
		const modelInfo = MODEL_COSTS[model] || {};
		const logEntry = {
			provider,
			model,
			context,
			timestamp: new Date().toISOString(),
			cost: modelInfo.inputPrice || 'To be calculated',
			modelInfo,
		};

		this.usage.paid.push(logEntry);
		console.warn(`💰 [Paid LLM] ${provider} - ${model}`);
		if (modelInfo.note) {
			console.warn(`   📝 ${modelInfo.note}`);
		}
		if (modelInfo.inputPrice) {
			console.warn(
				`   💵 Price: Input ${modelInfo.inputPrice}, Output ${modelInfo.outputPrice}`
			);
		}
		console.warn(`   ⚠️  Warning: This call will incur costs!`);
	}

	/**
	 * Get usage statistics
	 */
	getUsageStats() {
		return {
			free: {
				count: this.usage.free.length,
				details: this.usage.free,
			},
			paid: {
				count: this.usage.paid.length,
				details: this.usage.paid,
				totalCost: this.estimateCost(),
			},
		};
	}

	/**
	 * Estimate cost based on token usage
	 */
	estimateCost() {
		// Can be calculated based on actual token usage
		// Currently returns a placeholder message
		return 'To be calculated based on actual token usage';
	}

	/**
	 * Print usage summary
	 */
	printSummary() {
		const stats = this.getUsageStats();
		console.log('\n=== LLM Usage Statistics ===');
		console.log(`✅ Free LLM calls: ${stats.free.count} times`);
		console.log(`💰 Paid LLM calls: ${stats.paid.count} times`);

		if (stats.paid.count > 0) {
			console.log('\n⚠️  Paid LLM Usage Details:');
			stats.paid.details.forEach((entry, index) => {
				console.log(
					`  ${index + 1}. ${entry.provider} - ${entry.model} (${
						entry.timestamp
					})`
				);
				if (entry.modelInfo?.note) {
					console.log(`     ${entry.modelInfo.note}`);
				}
				if (entry.modelInfo?.inputPrice) {
					console.log(
						`     Price: Input ${entry.modelInfo.inputPrice}, Output ${entry.modelInfo.outputPrice}`
					);
				}
				if (entry.context) {
					console.log(`     Reason: ${entry.context}`);
				}
			});
		}
	}

	/**
	 * Reset statistics
	 */
	reset() {
		this.usage = {
			free: [],
			paid: [],
		};
	}
}

export { CostLogger };
