import { Logger } from '../../shared/utils/logger.js';

/**
 * Memory Service - Solution 2
 * Manages conversation history and context in-memory
 *
 * Features:
 * - Thread-based conversation tracking
 * - Token usage statistics
 * - Automatic cleanup of old conversations
 */
class MemoryService {
	constructor() {
		// Use Map to store conversation history
		// Key: threadId, Value: conversation history object
		this.conversations = new Map();
	}

	/**
	 * Save response to conversation history
	 * @param {string} threadId - Thread ID
	 * @param {string} query - User query
	 * @param {string} fileAnswer - File search answer
	 * @param {string} webAnswer - Web search answer
	 * @param {Object} usage - Token usage information
	 * @param {Object} metadata - Additional metadata (model, responseTime, etc.)
	 */
	saveResponse(threadId, query, fileAnswer, webAnswer, usage, metadata = {}) {
		// If thread doesn't exist, create new conversation
		if (!this.conversations.has(threadId)) {
			this.conversations.set(threadId, {
				threadId,
				history: [],
				createdAt: new Date().toISOString(),
				lastUpdated: new Date().toISOString(),
			});
		}

		const conversation = this.conversations.get(threadId);

		// Add new conversation entry
		conversation.history.push({
			query,
			fileAnswer,
			webAnswer,
			usage,
			timestamp: new Date().toISOString(),
			...metadata,
		});

		// Update last modified time
		conversation.lastUpdated = new Date().toISOString();

		Logger.info(
			`Conversation saved - Thread: ${threadId}, Total entries: ${conversation.history.length}`
		);
	}

	/**
	 * Get conversation history
	 * @param {string} threadId - Thread ID
	 * @param {number} limit - Maximum number of entries to return (default: all)
	 * @returns {Array} Conversation history
	 */
	getHistory(threadId, limit = null) {
		const conversation = this.conversations.get(threadId);

		if (!conversation) {
			return [];
		}

		let history = conversation.history;

		// If limit specified, return the most recent N records
		if (limit && limit > 0) {
			history = history.slice(-limit);
		}

		return history.map((entry) => ({
			query: entry.query,
			fileAnswer: entry.fileAnswer,
			webAnswer: entry.webAnswer,
			timestamp: entry.timestamp,
			usage: entry.usage,
			model: entry.model,
			responseTime: entry.responseTime,
		}));
	}

	/**
	 * Get conversation summary information
	 * @param {string} threadId - Thread ID
	 * @returns {Object} Conversation summary
	 */
	getConversationSummary(threadId) {
		const conversation = this.conversations.get(threadId);

		if (!conversation) {
			return {
				exists: false,
				threadId,
			};
		}

		// Calculate total token usage
		let totalInputTokens = 0;
		let totalOutputTokens = 0;
		let totalCost = 0;

		conversation.history.forEach((entry) => {
			if (entry.usage) {
				totalInputTokens += entry.usage.inputTokens || 0;
				totalOutputTokens += entry.usage.outputTokens || 0;
				// Parse cost string (e.g., "$0.000123") to number
				const costStr = entry.usage.cost || '0';
				const costValue = parseFloat(costStr.replace('$', '')) || 0;
				totalCost += costValue;
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
	 * Clear conversation history
	 * @param {string} threadId - Thread ID
	 * @returns {boolean} Whether clearing was successful
	 */
	clearHistory(threadId) {
		if (this.conversations.has(threadId)) {
			this.conversations.delete(threadId);
			Logger.info(`Conversation history cleared - Thread: ${threadId}`);
			return true;
		}
		return false;
	}

	/**
	 * Get all active thread IDs
	 * @returns {Array<string>} List of thread IDs
	 */
	getActiveThreads() {
		return Array.from(this.conversations.keys());
	}

	/**
	 * Get conversation statistics
	 * @returns {Object} Statistics information
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
					totalInputTokens += entry.usage.inputTokens || 0;
					totalOutputTokens += entry.usage.outputTokens || 0;
					const costStr = entry.usage.cost || '0';
					const costValue = parseFloat(costStr.replace('$', '')) || 0;
					totalCost += costValue;
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
	 * Clean up old conversations (based on time)
	 * @param {number} maxAgeHours - Maximum retention time (hours)
	 * @returns {number} Number of conversations cleaned up
	 */
	cleanupOldConversations(maxAgeHours = 24) {
		const now = new Date().getTime();
		const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds
		let cleaned = 0;

		for (const [threadId, conversation] of this.conversations.entries()) {
			const lastUpdated = new Date(conversation.lastUpdated).getTime();
			if (now - lastUpdated > maxAge) {
				this.conversations.delete(threadId);
				cleaned++;
				Logger.info(`Old conversation cleaned up - Thread: ${threadId}`);
			}
		}

		if (cleaned > 0) {
			Logger.info(`Cleaned up ${cleaned} old conversations`);
		}

		return cleaned;
	}
}

// Create singleton instance
const memoryService = new MemoryService();

export { MemoryService, memoryService };
