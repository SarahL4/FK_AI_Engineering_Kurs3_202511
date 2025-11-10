import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { TavilySearchResults } from '@langchain/community/tools/tavily_search';
import { pdfService } from './pdfService.js';
import { ErrorHandler } from '../utils/errorHandler.js';
import { OPENAI_MODELS } from '../../shared/config/constants.js';

/**
 * RAG Service - Retrieval Augmented Generation
 * Uses OpenAI cheapest model (gpt-4o-mini) for stable performance
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
	 * Initialize OpenAI LLM and tools
	 * Runs ONCE per server session - subsequent queries reuse initialized resources
	 */
	async initialize() {
		if (this.isInitialized) {
			console.log('✅ RAG Service already initialized (cached)');
			return;
		}

		try {
			console.log('🚀 Initializing RAG Service...');

			// Initialize OpenAI LLM (cheapest model: gpt-4o-mini)
			this.llm = new ChatOpenAI({
				model: OPENAI_MODELS.CHEAPEST,
				temperature: 0,
				apiKey: process.env.OPENAI_API_KEY,
			});
			console.log('✅ OpenAI LLM initialized (gpt-4o-mini)');

			// Initialize Tavily web search
			this.tavilySearch = new TavilySearchResults({
				maxResults: 2,
				apiKey: process.env.TAVILY_API_KEY,
			});
			console.log('✅ Tavily search initialized');

			// Connect to existing Supabase vector store (NO upload/embedding)
			if (!pdfService.isInitialized) {
				console.log('📄 Connecting to Supabase vector store...');
				await pdfService.loadDefaultPDF();
				console.log(
					'✅ Vector store connected (using pre-existing embeddings)'
				);
			}

			this.isInitialized = true;
			console.log(
				'✅ RAG Service ready - all subsequent queries will be fast!'
			);
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
	 * Generate answer using OpenAI LLM with retrieved context
	 */
	async generateAnswer(query, fileSearchResults) {
		try {
			console.log('🤖 Generating answer with OpenAI...');

			// Prepare context from retrieved documents
			const context = fileSearchResults.documents
				.map((doc) => doc.content)
				.join('\n\n');

			// Create prompt template
			const answerTemplate = PromptTemplate.fromTemplate(
				`Svara på följande fråga baserat ENDAST på den tillhandahållna kontexten:

Kontext:
{context}

Fråga: {question}

Svara på svenska med exakta siffror och belopp från kontexten. Ge ett komplett och tydligt svar.`
			);

			// Create and invoke chain
			const chain = answerTemplate
				.pipe(this.llm)
				.pipe(new StringOutputParser());

			const answer = await chain.invoke({
				context: context,
				question: query,
			});

			// Calculate token usage and cost
			const inputTokens = Math.ceil(context.length / 4);
			const outputTokens = Math.ceil(answer.length / 4);
			const estimatedCost = (inputTokens * 0.15 + outputTokens * 0.6) / 1000000;

			// Update usage stats
			this.usageCounts.paid++;

			console.log('✅ Answer generated with OpenAI (gpt-4o-mini)');

			return {
				answer,
				usedModel: OPENAI_MODELS.CHEAPEST,
				cost: 'paid',
				fallback: false,
				usage: {
					inputTokens,
					outputTokens,
					cost: `$${estimatedCost.toFixed(6)}`,
				},
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
			// Start time tracking
			const startTime = Date.now();

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

			// Calculate response time
			const endTime = Date.now();
			const responseTime = (endTime - startTime) / 1000; // Convert to seconds

			console.log(
				`✅ Query completed using model: ${answerResult.usedModel} (${answerResult.cost})`
			);
			console.log(`⏱️ Response time: ${responseTime.toFixed(2)}s`);

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
				responseTime: responseTime, // Add response time in seconds
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
				model: 'N/A (not using free models)',
			},
			paid: {
				count: this.usageCounts.paid,
				model: OPENAI_MODELS.CHEAPEST + ' (OpenAI)',
			},
		};
	}
}

// Create singleton instance
const ragService = new RAGService();

export { RAGService, ragService };
