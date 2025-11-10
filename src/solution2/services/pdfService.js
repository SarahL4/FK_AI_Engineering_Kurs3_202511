import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { createClient } from '@supabase/supabase-js';
import { OpenAIEmbeddings } from '@langchain/openai';
import { ErrorHandler } from '../utils/errorHandler.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * PDF Service Class
 * Connects to existing Supabase vector store (PDF already uploaded via init script)
 * NO re-uploading or re-embedding - connects to pre-processed data
 */
class PDFService {
	constructor() {
		this.vectorStore = null;
		this.embeddings = null;
		this.supabaseClient = null;
		this.isInitialized = false;
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
	 * Check if PDF data exists in Supabase
	 * Similar to Solution 1's VECTOR_STORE_ID check
	 */
	async checkSupabaseDataExists() {
		try {
			const supabaseClient = this.initializeSupabase();

			// Check if embeddings table has data
			const { data, error, count } = await supabaseClient
				.from('embeddings')
				.select('id', { count: 'exact', head: true })
				.limit(1);

			if (error) {
				console.error('❌ Error checking Supabase data:', error);
				return false;
			}

			const hasData = count > 0;
			console.log(
				`📊 Supabase embeddings table: ${
					hasData ? `✅ Has ${count} records` : '❌ Empty'
				}`
			);

			return hasData;
		} catch (error) {
			console.error('❌ Failed to check Supabase data:', error);
			return false;
		}
	}

	/**
	 * Initialize OpenAI embeddings (cheapest model)
	 * IMPORTANT: This only creates embedding for search queries, NOT for uploading PDF
	 * PDF embedding is done ONCE by init-supabase-vector.js script
	 */
	async initializeEmbeddings() {
		if (!this.embeddings) {
			this.embeddings = new OpenAIEmbeddings({
				modelName: 'text-embedding-3-small', // Cheapest OpenAI embedding
				apiKey: process.env.OPENAI_API_KEY,
			});
			console.log('✅ Using OpenAI Embeddings (text-embedding-3-small)');
		}
		return this.embeddings;
	}

	/**
	 * Connect to existing Supabase vector store
	 * IMPORTANT: PDF is already uploaded via init-supabase-vector.js script
	 * This method ONLY connects to existing data - NO re-uploading or re-embedding
	 *
	 * @param {string} pdfPath - Legacy parameter (not used, kept for compatibility)
	 * @returns {Promise<SupabaseVectorStore>}
	 */
	async loadPDF(pdfPath) {
		try {
			// Return cached vector store if already connected
			if (this.isInitialized && this.vectorStore) {
				console.log('✅ Using cached vector store connection');
				return this.vectorStore;
			}

			console.log('📄 Connecting to Supabase vector store...');

			// Check if PDF data exists in Supabase
			const hasData = await this.checkSupabaseDataExists();
			if (!hasData) {
				throw new Error(
					'❌ No embeddings found in Supabase!\n' +
						'📝 Please run: npm run init:supabase\n' +
						'💡 This uploads the PDF ONCE, then you can query unlimited times!'
				);
			}

			// Initialize Supabase client and embeddings
			const supabaseClient = this.initializeSupabase();
			const embeddings = await this.initializeEmbeddings();

			// Connect to EXISTING vector store (no upload/embedding happens here)
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
			console.log('⚡ Ready for queries - using pre-existing embeddings!');

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
	 * Search for relevant documents using OpenAI embeddings
	 * IMPORTANT: This creates embeddings ONLY for the search query, NOT for PDF content
	 *
	 * @param {string} query - Search query
	 * @param {number} k - Number of results to return
	 * @returns {Promise<Object>} - Returns documents and embedding cost info
	 */
	async search(query, k = 4) {
		try {
			const vectorStore = this.getVectorStore();
			const retriever = vectorStore.asRetriever({ k });
			const docs = await retriever.invoke(query);

			// Calculate embedding cost for query (OpenAI text-embedding-3-small)
			const queryTokens = Math.ceil(query.length / 4); // Rough estimate: 1 token ≈ 4 chars
			const estimatedCost = (queryTokens * 0.02) / 1000000; // $0.020 / 1M tokens
			const embeddingCost = {
				tokens: queryTokens,
				cost: `$${estimatedCost.toFixed(6)}`,
				model: 'text-embedding-3-small',
			};

			return {
				content: docs.map((doc) => doc.pageContent).join('\n\n'),
				documents: docs.map((doc, index) => ({
					id: index + 1,
					content: doc.pageContent,
					metadata: doc.metadata,
					source: doc.metadata?.source || 'FK.pdf',
				})),
				embeddingCost,
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
			provider: 'OpenAI',
			model: 'text-embedding-3-small',
		};
	}
}

// Create singleton instance
const pdfService = new PDFService();

export { PDFService, pdfService };
