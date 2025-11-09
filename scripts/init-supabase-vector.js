import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { OpenAIEmbeddings } from '@langchain/openai';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Initialize Supabase Vector Store with PDF data
 * This script only needs to be run ONCE to upload and process the PDF
 */
async function initializeSupabaseVectorStore() {
	try {
		console.log('🚀 Initializing Supabase Vector Store');
		console.log('='.repeat(60));

		// Check environment variables
		if (!process.env.SUPABASE_URL || !process.env.SUPABASE_API_KEY) {
			throw new Error('Missing SUPABASE_URL or SUPABASE_API_KEY in .env file');
		}

		if (!process.env.OPENAI_API_KEY) {
			throw new Error('Missing OPENAI_API_KEY in .env file');
		}

		// Initialize Supabase client
		console.log('\n📦 Connecting to Supabase...');
		const supabaseClient = createClient(
			process.env.SUPABASE_URL,
			process.env.SUPABASE_API_KEY
		);
		console.log('✅ Connected to Supabase');

		// Load PDF
		console.log('\n📄 Loading PDF file...');
		const pdfPath = path.join(__dirname, '..', 'src', 'assets', 'FK.pdf');
		const loader = new PDFLoader(pdfPath);
		const docs = await loader.load();
		console.log(`✅ PDF loaded: ${docs.length} pages`);

		// Split documents
		console.log('\n✂️  Splitting documents into chunks...');
		const textSplitter = new RecursiveCharacterTextSplitter({
			chunkSize: 1000,
			chunkOverlap: 200,
		});
		const chunks = await textSplitter.splitDocuments(docs);
		console.log(`✅ Created ${chunks.length} chunks`);

		// Initialize embeddings
		console.log('\n🔢 Initializing OpenAI embeddings...');
		const embeddings = new OpenAIEmbeddings({
			modelName: 'text-embedding-3-small',
			apiKey: process.env.OPENAI_API_KEY,
		});
		console.log('✅ Embeddings initialized');

		// Create vector store and upload documents
		console.log('\n📤 Uploading documents to Supabase...');
		console.log('⏳ This may take a few minutes...');

		const vectorStore = await SupabaseVectorStore.fromDocuments(
			chunks,
			embeddings,
			{
				client: supabaseClient,
				tableName: 'embeddings',
				queryName: 'match_embeddings',
			}
		);

		console.log('✅ Documents uploaded successfully!');

		// Test search
		console.log('\n🔍 Testing vector search...');
		const testQuery = 'Hur mycket kan ett barn få i barnbidrag?';
		const results = await vectorStore.similaritySearch(testQuery, 2);

		console.log('\n📊 Test results:');
		results.forEach((doc, i) => {
			console.log(`\n${i + 1}. ${doc.pageContent.substring(0, 200)}...`);
		});

		console.log('\n' + '='.repeat(60));
		console.log('🎉 Initialization completed successfully!');
		console.log('='.repeat(60));
		console.log('\n✅ Your Supabase vector store is ready to use!');
		console.log('✅ Solution 2 will now connect to this existing data.');
		console.log(
			'\n💡 You do NOT need to run this script again unless you want to update the PDF.\n'
		);
	} catch (error) {
		console.error('\n❌ Initialization failed:', error);
		console.error('\nError details:', error.message);
		process.exit(1);
	}
}

// Run initialization
initializeSupabaseVectorStore();
