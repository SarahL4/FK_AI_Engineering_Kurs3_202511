import { ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { TavilySearchResults } from '@langchain/community/tools/tavily_search';
import { pdfService } from './pdfService.js';
import { ErrorHandler } from '../utils/errorHandler.js';
import { OPENAI_MODELS } from '../../shared/config/constants.js';

/**
 * RAG Service - Retrieval Augmented Generation
 * Uses chains instead of agent for more direct control
 */
class RAGService {
	constructor() {
		this.llm = null;
		this.tavilySearch = null;
		this.isInitialized = false;
		this.usageCounts = {
			free: 0,
			paid: 0,
		};
	}

	/**
	 * Initialize LLM and tools
	 */
	async initialize() {
		if (this.isInitialized) {
			return;
		}

		try {
			console.log('🚀 Initializing RAG Service...');

			// Initialize Gemini as primary LLM (free)
			this.geminiLLM = new ChatGoogleGenerativeAI({
				modelName: 'gemini-2.0-flash-exp',
				temperature: 0,
				apiKey: process.env.GOOGLE_API_KEY,
			});

			// Initialize OpenAI as fallback
			this.openaiLLM = new ChatOpenAI({
				model: OPENAI_MODELS.CHEAPEST,
				temperature: 0,
				apiKey: process.env.OPENAI_API_KEY,
			});

			// Set default to Gemini
			this.llm = this.geminiLLM;

			// Initialize Tavily search (reduced to 2 for speed)
			this.tavilySearch = new TavilySearchResults({
				maxResults: 2,
				apiKey: process.env.TAVILY_API_KEY,
			});

			// Ensure PDF service is initialized
			if (!pdfService.isInitialized) {
				await pdfService.loadDefaultPDF();
			}

			this.isInitialized = true;
			console.log('✅ RAG Service initialized');
		} catch (error) {
			console.error('❌ RAG Service initialization failed:', error);
			throw ErrorHandler.handle(error, { context: 'RAG initialization' });
		}
	}

	/**
	 * Perform file search and return raw results (reduced to 2 for speed and accuracy)
	 */
	async fileSearch(query) {
		try {
			console.log(`📄 File Search: "${query}"`);
			const result = await pdfService.search(query, 2); // Reduced from 4 to 2

			if (!result || !result.documents || result.documents.length === 0) {
				return {
					documents: [],
					topDocument: null,
					embeddingCost: null,
				};
			}

			return {
				documents: result.documents,
				topDocument: result.documents[0], // Highest score
				embeddingCost: result.embeddingCost, // Include embedding cost
			};
		} catch (error) {
			console.error('❌ File search failed:', error);
			throw ErrorHandler.handle(error, { query });
		}
	}

	/**
	 * Perform web search and return raw results
	 */
	async webSearch(query) {
		try {
			console.log(`🌐 Web Search: "${query}"`);
			const results = await this.tavilySearch.invoke(query);

			// Parse results
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

			return {
				results: parsedResults,
			};
		} catch (error) {
			console.error('❌ Web search failed:', error);
			return { results: [] };
		}
	}

	/**
	 * Generate answer using RAG chain (similar to your code example)
	 */
	async generateAnswer(query, fileSearchResults) {
		try {
			console.log(`🤖 Generating answer with LLM...`);

			// Create prompt template (simplified and optimized for accuracy)
			const answerTemplate = PromptTemplate.fromTemplate(
				`Svara på följande fråga baserat ENDAST på den tillhandahållna kontexten:

Kontext:
{context}

Fråga: {question}

Svara på svenska med exakta siffror och belopp från kontexten. Ge ett komplett och tydligt svar.`
			);

			// Prepare context from file search results
			const context = fileSearchResults.documents
				.map((doc) => doc.content)
				.join('\n\n');

			// Create chain
			const chain = answerTemplate
				.pipe(this.llm)
				.pipe(new StringOutputParser());

			let answer;
			let usedModel = 'gemini-2.0-flash-exp';
			let cost = 'free';
			let fallback = false;
			let usage = null;

			try {
				// Try Gemini first
				this.llm = this.geminiLLM;
				const response = await chain.invoke({
					context: context,
					question: query,
				});
				answer = response;
				this.usageCounts.free++;
			} catch (error) {
				// Fallback to OpenAI
				console.warn(
					'⚠️ Gemini failed, falling back to OpenAI:',
					error.message
				);
				this.llm = this.openaiLLM;
				const response = await chain.invoke({
					context: context,
					question: query,
				});
				answer = response;
				usedModel = OPENAI_MODELS.CHEAPEST;
				cost = 'paid';
				fallback = true;
				this.usageCounts.paid++;

				// Calculate approximate token usage for OpenAI
				const inputTokens = Math.ceil(context.length / 4); // Rough estimate: 1 token ≈ 4 chars
				const outputTokens = Math.ceil(answer.length / 4);
				const estimatedCost =
					(inputTokens * 0.15 + outputTokens * 0.6) / 1000000; // gpt-4o-mini pricing

				usage = {
					inputTokens,
					outputTokens,
					cost: `$${estimatedCost.toFixed(6)}`,
				};
			}

			return {
				answer,
				usedModel,
				cost,
				fallback,
				usage,
			};
		} catch (error) {
			console.error('❌ Answer generation failed:', error);
			throw ErrorHandler.handle(error, { query });
		}
	}

	/**
	 * Main query method - file search with LLM and web search
	 */
	async query(query) {
		try {
			if (!this.isInitialized) {
				await this.initialize();
			}

			console.log(`\n📝 Processing query: "${query}"`);

			// Perform file search and web search in parallel
			const [fileSearchResults, webSearchResults] = await Promise.all([
				this.fileSearch(query),
				this.webSearch(query),
			]);

			// Generate answer using RAG chain based on file search
			const answerResult = await this.generateAnswer(query, fileSearchResults);

			console.log(
				`✅ Query completed using model: ${answerResult.usedModel} (${answerResult.cost})`
			);

			const result = {
				fileSearchWithLLM: {
					// File search result processed by LLM
					answer: answerResult.answer,
					model: answerResult.usedModel,
					cost: answerResult.cost,
					fallback: answerResult.fallback,
					sourceDocument: fileSearchResults.topDocument,
					totalDocuments: fileSearchResults.documents.length,
				},
				webSearch: {
					// Only the most relevant web result
					topResult: webSearchResults.results[0] || null,
					totalResults: webSearchResults.results.length,
				},
				usage: answerResult.usage, // LLM token usage info
				embeddingCost: fileSearchResults.embeddingCost, // Embedding cost info
			};

			console.log(
				'🔍 RAG Service returning embeddingCost:',
				result.embeddingCost
			);
			return result;
		} catch (error) {
			console.error('❌ Query failed:', error);
			throw ErrorHandler.handle(error, { query });
		}
	}

	/**
	 * Get usage statistics
	 */
	getUsageStats() {
		return {
			free: {
				count: this.usageCounts.free,
				model: 'gemini-2.0-flash-exp',
			},
			paid: {
				count: this.usageCounts.paid,
				model: OPENAI_MODELS.CHEAPEST,
			},
		};
	}
}

// Create singleton instance
const ragService = new RAGService();

export { RAGService, ragService };
