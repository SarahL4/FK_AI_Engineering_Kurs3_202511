import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { TavilySearchResults } from '@langchain/community/tools/tavily_search';
import { tool } from '@langchain/core/tools';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';
import { LLMService } from './llmService.js';
import { pdfService } from './pdfService.js';
import { memoryService } from './memoryService.js';
import { ErrorHandler } from '../utils/errorHandler.js';
import { OPENAI_MODELS } from '../../shared/config/constants.js';

/**
 * Agent Service Class
 * Configures and manages Langchain Agent
 */
class AgentService {
	constructor() {
		this.llmService = new LLMService();
		this.agent = null;
		this.fallbackAgent = null;
		this.isInitialized = false;
		this.lastSearchResults = {}; // Store search results for retrieval
	}

	/**
	 * Create PDF search tool
	 */
	createPDFSearchTool() {
		const self = this;
		return tool(
			async ({ query }) => {
				try {
					console.log(`🔍 PDF Search Tool invoked with query: "${query}"`);
					const result = await pdfService.search(query, 4);

					// Store search results for later retrieval
					self.lastSearchResults.fileSearch = {
						query: query,
						documents: result.documents || [],
						timestamp: new Date().toISOString(),
					};

					console.log(
						`✅ PDF Search found ${result.documents?.length || 0} documents`
					);

					return result.content || 'No relevant information found in PDF';
				} catch (error) {
					console.error('❌ PDF search tool error:', error);
					return 'Error occurred while searching PDF';
				}
			},
			{
				name: 'pdf_search',
				description:
					'REQUIRED TOOL: Search official Försäkringskassan PDF documents about Swedish social benefits (föräldrapenning, barnbidrag, vård av barn, etc.). You MUST call this tool FIRST for every query about Swedish benefits.',
				schema: z.object({
					query: z
						.string()
						.describe(
							'The search query in Swedish or English. Include relevant keywords from the user question.'
						),
				}),
			}
		);
	}

	/**
	 * Create Tavily web search tool (wrapped to capture results)
	 */
	createWebSearchTool() {
		const self = this;
		const tavilyTool = new TavilySearchResults({
			maxResults: 5,
			apiKey: process.env.TAVILY_API_KEY,
		});

		// Wrap the tool to capture search results
		return tool(
			async ({ query }) => {
				try {
					console.log(`🌐 Web Search Tool invoked with query: "${query}"`);
					const results = await tavilyTool.invoke(query);

					// Parse and store web search results
					let parsedResults = [];
					try {
						parsedResults =
							typeof results === 'string' ? JSON.parse(results) : results;
						if (Array.isArray(parsedResults)) {
							parsedResults = parsedResults.map((r, index) => ({
								id: index + 1,
								title: r.title || 'No title',
								url: r.url || '',
								content: r.content || r.snippet || '',
							}));
						}
					} catch (e) {
						console.warn('Failed to parse web search results:', e);
					}

					// Store search results
					if (!self.lastSearchResults) {
						self.lastSearchResults = {};
					}
					self.lastSearchResults.webSearch = {
						query: query,
						results: parsedResults,
						timestamp: new Date().toISOString(),
					};

					console.log(`✅ Web Search found ${parsedResults.length} results`);

					return results;
				} catch (error) {
					console.error('❌ Web search tool error:', error);
					return 'Error occurred while searching the web';
				}
			},
			{
				name: 'tavily_search_results_json',
				description:
					'REQUIRED TOOL: Search the web for additional context and current information about Swedish social benefits. You MUST call this tool SECOND (after pdf_search) for every query to provide comprehensive answers with up-to-date information.',
				schema: tavilyTool.schema,
			}
		);
	}

	/**
	 * Create system message for agent
	 */
	getSystemMessage() {
		return new SystemMessage(
			`You are a helpful assistant for Försäkringskassan (Swedish Social Insurance Agency). 
Your role is to help users find information about Swedish social benefits and family support.

IMPORTANT INSTRUCTIONS:
1. For EVERY question, you MUST use BOTH tools in this order:
   a) FIRST: Use 'pdf_search' tool to search the official PDF documents
   b) SECOND: Use 'tavily_search_results_json' tool to search the web for additional context
   
2. The PDF contains comprehensive information about:
   - Föräldrapenning (parental benefits)
   - Barnbidrag (child allowance)
   - Vård av barn (child care)
   - Temporary parental benefits
   - And other family-related benefits

3. After gathering information from BOTH sources, synthesize a comprehensive answer that:
   - Prioritizes official PDF information
   - Supplements with web search results if they add value
   - Is clear and helpful

4. Respond in Swedish if the user asks in Swedish, in English if they ask in English.

5. ALWAYS use BOTH tools - pdf_search AND tavily_search_results_json - for every query.`
		);
	}

