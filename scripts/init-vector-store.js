import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Upload file to OpenAI
 */
async function uploadFile() {
	try {
		const pdfPath = path.join(__dirname, '..', 'src', 'assets', 'FK.pdf');

		console.log('📄 Starting file upload:', pdfPath);

		const file = fs.createReadStream(pdfPath);
		const fileUpload = await client.files.create({
			purpose: 'assistants',
			file: file,
		});

		console.log('✅ File uploaded successfully!');
		console.log('📌 File ID:', fileUpload.id);

		return fileUpload.id;
	} catch (error) {
		console.error('❌ File upload failed:', error.message);
		throw error;
	}
}

/**
 * Create Vector Store and attach file
 */
async function attachToVectorStore() {
	try {
		const fileId = await uploadFile();

		console.log('\n📦 Creating Vector Store...');
		const vectorStore = await client.vectorStores.create({
			name: 'FK',
		});

		const vectorStoreId = vectorStore.id;
		console.log('✅ Vector Store created successfully!');
		console.log('📌 Vector Store ID:', vectorStoreId);

		console.log('\n🔗 Attaching file to Vector Store...');
		const vectorStoreFile = await client.vectorStores.files.create(
			vectorStoreId,
			{
				file_id: fileId,
			}
		);

		console.log('✅ File attached successfully!');
		console.log('📊 Vector Store File:', vectorStoreFile);

		// Wait for file processing to complete
		console.log('\n⏳ Waiting for file processing...');
		await waitForFileProcessing(vectorStoreId, fileId);

		console.log('\n' + '='.repeat(60));
		console.log('🎉 Initialization completed!');
		console.log('='.repeat(60));
		console.log(
			'\nPlease add the following Vector Store ID to your .env file:'
		);
		console.log(`\nVECTOR_STORE_ID=${vectorStoreId}\n`);
		console.log('='.repeat(60));

		return vectorStoreId;
	} catch (error) {
		console.error('❌ Failed to create Vector Store:', error.message);
		throw error;
	}
}

/**
 * Wait for file processing to complete
 */
async function waitForFileProcessing(vectorStoreId, fileId, maxAttempts = 30) {
	for (let i = 0; i < maxAttempts; i++) {
		try {
			const fileStatus = await client.vectorStores.files.retrieve(
				vectorStoreId,
				fileId
			);

			console.log(
				`📊 Processing status: ${fileStatus.status} (${i + 1}/${maxAttempts})`
			);

			if (fileStatus.status === 'completed') {
				console.log('✅ File processing completed!');
				return;
			}

			if (fileStatus.status === 'failed') {
				throw new Error(
					`File processing failed: ${
						fileStatus.last_error?.message || 'Unknown error'
					}`
				);
			}

			// Wait 2 seconds before retry
			await new Promise((resolve) => setTimeout(resolve, 2000));
		} catch (error) {
			if (i === maxAttempts - 1) {
				throw error;
			}
		}
	}

	throw new Error('File processing timeout');
}

/**
 * Test file search functionality
 */
async function testFileSearch(vectorStoreId) {
	try {
		console.log('\n🔍 Testing file search...');

		const response = await client.responses.create({
			model: 'gpt-4o-mini',
			tools: [{ type: 'file_search', vector_store_ids: [vectorStoreId] }],
			input: 'Hur många dagar med föräldrapenning kan man få?',
		});

		console.log('\n✅ Search successful!');
		console.log('📝 Answer:', response.output_text);
	} catch (error) {
		console.error('❌ Search test failed:', error.message);
	}
}

// Main program
async function main() {
	console.log('🚀 Försäkringskassan Vector Store Initialization');
	console.log('='.repeat(60));

	try {
		const vectorStoreId = await attachToVectorStore();

		// Optional: test search functionality
		const testSearch = process.argv.includes('--test');
		if (testSearch) {
			await testFileSearch(vectorStoreId);
		}
	} catch (error) {
		console.error('\n❌ Initialization failed:', error);
		process.exit(1);
	}
}

main();
