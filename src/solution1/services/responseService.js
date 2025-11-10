import OpenAI from 'openai';
import { OPENAI_MODELS, MODEL_COSTS } from '../../shared/config/constants.js';
import { ErrorHandler } from '../utils/errorHandler.js';
import { Logger } from '../../shared/utils/logger.js';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Response Service - Solution 1
 * Handles file search (via OpenAI Vector Store) and web search
 *
 * Features:
 * - Uses OpenAI's file_search tool for PDF querying
 * - Uses OpenAI's web_search_preview tool for web searches
 * - Parallel execution for faster responses
 * - Response time tracking
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
			// Start time tracking
			const startTime = Date.now();

			Logger.info(
				`[Solution 1] Using OpenAI's cheapest model: ${OPENAI_MODELS.CHEAPEST}`
			);
			Logger.info(`Query: ${query}`);

			// Execute file search and web search in parallel
			const [fileResponse, webResponse] = await Promise.all([
				this.fileSearch(query, vectorStoreId, previousResponseId),
				this.webSearch(query),
			]);

			// Calculate response time
			const endTime = Date.now();
			const responseTime = (endTime - startTime) / 1000; // Convert to seconds

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

			// Log cost and time using Logger
			Logger.cost(
				OPENAI_MODELS.CHEAPEST,
				{
					input_tokens: totalInputTokens,
					output_tokens: totalOutputTokens,
					total_tokens: totalInputTokens + totalOutputTokens,
				},
				totalCost
			);
			Logger.info(`⏱️ Response time: ${responseTime.toFixed(2)}s`);

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
					response_time: responseTime,
				},
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			Logger.error('Query failed:', error);
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
			Logger.info('Executing file search...');

			const requestConfig = {
				model: OPENAI_MODELS.CHEAPEST,
				input: query,
				tools: [
					{
						type: 'file_search',
						vector_store_ids: [vectorStoreId],
						// Limit to top 2 results (same as Solution 2)
						max_num_results: 2,
					},
				],
				store: true, // Store response for conversation context
			};

			// Add previous response ID if exists (for conversation continuity)
			if (previousResponseId) {
				requestConfig.previous_response_id = previousResponseId;
			}

			const response = await this.client.responses.create(requestConfig);
			Logger.info('File search completed (top 2 results)');

			return response;
		} catch (error) {
			Logger.error('File search failed:', error);
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
			Logger.info('Executing web search...');

			const response = await this.client.responses.create({
				model: OPENAI_MODELS.CHEAPEST,
				input: query,
				tools: [
					{
						type: 'web_search_preview',
					},
				],
			});

			Logger.info('Web search completed');

			return response;
		} catch (error) {
			Logger.error('Web search failed:', error);
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
			Logger.info(`Query (file search only): ${query}`);

			const response = await this.fileSearch(
				query,
				vectorStoreId,
				previousResponseId
			);

			// Calculate cost
			const inputCost = (response.usage.input_tokens / 1000000) * 0.15;
			const outputCost = (response.usage.output_tokens / 1000000) * 0.6;
			const totalCost = inputCost + outputCost;

			// Log token usage and cost
			Logger.cost(OPENAI_MODELS.CHEAPEST, response.usage, totalCost);

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
			Logger.error('File search failed:', error);
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
