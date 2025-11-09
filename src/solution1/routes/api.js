import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { FileService } from '../services/fileService.js';
import { ResponseService } from '../services/responseService.js';
import { MemoryService } from '../services/memoryService.js';
import { Validators } from '../../shared/utils/validators.js';
import { ErrorHandler } from '../utils/errorHandler.js';

const router = express.Router();

// 获取 __dirname (ES模块中需要)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置 Multer 用于文件上传
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'uploads/');
	},
	filename: (req, file, cb) => {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
		cb(
			null,
			file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)
		);
	},
});

const upload = multer({
	storage: storage,
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB
	},
	fileFilter: (req, file, cb) => {
		if (file.mimetype === 'application/pdf') {
			cb(null, true);
		} else {
			cb(new Error('Only PDF files are allowed'));
		}
	},
});

// 初始化服务
const fileService = new FileService();
const responseService = new ResponseService();
const memoryService = new MemoryService();

// 创建 uploads 目录（如果不存在）
import fs from 'fs';
if (!fs.existsSync('uploads')) {
	fs.mkdirSync('uploads');
}

/**
 * POST /api/solution1/upload
 * 上传 PDF 文件到 OpenAI Vector Store
 */
router.post('/upload', upload.single('pdf'), async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({
				success: false,
				error: 'No file uploaded',
			});
		}

		// 验证文件
		const validation = Validators.validateFile(req.file);
		if (!validation.valid) {
			// 删除上传的文件
			fs.unlinkSync(req.file.path);
			return res.status(400).json({
				success: false,
				error: validation.error,
			});
		}

		console.log(`📤 处理文件上传: ${req.file.originalname}`);

		// 上传到 OpenAI Vector Store
		const result = await fileService.uploadPDFToVectorStore(
			req.file.path,
			req.file.originalname
		);

		// 删除临时文件
		fs.unlinkSync(req.file.path);

		res.json(result);
	} catch (error) {
		console.error('上传失败:', error);

		// 清理临时文件
		if (req.file && fs.existsSync(req.file.path)) {
			fs.unlinkSync(req.file.path);
		}

		const errorResponse = ErrorHandler.handle(error, {
			operation: 'upload',
			filename: req.file?.originalname,
		});
		res.status(500).json(errorResponse);
	}
});

/**
 * POST /api/solution1/query
 * 查询 - 文件搜索和网络搜索
 */
router.post('/query', async (req, res) => {
	try {
		const { query, vectorStoreId, threadId } = req.body;

		// 验证输入
		const queryValidation = Validators.validateQuery(query);
		if (!queryValidation.valid) {
			return res.status(400).json({
				success: false,
				error: queryValidation.error,
			});
		}

		const vectorStoreValidation =
			Validators.validateVectorStoreId(vectorStoreId);
		if (!vectorStoreValidation.valid) {
			return res.status(400).json({
				success: false,
				error: vectorStoreValidation.error,
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

		// 清理查询
		const sanitizedQuery = Validators.sanitizeQuery(query);
		const finalThreadId = threadId || 'default';

		console.log(`📝 处理查询请求 - Thread: ${finalThreadId}`);

		// 获取前一个响应 ID（用于对话上下文）
		const previousResponseId =
			memoryService.getPreviousResponseId(finalThreadId);

		// 执行查询
		const result = await responseService.query(
			sanitizedQuery,
			vectorStoreId,
			previousResponseId
		);

		// 保存到记忆
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
		console.error('查询失败:', error);
		const errorResponse = ErrorHandler.handle(error, {
			operation: 'query',
			query: req.body.query,
		});
		res.status(500).json(errorResponse);
	}
});

/**
 * GET /api/solution1/history/:threadId
 * 获取对话历史
 */
router.get('/history/:threadId', (req, res) => {
	try {
		const { threadId } = req.params;
		const { limit } = req.query;

		// 验证 thread ID
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
		console.error('获取历史失败:', error);
		const errorResponse = ErrorHandler.handle(error, {
			operation: 'getHistory',
			threadId: req.params.threadId,
		});
		res.status(500).json(errorResponse);
	}
});

/**
 * DELETE /api/solution1/history/:threadId
 * 清除对话历史
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
		console.error('清除历史失败:', error);
		const errorResponse = ErrorHandler.handle(error, {
			operation: 'clearHistory',
			threadId: req.params.threadId,
		});
		res.status(500).json(errorResponse);
	}
});

/**
 * GET /api/solution1/statistics
 * 获取使用统计
 */
router.get('/statistics', (req, res) => {
	try {
		const stats = memoryService.getStatistics();
		res.json({
			success: true,
			statistics: stats,
		});
	} catch (error) {
		console.error('获取统计失败:', error);
		const errorResponse = ErrorHandler.handle(error, {
			operation: 'getStatistics',
		});
		res.status(500).json(errorResponse);
	}
});

/**
 * GET /api/solution1/vector-store/:vectorStoreId
 * 获取 Vector Store 信息
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
		console.error('获取 Vector Store 信息失败:', error);
		const errorResponse = ErrorHandler.handle(error, {
			operation: 'getVectorStoreInfo',
			vectorStoreId: req.params.vectorStoreId,
		});
		res.status(500).json(errorResponse);
	}
});

export default router;
