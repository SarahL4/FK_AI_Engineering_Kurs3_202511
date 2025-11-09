import OpenAI from 'openai';
import { OPENAI_MODELS, MODEL_COSTS } from '../../shared/config/constants.js';
import { ErrorHandler } from '../utils/errorHandler.js';
import { Logger } from '../../shared/utils/logger.js';
import dotenv from 'dotenv';
dotenv.config();

/**
 * 响应服务 - 处理文件搜索和网络搜索
 */
export class ResponseService {
	constructor() {
		this.client = new OpenAI({
			apiKey: process.env.OPENAI_API_KEY,
		});
	}

	/**
	 * 查询 - 文件搜索和网络搜索
	 * @param {string} query - 用户查询
	 * @param {string} vectorStoreId - Vector Store ID
	 * @param {string} previousResponseId - 前一个响应 ID（用于对话上下文）
	 * @returns {Promise<Object>} 查询结果
	 */
	async query(query, vectorStoreId, previousResponseId = null) {
		try {
			Logger.info(`[方案1] 使用OpenAI最便宜的模型: ${OPENAI_MODELS.CHEAPEST}`);
			Logger.info(`查询: ${query}`);

			// 并行执行文件搜索和网络搜索
			const [fileResponse, webResponse] = await Promise.all([
				this.fileSearch(query, vectorStoreId, previousResponseId),
				this.webSearch(query),
			]);

			// 计算总 token 使用量
			const totalInputTokens =
				fileResponse.usage.input_tokens + webResponse.usage.input_tokens;
			const totalOutputTokens =
				fileResponse.usage.output_tokens + webResponse.usage.output_tokens;

			// 计算成本
			const modelCost = MODEL_COSTS[OPENAI_MODELS.CHEAPEST];
			const inputCost = (totalInputTokens / 1000000) * 0.15;
			const outputCost = (totalOutputTokens / 1000000) * 0.6;
			const totalCost = inputCost + outputCost;

			// 使用Logger记录成本
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
			console.error('❌ 查询失败:', error);
			throw ErrorHandler.handle(error, {
				operation: 'query',
				query,
				vectorStoreId,
			});
		}
	}

	/**
	 * 文件搜索 - 使用 file_search 工具
	 * @param {string} query - 用户查询
	 * @param {string} vectorStoreId - Vector Store ID
	 * @param {string} previousResponseId - 前一个响应 ID
	 * @returns {Promise<Object>} 文件搜索结果
	 */
	async fileSearch(query, vectorStoreId, previousResponseId = null) {
		try {
			console.log(`🔍 执行文件搜索...`);

			const requestConfig = {
				model: OPENAI_MODELS.CHEAPEST, // gpt-4o-mini
				input: query,
				tools: [
					{
						type: 'file_search',
						vector_store_ids: [vectorStoreId],
					},
				],
				store: true, // 存储响应以便后续使用
			};

			// 如果有前一个响应 ID，添加到配置中以维护对话上下文
			if (previousResponseId) {
				requestConfig.previous_response_id = previousResponseId;
			}

			const response = await this.client.responses.create(requestConfig);

			console.log(`✅ 文件搜索完成`);

			return response;
		} catch (error) {
			console.error('❌ 文件搜索失败:', error);
			throw error;
		}
	}

	/**
	 * 网络搜索 - 使用 OpenAI 内置的 web_search_preview 工具
	 * @param {string} query - 用户查询
	 * @returns {Promise<Object>} 网络搜索结果
	 */
	async webSearch(query) {
		try {
			console.log(`🌐 执行网络搜索...`);

			const response = await this.client.responses.create({
				model: OPENAI_MODELS.CHEAPEST, // gpt-4o-mini
				input: query,
				tools: [
					{
						type: 'web_search_preview',
					},
				],
			});

			console.log(`✅ 网络搜索完成`);

			return response;
		} catch (error) {
			console.error('❌ 网络搜索失败:', error);
			throw error;
		}
	}

	/**
	 * 仅文件搜索（不进行网络搜索）
	 * @param {string} query - 用户查询
	 * @param {string} vectorStoreId - Vector Store ID
	 * @param {string} previousResponseId - 前一个响应 ID
	 * @returns {Promise<Object>} 文件搜索结果
	 */
	async fileSearchOnly(query, vectorStoreId, previousResponseId = null) {
		try {
			console.log(
				`💰 [方案1] 使用OpenAI最便宜的模型: ${OPENAI_MODELS.CHEAPEST}`
			);
			console.log(`📝 查询（仅文件搜索）: ${query}`);

			const response = await this.fileSearch(
				query,
				vectorStoreId,
				previousResponseId
			);

			// 计算成本
			const inputCost = (response.usage.input_tokens / 1000000) * 0.15;
			const outputCost = (response.usage.output_tokens / 1000000) * 0.6;
			const totalCost = inputCost + outputCost;

			console.log(`📊 Token使用统计:`);
			console.log(
				`   输入: ${
					response.usage.input_tokens
				} tokens (约 $${inputCost.toFixed(6)})`
			);
			console.log(
				`   输出: ${
					response.usage.output_tokens
				} tokens (约 $${outputCost.toFixed(6)})`
			);
			console.log(`   总成本: 约 $${totalCost.toFixed(6)}`);

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
			console.error('❌ 文件搜索失败:', error);
			throw ErrorHandler.handle(error, {
				operation: 'fileSearchOnly',
				query,
				vectorStoreId,
			});
		}
	}

	/**
	 * 获取响应详情
	 * @param {string} responseId - 响应 ID
	 * @returns {Promise<Object>} 响应详情
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
