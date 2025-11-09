/**
 * 错误处理类
 */
export class ErrorHandler {
	/**
	 * 处理错误并返回标准化的错误响应
	 * @param {Error} error - 错误对象
	 * @param {Object} context - 错误上下文
	 * @returns {Object} 标准化的错误响应
	 */
	static handle(error, context = {}) {
		const errorResponse = {
			success: false,
			error: {
				type: this.getErrorType(error),
				message: this.getErrorMessage(error),
				context: context,
				timestamp: new Date().toISOString(),
			},
		};

		// 记录错误日志
		console.error('❌ Error occurred:', {
			type: errorResponse.error.type,
			message: errorResponse.error.message,
			context: context,
			stack: error.stack,
		});

		return errorResponse;
	}

	/**
	 * 获取错误类型
	 * @param {Error} error - 错误对象
	 * @returns {string} 错误类型
	 */
	static getErrorType(error) {
		// OpenAI API 错误
		if (error.status) {
			if (error.status === 401) return 'AUTHENTICATION_ERROR';
			if (error.status === 429) return 'RATE_LIMIT_ERROR';
			if (error.status === 404) return 'NOT_FOUND_ERROR';
			if (error.status === 400) return 'BAD_REQUEST_ERROR';
			return 'API_ERROR';
		}

		// 文件相关错误
		if (error.code === 'LIMIT_FILE_SIZE') return 'FILE_SIZE_ERROR';
		if (error.code === 'ENOENT') return 'FILE_NOT_FOUND_ERROR';

		// 验证错误
		if (error.name === 'ValidationError') return 'VALIDATION_ERROR';

		// 网络错误
		if (error.code === 'ECONNREFUSED') return 'CONNECTION_ERROR';
		if (error.code === 'ETIMEDOUT') return 'TIMEOUT_ERROR';

		// 默认
		return 'UNKNOWN_ERROR';
	}

	/**
	 * 获取用户友好的错误消息
	 * @param {Error} error - 错误对象
	 * @returns {string} 错误消息
	 */
	static getErrorMessage(error) {
		// OpenAI API 错误
		if (error.status === 401) {
			return 'Invalid API key. Please check your OpenAI API key configuration.';
		}
		if (error.status === 429) {
			return 'Rate limit exceeded. Please try again later.';
		}
		if (error.status === 404) {
			return 'Resource not found. The requested resource does not exist.';
		}
		if (error.status === 400) {
			return 'Bad request. Please check your input and try again.';
		}

		// 文件错误
		if (error.code === 'LIMIT_FILE_SIZE') {
			return 'File size exceeds the maximum allowed limit.';
		}
		if (error.code === 'ENOENT') {
			return 'File not found. Please check the file path.';
		}

		// 使用原始错误消息或默认消息
		return error.message || 'An unexpected error occurred. Please try again.';
	}

	/**
	 * 处理 API 错误
	 * @param {Error} error - 错误对象
	 * @param {Object} context - 上下文
	 * @returns {Object} 错误处理结果
	 */
	static handleAPIError(error, context) {
		// Rate limit - 实现退避策略
		if (error.status === 429) {
			return {
				retry: true,
				delay: this.calculateBackoff(context.retryCount || 0),
				message: 'Rate limit exceeded. Retrying with backoff...',
			};
		}

		// 认证错误 - 不重试
		if (error.status === 401) {
			return {
				retry: false,
				message: 'Authentication failed. Please check your API key.',
			};
		}

		// 其他 API 错误 - 可以重试
		return {
			retry: true,
			delay: 1000,
			message: 'API request failed. Retrying...',
		};
	}

	/**
	 * 计算退避延迟（指数退避）
	 * @param {number} retryCount - 重试次数
	 * @returns {number} 延迟时间（毫秒）
	 */
	static calculateBackoff(retryCount) {
		const baseDelay = 1000; // 1秒
		const maxDelay = 60000; // 60秒
		const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
		return delay;
	}

	/**
	 * 处理验证错误
	 * @param {Error} error - 错误对象
	 * @returns {Object} 错误响应
	 */
	static handleValidationError(error) {
		return {
			success: false,
			error: {
				type: 'VALIDATION_ERROR',
				message: error.message || 'Validation failed',
				timestamp: new Date().toISOString(),
			},
		};
	}

	/**
	 * 创建自定义错误
	 * @param {string} message - 错误消息
	 * @param {string} type - 错误类型
	 * @param {number} status - HTTP 状态码
	 * @returns {Error} 自定义错误对象
	 */
	static createError(message, type = 'ERROR', status = 500) {
		const error = new Error(message);
		error.type = type;
		error.status = status;
		return error;
	}
}
