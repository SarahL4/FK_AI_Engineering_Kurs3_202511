import express from 'express';
import { ragService } from '../services/ragService.js';
import { pdfService } from '../services/pdfService.js';
import { memoryService } from '../services/memoryService.js';
import { Validators } from '../../shared/utils/validators.js';
import { ErrorHandler } from '../utils/errorHandler.js';
import { Logger } from '../../shared/utils/logger.js';

const router = express.Router();

/**
 * POST /api/solution2/query
 * Query using RAG Chain (File Search + LLM + Web Search)
 */
router.post('/query', async (req, res) => {
	try {
		const { query, threadId } = req.body;

		// Validate input
		if (!query || typeof query !== 'string' || query.trim().length === 0) {
			return res.status(400).json({
				success: false,
				error: 'Query cannot be empty',
			});
		}

		const finalThreadId = threadId || 'default';

		// Validate thread ID
		const threadIdValidation = Validators.validateThreadId(finalThreadId);
		if (!threadIdValidation.valid) {
			return res.status(400).json({
				success: false,
				error: threadIdValidation.error,
			});
		}

		// Sanitize query
		const sanitizedQuery = Validators.sanitizeQuery(query);

		console.log('\n' + '='.repeat(60));
		console.log('📥 Received Solution 2 query request');
		console.log(`   Query: ${sanitizedQuery}`);
		console.log(`   Thread ID: ${finalThreadId}`);
		console.log('='.repeat(60));

		// Query using RAG service (with threadId for history)
		const result = await ragService.query(sanitizedQuery, finalThreadId);

		// Log results
		console.log(
			`\n📄 File Search + LLM: Generated answer from ${result.fileSearchWithLLM.totalDocuments} documents`
		);
		console.log(
			`🌐 Web Search: Found ${result.webSearch.totalResults} results, showing top 1`
		);

		return res.json({
			success: true,
			data: {
				fileSearchWithLLM: result.fileSearchWithLLM,
				webSearch: result.webSearch,
				model: result.fileSearchWithLLM.model, // LLM model used
				usage: result.usage, // LLM token usage
				responseTime: result.responseTime, // Response time in seconds
			},
		});
	} catch (error) {
		Logger.error('Solution 2 query error:', error);
		return res.status(500).json({
			success: false,
			error: error.message || 'Query failed',
		});
	}
});

/**
 * GET /api/solution2/history/:threadId
 * Get conversation history
 */
router.get('/history/:threadId', (req, res) => {
	try {
		const { threadId } = req.params;
		const { limit } = req.query;

		// Validate thread ID
		const validation = Validators.validateThreadId(threadId);
		if (!validation.valid) {
			return res.status(400).json({
				success: false,
				error: validation.error,
			});
		}

		const history = memoryService.getHistory(
			threadId,
			limit ? parseInt(limit) : null
		);
		const summary = memoryService.getConversationSummary(threadId);

		res.json({
			success: true,
			threadId,
			summary,
			history,
		});
	} catch (error) {
		Logger.error('Failed to get history:', error);
		const errorResponse = ErrorHandler.handle(error, {
			operation: 'getHistory',
			threadId: req.params.threadId,
		});
		res.status(500).json(errorResponse);
	}
});

/**
 * DELETE /api/solution2/history/:threadId
 * Clear conversation history
 */
router.delete('/history/:threadId', (req, res) => {
	try {
		const { threadId } = req.params;

		const validation = Validators.validateThreadId(threadId);
		if (!validation.valid) {
			return res.status(400).json({
				success: false,
				error: validation.error,
			});
		}

		const cleared = memoryService.clearHistory(threadId);

		res.json({
			success: true,
			message: cleared
				? 'History cleared successfully'
				: 'No history found for this thread',
		});
	} catch (error) {
		Logger.error('Failed to clear history:', error);
		const errorResponse = ErrorHandler.handle(error, {
			operation: 'clearHistory',
			threadId: req.params.threadId,
		});
		res.status(500).json(errorResponse);
	}
});

/**
 * GET /api/solution2/statistics
 * Get usage statistics
 */
router.get('/statistics', (req, res) => {
	try {
		const stats = memoryService.getStatistics();
		res.json({
			success: true,
			statistics: stats,
		});
	} catch (error) {
		Logger.error('Failed to get statistics:', error);
		const errorResponse = ErrorHandler.handle(error, {
			operation: 'getStatistics',
		});
		res.status(500).json(errorResponse);
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
		Logger.error('Initialization failed:', error);
		return res.status(500).json({
			success: false,
			error: error.message || 'Initialization failed',
		});
	}
});

export default router;
