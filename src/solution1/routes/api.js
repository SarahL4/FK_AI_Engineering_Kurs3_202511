import express from 'express';
import { FileService } from '../services/fileService.js';
import { ResponseService } from '../services/responseService.js';
import { MemoryService } from '../services/memoryService.js';
import { Validators } from '../../shared/utils/validators.js';
import { ErrorHandler } from '../utils/errorHandler.js';
import { Logger } from '../../shared/utils/logger.js';

const router = express.Router();

// Initialize services (singleton instances)
const fileService = new FileService();
const responseService = new ResponseService();
const memoryService = new MemoryService();

/**
 * GET /api/solution1/config
 * Get configuration information (including Vector Store ID)
 */
router.get('/config', async (req, res) => {
	try {
		const vectorStoreId = fileService.getVectorStoreId();
		const info = await fileService.getVectorStoreInfo(vectorStoreId);

		res.json({
			success: true,
			vectorStoreId,
			vectorStoreInfo: info,
		});
	} catch (error) {
		Logger.error('Failed to get config:', error);
		const errorResponse = ErrorHandler.handle(error, {
			operation: 'getConfig',
		});
		res.status(500).json(errorResponse);
	}
});

/**
 * POST /api/solution1/query
 * Query - File search and web search
 */
router.post('/query', async (req, res) => {
	try {
		const { query, threadId } = req.body;

		// Validate input
		const queryValidation = Validators.validateQuery(query);
		if (!queryValidation.valid) {
			return res.status(400).json({
				success: false,
				error: queryValidation.error,
			});
		}

		const threadIdValidation = Validators.validateThreadId(
			threadId || 'default'
		);
		if (!threadIdValidation.valid) {
			return res.status(400).json({
				success: false,
				error: threadIdValidation.error,
			});
		}

		// Get configured Vector Store ID
		const vectorStoreId = fileService.getVectorStoreId();

		// Sanitize query
		const sanitizedQuery = Validators.sanitizeQuery(query);
		const finalThreadId = threadId || 'default';

		Logger.info(`Processing query request - Thread: ${finalThreadId}`);

		// Get previous response ID (for conversation context)
		const previousResponseId =
			memoryService.getPreviousResponseId(finalThreadId);

		// Execute query
		const result = await responseService.query(
			sanitizedQuery,
			vectorStoreId,
			previousResponseId
		);

		// Save to memory
		memoryService.saveResponse(
			finalThreadId,
			result.fileResponseId,
			sanitizedQuery,
			result.fileAnswer,
			result.webAnswer,
			result.usage
		);

		res.json(result);
	} catch (error) {
		Logger.error('Query failed:', error);
		const errorResponse = ErrorHandler.handle(error, {
			operation: 'query',
			query: req.body.query,
		});
		res.status(500).json(errorResponse);
	}
});

/**
 * GET /api/solution1/history/:threadId
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
 * DELETE /api/solution1/history/:threadId
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
 * GET /api/solution1/statistics
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
 * GET /api/solution1/vector-store/:vectorStoreId
 * Get Vector Store information
 */
router.get('/vector-store/:vectorStoreId', async (req, res) => {
	try {
		const { vectorStoreId } = req.params;

		const validation = Validators.validateVectorStoreId(vectorStoreId);
		if (!validation.valid) {
			return res.status(400).json({
				success: false,
				error: validation.error,
			});
		}

		const info = await fileService.getVectorStoreInfo(vectorStoreId);
		res.json(info);
	} catch (error) {
		Logger.error('Failed to get Vector Store info:', error);
		const errorResponse = ErrorHandler.handle(error, {
			operation: 'getVectorStoreInfo',
			vectorStoreId: req.params.vectorStoreId,
		});
		res.status(500).json(errorResponse);
	}
});

export default router;
