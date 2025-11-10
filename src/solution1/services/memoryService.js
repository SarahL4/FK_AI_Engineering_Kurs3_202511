import { Logger } from '../../shared/utils/logger.js';

/**
 * Memory Service - Solution 1
 * Manages conversation history and context in-memory
 *
 * Features:
 * - Thread-based conversation tracking
 * - Token usage statistics
 * - Automatic cleanup of old conversations
 */
export class MemoryService {
	constructor() {
		// Use Map to store conversation history
		// Key: threadId, Value: conversation history object
		this.conversations = new Map();
	}

	/**
	 * Get previous response ID (for maintaining conversation context)
	 * @param {string} threadId - Thread ID
	 * @returns {string|null} Previous response ID or null
	 */
	getPreviousResponseId(threadId) {
		const conversation = this.conversations.get(threadId);
		if (!conversation || conversation.history.length === 0) {
			return null;
		}

		// Return the last response ID
		const lastEntry = conversation.history[conversation.history.length - 1];
		return lastEntry.responseId;
	}

	/**
	 * Save response to conversation history
	 * @param {string} threadId - Thread ID
	 * @param {string} responseId - Response ID
	 * @param {string} query - User query
	 * @param {string} fileAnswer - File search answer
	 * @param {string} webAnswer - Web search answer
	 * @param {Object} usage - Token usage information
	 */
	saveResponse(threadId, responseId, query, fileAnswer, webAnswer, usage) {
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
			responseId,
			query,
			fileAnswer,
			webAnswer,
			usage,
			timestamp: new Date().toISOString(),
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
