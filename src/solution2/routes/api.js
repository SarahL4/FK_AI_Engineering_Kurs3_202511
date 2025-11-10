import express from 'express';
import { ragService } from '../services/ragService.js';
import { pdfService } from '../services/pdfService.js';

const router = express.Router();

/**
 * POST /api/solution2/query
 * Query using RAG Chain (File Search + LLM + Web Search)
 */
router.post('/query', async (req, res) => {
	try {
		const { query } = req.body;

		// Validate input
		if (!query || typeof query !== 'string' || query.trim().length === 0) {
			return res.status(400).json({
				success: false,
				error: 'Query cannot be empty',
			});
		}

		console.log('\n' + '='.repeat(60));
		console.log('📥 Received Solution 2 query request');
		console.log(`   Query: ${query}`);
		console.log('='.repeat(60));

		// Query using RAG service
		const result = await ragService.query(query);

		// Get usage statistics
		const stats = ragService.getUsageStats();

		console.log('\n📊 Current usage statistics:');
		console.log(`   Free LLM: ${stats.free.count} times`);
		console.log(`   Paid LLM: ${stats.paid.count} times`);

		// Log results
		console.log(
			`\n📄 File Search + LLM: Generated answer from ${result.fileSearchWithLLM.totalDocuments} documents`
		);
		console.log(
			`🌐 Web Search: Found ${result.webSearch.totalResults} results, showing top 1`
		);

		console.log('🔍 API returning embeddingCost:', result.embeddingCost);

		return res.json({
			success: true,
			data: {
				fileSearchWithLLM: result.fileSearchWithLLM,
				webSearch: result.webSearch,
				usage: result.usage, // LLM token usage
				embeddingCost: result.embeddingCost, // Embedding token usage
				responseTime: result.responseTime, // Response time in seconds
				stats: {
					freeCount: stats.free.count,
					paidCount: stats.paid.count,
				},
			},
		});
	} catch (error) {
		console.error('❌ Solution 2 query error:', error);
		return res.status(500).json({
			success: false,
			error: error.message || 'Query failed',
		});
	}
});

// Removed history endpoint - RAG service doesn't maintain conversation history

/**
 * GET /api/solution2/usage
 * Get LLM usage statistics
 */
router.get('/usage', async (req, res) => {
	try {
		const stats = ragService.getUsageStats();

		return res.json({
			success: true,
			data: stats,
		});
	} catch (error) {
		console.error('❌ Get statistics failed:', error);
		return res.status(500).json({
			success: false,
			error: error.message || 'Get statistics failed',
		});
	}
});

/**
 * POST /api/solution2/initialize
 * Initialize RAG Service (optional, auto-initializes)
 */
router.post('/initialize', async (req, res) => {
	try {
		await ragService.initialize();

		return res.json({
			success: true,
			message: 'RAG Service initialized successfully',
		});
	} catch (error) {
		console.error('❌ Initialization failed:', error);
		return res.status(500).json({
			success: false,
			error: error.message || 'Initialization failed',
		});
	}
});

export default router;
