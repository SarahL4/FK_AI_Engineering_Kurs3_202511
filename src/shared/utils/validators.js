import { UPLOAD_CONFIG } from '../config/constants.js';

/**
 * 验证器类 - 用于验证各种输入
 */
export class Validators {
	/**
	 * 验证文件
	 * @param {Object} file - Multer 文件对象
	 * @returns {Object} { valid: boolean, error: string|null }
	 */
	static validateFile(file) {
		if (!file) {
			return { valid: false, error: 'No file provided' };
		}

		// 检查文件大小
		if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
			return {
				valid: false,
				error: `File size exceeds maximum limit of ${
					UPLOAD_CONFIG.MAX_FILE_SIZE / 1024 / 1024
				}MB`,
			};
		}

		// 检查文件类型
		if (!UPLOAD_CONFIG.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
			return {
				valid: false,
				error: `Invalid file type. Only ${UPLOAD_CONFIG.ALLOWED_MIME_TYPES.join(
					', '
				)} are allowed`,
			};
		}

		return { valid: true, error: null };
	}

	/**
	 * 验证查询输入
	 * @param {string} query - 用户查询
	 * @returns {Object} { valid: boolean, error: string|null }
	 */
	static validateQuery(query) {
		if (!query || typeof query !== 'string') {
			return { valid: false, error: 'Query must be a non-empty string' };
		}

		const trimmedQuery = query.trim();
		if (trimmedQuery.length === 0) {
			return { valid: false, error: 'Query cannot be empty' };
		}

		if (trimmedQuery.length > 1000) {
			return { valid: false, error: 'Query too long (max 1000 characters)' };
		}

		return { valid: true, error: null };
	}

	/**
	 * 验证 Thread ID
	 * @param {string} threadId - 线程ID
	 * @returns {Object} { valid: boolean, error: string|null }
	 */
	static validateThreadId(threadId) {
		if (!threadId || typeof threadId !== 'string') {
			return { valid: false, error: 'Thread ID must be a non-empty string' };
		}

		const trimmedId = threadId.trim();
		if (trimmedId.length === 0) {
			return { valid: false, error: 'Thread ID cannot be empty' };
		}

		// 简单的字符验证（允许字母数字和连字符）
		if (!/^[a-zA-Z0-9-_]+$/.test(trimmedId)) {
			return {
				valid: false,
				error:
					'Thread ID can only contain letters, numbers, hyphens, and underscores',
			};
		}

		return { valid: true, error: null };
	}

	/**
	 * 验证 Vector Store ID
	 * @param {string} vectorStoreId - Vector Store ID
	 * @returns {Object} { valid: boolean, error: string|null }
	 */
	static validateVectorStoreId(vectorStoreId) {
		if (!vectorStoreId || typeof vectorStoreId !== 'string') {
			return {
				valid: false,
				error: 'Vector Store ID must be a non-empty string',
			};
		}

		// OpenAI Vector Store IDs 通常以 "vs_" 开头
		if (!vectorStoreId.startsWith('vs_')) {
			return {
				valid: false,
				error: 'Invalid Vector Store ID format (should start with "vs_")',
			};
		}

		return { valid: true, error: null };
	}

	/**
	 * 清理和规范化查询字符串
	 * @param {string} query - 原始查询
	 * @returns {string} 清理后的查询
	 */
	static sanitizeQuery(query) {
		return query.trim().replace(/\s+/g, ' ');
	}
}
