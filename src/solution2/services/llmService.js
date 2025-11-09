import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOpenAI } from '@langchain/openai';
import { CostLogger } from '../utils/costLogger.js';
import {
	OPENAI_MODELS,
	GEMINI_MODELS,
	MODEL_COSTS,
} from '../../shared/config/constants.js';

/**
 * LLM Service Management Class
 * Prioritizes free Gemini models, falls back to cheapest OpenAI model when necessary
 */
class LLMService {
	constructor() {
		// Prioritize free Gemini model
		this.geminiModel = new ChatGoogleGenerativeAI({
			modelName: GEMINI_MODELS.FLASH, // gemini-2.0-flash-exp
			temperature: 0,
			apiKey: process.env.GOOGLE_API_KEY,
		});

		// Backup: cheapest OpenAI model (only used when necessary)
		this.openaiModel = new ChatOpenAI({
			model: OPENAI_MODELS.CHEAPEST, // gpt-4o-mini
			temperature: 0,
			apiKey: process.env.OPENAI_API_KEY,
		});

		this.costLogger = new CostLogger();
	}

	/**
	 * Get LLM instance, prioritizing free model
	 * @param {boolean} forceOpenAI - Force use of OpenAI (only when necessary)
	 * @returns {Object} LLM instance
	 */
	getLLM(forceOpenAI = false) {
		if (forceOpenAI) {
			const modelInfo = MODEL_COSTS[OPENAI_MODELS.CHEAPEST];
			this.costLogger.logPaidLLM(
				modelInfo.provider,
				OPENAI_MODELS.CHEAPEST,
				`Cheapest OpenAI model - ${modelInfo.inputPrice} / ${modelInfo.outputPrice}`
			);
			return this.openaiModel;
		}

		// Default to free Gemini
		this.costLogger.logFreeLLM('Google Gemini', GEMINI_MODELS.FLASH);
		return this.geminiModel;
	}

	/**
	 * Smart LLM selection: try Gemini, fallback to cheapest OpenAI model on failure
	 */
	async getLLMWithFallback() {
		try {
			// First try using Gemini
			this.costLogger.logFreeLLM('Google Gemini', GEMINI_MODELS.FLASH);
			return this.geminiModel;
		} catch (error) {
			console.warn(
				'Gemini unavailable, falling back to cheapest OpenAI model:',
				error.message
			);
			const modelInfo = MODEL_COSTS[OPENAI_MODELS.CHEAPEST];
			this.costLogger.logPaidLLM(
				modelInfo.provider,
				OPENAI_MODELS.CHEAPEST,
				`Fallback - Cheapest OpenAI model (${modelInfo.inputPrice} / ${modelInfo.outputPrice})`
			);
			return this.openaiModel;
		}
	}

	/**
	 * Get usage statistics
	 */
	getUsageStats() {
		return this.costLogger.getUsageStats();
	}

	/**
	 * Print usage summary
	 */
	printSummary() {
		this.costLogger.printSummary();
	}

	/**
	 * Reset statistics
	 */
	resetStats() {
		this.costLogger.reset();
	}
}

export { LLMService };