	/**
	 * Initialize Agent
	 */
	async initialize() {
		if (this.isInitialized) {
			return;
		}

		try {
			console.log('🚀 Initializing Langchain Agent...');

			// Ensure PDF is loaded
			if (!pdfService.isInitialized) {
				await pdfService.loadDefaultPDF();
			}

			// Create tools
			const pdfTool = this.createPDFSearchTool();
			const webTool = this.createWebSearchTool();
			const tools = [pdfTool, webTool];

			const systemMessage = this.getSystemMessage();

			// Create main Agent (using free Gemini)
			this.agent = createReactAgent({
				llm: this.llmService.getLLM(false), // Use Gemini (free)
				tools: tools,
				checkpointer: memoryService.getCheckpointer(),
				messageModifier: systemMessage,
			});

			// Create fallback Agent (using cheapest OpenAI model)
			this.fallbackAgent = createReactAgent({
				llm: this.llmService.getLLM(true), // Use cheapest OpenAI model
				tools: tools,
				checkpointer: memoryService.getCheckpointer(),
				messageModifier: systemMessage,
			});

			this.isInitialized = true;
			console.log('✅ Langchain Agent initialized successfully');
		} catch (error) {
			console.error('❌ Agent initialization failed:', error);
			throw ErrorHandler.handle(error, { context: 'Agent initialization' });
		}
	}

	/**
	 * Query Agent
	 * @param {string} query - User query
	 * @param {string} threadId - Conversation thread ID
	 */
	async query(query, threadId = 'default') {
		try {
			// Ensure Agent is initialized
			if (!this.isInitialized) {
				await this.initialize();
			}

			const config = memoryService.getConfig(threadId);

			console.log(`\n📝 Processing query: "${query}"`);
			console.log(`🔄 Using thread ID: ${threadId}`);

			let result;
			let usedModel = 'gemini-2.0-flash-exp';
			let cost = 'free';
			let fallback = false;

			try {
				// Try using Gemini Agent
				console.log('🔹 Trying free Gemini model...');
				result = await this.agent.invoke(
					{ messages: [new HumanMessage(query)] },
					config
				);
			} catch (error) {
				// If Gemini fails, fallback to cheapest OpenAI model
				console.warn(
					'⚠️ Gemini Agent failed, falling back to cheapest OpenAI model:',
					error.message
				);

				result = await this.fallbackAgent.invoke(
					{ messages: [new HumanMessage(query)] },
					config
				);

				usedModel = OPENAI_MODELS.CHEAPEST;
				cost = 'paid';
				fallback = true;
			}

			// Extract answer
			const messages = result.messages || [];
			const lastMessage = messages[messages.length - 1];
			const answer = lastMessage?.content || 'Failed to generate answer';

			// Get search results
			const searchResults = {
				fileSearch: this.lastSearchResults.fileSearch || null,
				webSearch: this.lastSearchResults.webSearch || null,
			};

			// Save conversation
			memoryService.saveConversation(threadId, query, answer, {
				model: usedModel,
				cost: cost,
				fallback: fallback,
			});

			// Clear search results for next query
			this.lastSearchResults = {};

			console.log(`✅ Query completed, using model: ${usedModel} (${cost})`);

			return {
				answer: answer,
				model: usedModel,
				cost: cost,
				fallback: fallback,
				threadId: threadId,
				searchResults: searchResults,
			};
		} catch (error) {
			console.error('❌ Query failed:', error);
			throw ErrorHandler.handle(error, { query, threadId });
		}
	}

	/**
	 * Get conversation history
	 */
	getHistory(threadId = 'default') {
		return memoryService.getConversationHistory(threadId);
	}

	/**
	 * Get usage statistics
	 */
	getUsageStats() {
		return this.llmService.getUsageStats();
	}

	/**
	 * Print statistics summary
	 */
	printSummary() {
		this.llmService.printSummary();
	}
}

// Create singleton instance
const agentService = new AgentService();

export { AgentService, agentService };
