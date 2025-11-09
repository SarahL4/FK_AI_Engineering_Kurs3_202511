import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { OpenAIEmbeddings } from '@langchain/openai';
import { ErrorHandler } from '../utils/errorHandler.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * PDF Service Class
 * Handles PDF document loading, splitting, and vectorization
 */
class PDFService {
	constructor() {
		this.vectorStore = null;
		this.embeddings = null;
		this.supabaseClient = null;
		this.isInitialized = false;
		this.usingPaidEmbeddings = false;
	}

	/**
	 * Initialize Supabase client
	 */
	initializeSupabase() {
		if (!this.supabaseClient) {
			const supabaseUrl = process.env.SUPABASE_URL;
			const supabaseKey = process.env.SUPABASE_API_KEY;

			if (!supabaseUrl || !supabaseKey) {
				throw new Error(
					'SUPABASE_URL and SUPABASE_API_KEY must be set in environment variables'
				);
			}

			this.supabaseClient = createClient(supabaseUrl, supabaseKey);
			console.log('✅ Supabase client initialized');
		}
		return this.supabaseClient;
	}

	/**
	 * Initialize embeddings (using OpenAI directly to save time)
	 */
	async initializeEmbeddings() {
		if (!this.embeddings) {
			// Gemini Embeddings quota exceeded - directly use OpenAI to save time
			/* 
			try {
				// Try Google Gemini's free embeddings first
				const geminiEmbeddings = new GoogleGenerativeAIEmbeddings({
					modelName: 'models/embedding-001',
					apiKey: process.env.GOOGLE_API_KEY,
				});

				// Test if Gemini embeddings work
				await geminiEmbeddings.embedQuery('test');
				this.embeddings = geminiEmbeddings;
				this.usingPaidEmbeddings = false;
				console.log('✅ [Free] Using Google Gemini Embeddings');
			} catch (error) {
				console.warn(
					'⚠️  Gemini Embeddings unavailable, falling back to OpenAI:',
					error.message
				);
			*/
			// Directly use OpenAI embeddings (faster, no quota issues)
			this.embeddings = new OpenAIEmbeddings({
				modelName: 'text-embedding-3-small', // Cheapest OpenAI embedding
				apiKey: process.env.OPENAI_API_KEY,
			});
			this.usingPaidEmbeddings = true;
			console.log('✅ [Paid] Using OpenAI Embeddings (text-embedding-3-small)');
			// }
		}
		return this.embeddings;
	}

	/**
	 * Load PDF file and create vector store (now uses Supabase)
	 * @param {string} pdfPath - PDF file path (legacy parameter, kept for compatibility)
	 * @returns {Promise<SupabaseVectorStore>}
	 */
	async loadPDF(pdfPath) {
		try {
			console.log(`📄 Connecting to Supabase vector store...`);

			// Initialize Supabase client
			const supabaseClient = this.initializeSupabase();

			// Initialize embeddings (with fallback)
			const embeddings = await this.initializeEmbeddings();

			// Connect to existing Supabase vector store
			this.vectorStore = await SupabaseVectorStore.fromExistingIndex(
				embeddings,
				{
					client: supabaseClient,
					tableName: 'embeddings',
					queryName: 'match_embeddings',
				}
			);

			this.isInitialized = true;

			console.log('✅ Connected to Supabase vector store successfully');
			console.log(
				`💰 Embedding cost: ${
					this.usingPaidEmbeddings ? 'Paid (OpenAI)' : 'Free (Gemini)'
				}`
			);

			// ========== COMMENTED OUT: Old MemoryVectorStore method ==========
			// const loader = new PDFLoader(pdfPath);
			// const docs = await loader.load();
			// console.log(`✅ PDF loaded successfully, ${docs.length} pages`);
			// const textSplitter = new RecursiveCharacterTextSplitter({
			// 	chunkSize: 1000,
			// 	chunkOverlap: 200,
			// });
			// const chunks = await textSplitter.splitDocuments(docs);
			// console.log(`✅ Text splitting completed, ${chunks.length} chunks`);
			// this.vectorStore = await MemoryVectorStore.fromDocuments(
			// 	chunks,
			// 	embeddings
			// );
			// ==================================================================

			return this.vectorStore;
		} catch (error) {
			console.error('❌ Supabase vector store connection failed:', error);
			throw ErrorHandler.handle(error, { pdfPath });
		}
	}

	/**
	 * Load PDF from default location
	 */
	async loadDefaultPDF() {
		const defaultPDFPath = path.join(__dirname, '../../assets/FK.pdf');
		return await this.loadPDF(defaultPDFPath);
	}

	/**
	 * Get vector store
	 */
	getVectorStore() {
		if (!this.isInitialized || !this.vectorStore) {
			throw new Error('Vector store not initialized, please load PDF first');
		}
		return this.vectorStore;
	}

	/**
	 * Search for relevant documents
	 * @param {string} query - Search query
	 * @param {number} k - Number of results to return
	 * @returns {Promise<Object>} - Returns object with content, raw documents, and embedding cost
	 */
	async search(query, k = 4) {
		try {
			const vectorStore = this.getVectorStore();
			const retriever = vectorStore.asRetriever({ k });
			const docs = await retriever.invoke(query);

			// Calculate embedding cost (only for paid OpenAI embeddings)
			console.log(
				'🔍 search() - usingPaidEmbeddings:',
				this.usingPaidEmbeddings
			);
			let embeddingCost = null;
			if (this.usingPaidEmbeddings) {
				// text-embedding-3-small pricing: $0.020 / 1M tokens
				const queryTokens = Math.ceil(query.length / 4); // Rough estimate: 1 token ≈ 4 chars
				const estimatedCost = (queryTokens * 0.02) / 1000000;
				embeddingCost = {
					tokens: queryTokens,
					cost: `$${estimatedCost.toFixed(6)}`,
					model: 'text-embedding-3-small',
				};
				console.log('✅ Embedding cost calculated:', embeddingCost);
			} else {
				console.log('⚠️ Using free embeddings, no cost to calculate');
			}

			// Return both formatted content and raw docs for display
			return {
				content: docs.map((doc) => doc.pageContent).join('\n\n'),
				documents: docs.map((doc, index) => ({
					id: index + 1,
					content: doc.pageContent,
					metadata: doc.metadata,
					source: doc.metadata?.source || 'FK.pdf',
				})),
				embeddingCost, // Add embedding cost info
			};
		} catch (error) {
			console.error('❌ Search failed:', error);
			throw ErrorHandler.handle(error, { query });
		}
	}

	/**
	 * Get embedding info
	 */
	getEmbeddingInfo() {
		return {
			initialized: this.isInitialized,
			usingPaid: this.usingPaidEmbeddings,
			provider: this.usingPaidEmbeddings ? 'OpenAI' : 'Google Gemini',
			model: this.usingPaidEmbeddings
				? 'text-embedding-3-small'
				: 'models/embedding-001',
		};
	}
}

// Create singleton instance
const pdfService = new PDFService();

export { PDFService, pdfService };
