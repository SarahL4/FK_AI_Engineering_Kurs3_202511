import { MemorySaver } from '@langchain/langgraph';

/**
 * Memory Service Class
 * Manages conversation history and context
 */
class MemoryService {
	constructor() {
		this.checkpointer = new MemorySaver();
		this.conversations = new Map(); // threadId -> conversation messages
	}

	/**
	 * Get checkpointer
	 */
	getCheckpointer() {
		return this.checkpointer;
	}

	/**
	 * Save conversation message
	 * @param {string} threadId - Conversation thread ID
	 * @param {string} query - User query
	 * @param {string} answer - AI answer
	 * @param {Object} metadata - Additional metadata
	 */
	saveConversation(threadId, query, answer, metadata = {}) {
		if (!this.conversations.has(threadId)) {
			this.conversations.set(threadId, []);
		}

		const conversation = this.conversations.get(threadId);
		conversation.push({
			query,
			answer,
			timestamp: new Date().toISOString(),
			...metadata,
		});

		// Limit history size (keep last 20 entries)
		if (conversation.length > 20) {
			conversation.splice(0, conversation.length - 20);
		}
	}

	/**
	 * Get conversation history
	 * @param {string} threadId - Conversation thread ID
	 * @returns {Array} Conversation history
	 */
	getConversationHistory(threadId) {
		return this.conversations.get(threadId) || [];
	}

	/**
	 * Clear conversation history
	 * @param {string} threadId - Conversation thread ID
	 */
	clearConversation(threadId) {
		this.conversations.delete(threadId);
	}

	/**
	 * Get configuration object
	 * @param {string} threadId - Conversation thread ID
	 */
	getConfig(threadId) {
		return {
			configurable: {
				thread_id: threadId,
			},
		};
	}
}

// Create singleton instance
const memoryService = new MemoryService();

export { MemoryService, memoryService };
