import OpenAI from 'openai';
import { OPENAI_MODELS, MODEL_COSTS } from '../../shared/config/constants.js';
import { ErrorHandler } from '../utils/errorHandler.js';
import { Logger } from '../../shared/utils/logger.js';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Response Service - Handle file search and web search
 */
export class ResponseService {
	constructor() {
		this.client = new OpenAI({
			apiKey: process.env.OPENAI_API_KEY,
		});
	}

	/**
	 * Query - File search and web search
	 * @param {string} query - User query
	 * @param {string} vectorStoreId - Vector Store ID
	 * @param {string} previousResponseId - Previous response ID (for conversation context)
	 * @returns {Promise<Object>} Query result
	 */
	async query(query, vectorStoreId, previousResponseId = null) {
		try {
			Logger.info(
				`[Solution 1] Using OpenAI's cheapest model: ${OPENAI_MODELS.CHEAPEST}`
			);
			Logger.info(`Query: ${query}`);

			// Execute file search and web search in parallel
			const [fileResponse, webResponse] = await Promise.all([
				this.fileSearch(query, vectorStoreId, previousResponseId),
				this.webSearch(query),
			]);

			// Calculate total token usage
			const totalInputTokens =
				fileResponse.usage.input_tokens + webResponse.usage.input_tokens;
			const totalOutputTokens =
				fileResponse.usage.output_tokens + webResponse.usage.output_tokens;

			// Calculate cost
			const modelCost = MODEL_COSTS[OPENAI_MODELS.CHEAPEST];
			const inputCost = (totalInputTokens / 1000000) * 0.15;
			const outputCost = (totalOutputTokens / 1000000) * 0.6;
			const totalCost = inputCost + outputCost;

			// Log cost using Logger
			Logger.cost(
				OPENAI_MODELS.CHEAPEST,
				{
					input_tokens: totalInputTokens,
					output_tokens: totalOutputTokens,
					total_tokens: totalInputTokens + totalOutputTokens,
				},
				totalCost
			);

			return {
				success: true,
				fileAnswer: fileResponse.output_text,
				webAnswer: webResponse.output_text,
				fileResponseId: fileResponse.id,
				webResponseId: webResponse.id,
				model: OPENAI_MODELS.CHEAPEST,
				usage: {
					input_tokens: totalInputTokens,
					output_tokens: totalOutputTokens,
					total_tokens: totalInputTokens + totalOutputTokens,
					estimated_cost: totalCost,
				},
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			console.error('❌ Query failed:', error);
			throw ErrorHandler.handle(error, {
				operation: 'query',
				query,
				vectorStoreId,
			});
		}
	}

	/**
	 * File search - Using file_search tool
	 * @param {string} query - User query
	 * @param {string} vectorStoreId - Vector Store ID
	 * @param {string} previousResponseId - Previous response ID
	 * @returns {Promise<Object>} File search result
	 */
	async fileSearch(query, vectorStoreId, previousResponseId = null) {
		try {
			console.log(`🔍 Executing file search...`);

			const requestConfig = {
				model: OPENAI_MODELS.CHEAPEST, // gpt-4o-mini
				input: query,
				tools: [
					{
						type: 'file_search',
						vector_store_ids: [vectorStoreId],
					},
				],
				store: true, // Store response for future use
			};

			// If previous response ID exists, add it to config to maintain conversation context
			if (previousResponseId) {
				requestConfig.previous_response_id = previousResponseId;
			}

			const response = await this.client.responses.create(requestConfig);

			console.log(`✅ File search completed`);

			return response;
		} catch (error) {
			console.error('❌ File search failed:', error);
			throw error;
		}
	}

	/**
	 * Web search - Using OpenAI's built-in web_search_preview tool
	 * @param {string} query - User query
	 * @returns {Promise<Object>} Web search result
	 */
	async webSearch(query) {
		try {
			console.log(`🌐 Executing web search...`);

			const response = await this.client.responses.create({
				model: OPENAI_MODELS.CHEAPEST, // gpt-4o-mini
				input: query,
				tools: [
					{
						type: 'web_search_preview',
					},
				],
			});

			console.log(`✅ Web search completed`);

			return response;
		} catch (error) {
			console.error('❌ Web search failed:', error);
			throw error;
		}
	}

	/**
	 * File search only (without web search)
	 * @param {string} query - User query
	 * @param {string} vectorStoreId - Vector Store ID
	 * @param {string} previousResponseId - Previous response ID
	 * @returns {Promise<Object>} File search result
	 */
	async fileSearchOnly(query, vectorStoreId, previousResponseId = null) {
		try {
			console.log(
				`💰 [Solution 1] Using OpenAI's cheapest model: ${OPENAI_MODELS.CHEAPEST}`
			);
			console.log(`📝 Query (file search only): ${query}`);

			const response = await this.fileSearch(
				query,
				vectorStoreId,
				previousResponseId
			);

			// Calculate cost
			const inputCost = (response.usage.input_tokens / 1000000) * 0.15;
			const outputCost = (response.usage.output_tokens / 1000000) * 0.6;
			const totalCost = inputCost + outputCost;

			console.log(`📊 Token usage statistics:`);
			console.log(
				`   Input: ${
					response.usage.input_tokens
				} tokens (approx. $${inputCost.toFixed(6)})`
			);
			console.log(
				`   Output: ${
					response.usage.output_tokens
				} tokens (approx. $${outputCost.toFixed(6)})`
			);
			console.log(`   Total cost: approx. $${totalCost.toFixed(6)}`);

			return {
				success: true,
				answer: response.output_text,
				responseId: response.id,
				model: OPENAI_MODELS.CHEAPEST,
				usage: {
					input_tokens: response.usage.input_tokens,
					output_tokens: response.usage.output_tokens,
					total_tokens:
						response.usage.input_tokens + response.usage.output_tokens,
					estimated_cost: totalCost,
				},
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			console.error('❌ File search failed:', error);
			throw ErrorHandler.handle(error, {
				operation: 'fileSearchOnly',
				query,
				vectorStoreId,
			});
		}
	}

	/**
	 * Get response details
	 * @param {string} responseId - Response ID
	 * @returns {Promise<Object>} Response details
	 */
	async getResponse(responseId) {
		try {
			const response = await this.client.responses.retrieve(responseId);
			return {
				success: true,
				response: response,
			};
		} catch (error) {
			throw ErrorHandler.handle(error, {
				operation: 'getResponse',
				responseId,
			});
		}
	}
}
