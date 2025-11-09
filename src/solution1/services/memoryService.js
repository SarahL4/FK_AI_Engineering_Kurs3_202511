/**
 * 记忆服务 - 管理对话历史和上下文
 */
export class MemoryService {
	constructor() {
		// 使用 Map 存储对话历史
		// Key: threadId, Value: conversation history object
		this.conversations = new Map();
	}

	/**
	 * 获取前一个响应 ID（用于维护对话上下文）
	 * @param {string} threadId - 线程 ID
	 * @returns {string|null} 前一个响应 ID 或 null
	 */
	getPreviousResponseId(threadId) {
		const conversation = this.conversations.get(threadId);
		if (!conversation || conversation.history.length === 0) {
			return null;
		}

		// 返回最后一个响应 ID
		const lastEntry = conversation.history[conversation.history.length - 1];
		return lastEntry.responseId;
	}

	/**
	 * 保存响应到对话历史
	 * @param {string} threadId - 线程 ID
	 * @param {string} responseId - 响应 ID
	 * @param {string} query - 用户查询
	 * @param {string} fileAnswer - 文件搜索答案
	 * @param {string} webAnswer - 网络搜索答案
	 * @param {Object} usage - Token 使用情况
	 */
	saveResponse(threadId, responseId, query, fileAnswer, webAnswer, usage) {
		// 如果该线程不存在，创建新的对话
		if (!this.conversations.has(threadId)) {
			this.conversations.set(threadId, {
				threadId,
				history: [],
				createdAt: new Date().toISOString(),
				lastUpdated: new Date().toISOString(),
			});
		}

		const conversation = this.conversations.get(threadId);

		// 添加新的对话条目
		conversation.history.push({
			responseId,
			query,
			fileAnswer,
			webAnswer,
			usage,
			timestamp: new Date().toISOString(),
		});

		// 更新最后修改时间
		conversation.lastUpdated = new Date().toISOString();

		console.log(
			`💾 已保存对话记录 - Thread: ${threadId}, 总条目: ${conversation.history.length}`
		);
	}

	/**
	 * 获取对话历史
	 * @param {string} threadId - 线程 ID
	 * @param {number} limit - 返回的最大条目数（默认所有）
	 * @returns {Array} 对话历史
	 */
	getHistory(threadId, limit = null) {
		const conversation = this.conversations.get(threadId);

		if (!conversation) {
			return [];
		}

		let history = conversation.history;

		// 如果指定了限制，返回最近的 N 条记录
		if (limit && limit > 0) {
			history = history.slice(-limit);
		}

		return history.map((entry) => ({
			query: entry.query,
			fileAnswer: entry.fileAnswer,
			webAnswer: entry.webAnswer,
			timestamp: entry.timestamp,
			usage: entry.usage,
		}));
	}

	/**
	 * 获取对话摘要信息
	 * @param {string} threadId - 线程 ID
	 * @returns {Object} 对话摘要
	 */
	getConversationSummary(threadId) {
		const conversation = this.conversations.get(threadId);

		if (!conversation) {
			return {
				exists: false,
				threadId,
			};
		}

		// 计算总 token 使用量
		let totalInputTokens = 0;
		let totalOutputTokens = 0;
		let totalCost = 0;

		conversation.history.forEach((entry) => {
			if (entry.usage) {
				totalInputTokens += entry.usage.input_tokens || 0;
				totalOutputTokens += entry.usage.output_tokens || 0;
				totalCost += entry.usage.estimated_cost || 0;
			}
		});

		return {
			exists: true,
			threadId,
			messageCount: conversation.history.length,
			createdAt: conversation.createdAt,
			lastUpdated: conversation.lastUpdated,
			totalUsage: {
				input_tokens: totalInputTokens,
				output_tokens: totalOutputTokens,
				total_tokens: totalInputTokens + totalOutputTokens,
				estimated_cost: totalCost,
			},
		};
	}

	/**
	 * 清除对话历史
	 * @param {string} threadId - 线程 ID
	 * @returns {boolean} 是否成功清除
	 */
	clearHistory(threadId) {
		if (this.conversations.has(threadId)) {
			this.conversations.delete(threadId);
			console.log(`🗑️ 已清除对话历史 - Thread: ${threadId}`);
			return true;
		}
		return false;
	}

	/**
	 * 获取所有活跃的线程 ID
	 * @returns {Array<string>} 线程 ID 列表
	 */
	getActiveThreads() {
		return Array.from(this.conversations.keys());
	}

	/**
	 * 获取对话统计信息
	 * @returns {Object} 统计信息
	 */
	getStatistics() {
		const threads = Array.from(this.conversations.values());

		let totalMessages = 0;
		let totalInputTokens = 0;
		let totalOutputTokens = 0;
		let totalCost = 0;

		threads.forEach((conversation) => {
			totalMessages += conversation.history.length;
			conversation.history.forEach((entry) => {
				if (entry.usage) {
					totalInputTokens += entry.usage.input_tokens || 0;
					totalOutputTokens += entry.usage.output_tokens || 0;
					totalCost += entry.usage.estimated_cost || 0;
				}
			});
		});

		return {
			activeThreads: threads.length,
			totalMessages,
			totalUsage: {
				input_tokens: totalInputTokens,
				output_tokens: totalOutputTokens,
				total_tokens: totalInputTokens + totalOutputTokens,
				estimated_cost: totalCost,
			},
		};
	}

	/**
	 * 清理旧的对话（基于时间）
	 * @param {number} maxAgeHours - 最大保留时间（小时）
	 * @returns {number} 清理的对话数量
	 */
	cleanupOldConversations(maxAgeHours = 24) {
		const now = new Date().getTime();
		const maxAge = maxAgeHours * 60 * 60 * 1000; // 转换为毫秒
		let cleaned = 0;

		for (const [threadId, conversation] of this.conversations.entries()) {
			const lastUpdated = new Date(conversation.lastUpdated).getTime();
			if (now - lastUpdated > maxAge) {
				this.conversations.delete(threadId);
				cleaned++;
				console.log(`🧹 清理旧对话 - Thread: ${threadId}`);
			}
		}

		if (cleaned > 0) {
			console.log(`🧹 已清理 ${cleaned} 个旧对话`);
		}

		return cleaned;
	}
}
