/**
 * Error Handler Class - Solution 1
 * Provides centralized error handling and standardized error responses
 *
 * Features:
 * - OpenAI API error handling
 * - Rate limit detection and retry logic
 * - User-friendly error messages
 * - Error type classification
 */
export class ErrorHandler {
	/**
	 * Handle error and return standardized error response
	 * @param {Error} error - Error object
	 * @param {Object} context - Error context
	 * @returns {Object} Standardized error response
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

		// Log error
		console.error('❌ Error occurred:', {
			type: errorResponse.error.type,
			message: errorResponse.error.message,
			context: context,
			stack: error.stack,
		});

		return errorResponse;
	}

	/**
	 * Get error type
	 * @param {Error} error - Error object
	 * @returns {string} Error type
	 */
	static getErrorType(error) {
		// OpenAI API errors
		if (error.status) {
			if (error.status === 401) return 'AUTHENTICATION_ERROR';
			if (error.status === 429) return 'RATE_LIMIT_ERROR';
			if (error.status === 404) return 'NOT_FOUND_ERROR';
			if (error.status === 400) return 'BAD_REQUEST_ERROR';
			return 'API_ERROR';
		}

		// File-related errors
		if (error.code === 'LIMIT_FILE_SIZE') return 'FILE_SIZE_ERROR';
		if (error.code === 'ENOENT') return 'FILE_NOT_FOUND_ERROR';

		// Validation errors
		if (error.name === 'ValidationError') return 'VALIDATION_ERROR';

		// Network errors
		if (error.code === 'ECONNREFUSED') return 'CONNECTION_ERROR';
		if (error.code === 'ETIMEDOUT') return 'TIMEOUT_ERROR';

		// Default
		return 'UNKNOWN_ERROR';
	}

	/**
	 * Get user-friendly error message
	 * @param {Error} error - Error object
	 * @returns {string} Error message
	 */
	static getErrorMessage(error) {
		// OpenAI API errors
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

		// File errors
		if (error.code === 'LIMIT_FILE_SIZE') {
			return 'File size exceeds the maximum allowed limit.';
		}
		if (error.code === 'ENOENT') {
			return 'File not found. Please check the file path.';
		}

		// Use original error message or default message
		return error.message || 'An unexpected error occurred. Please try again.';
	}

	/**
	 * Handle API error
	 * @param {Error} error - Error object
	 * @param {Object} context - Context
	 * @returns {Object} Error handling result
	 */
	static handleAPIError(error, context) {
		// Rate limit - implement backoff strategy
		if (error.status === 429) {
			return {
				retry: true,
				delay: this.calculateBackoff(context.retryCount || 0),
				message: 'Rate limit exceeded. Retrying with backoff...',
			};
		}

		// Authentication error - do not retry
		if (error.status === 401) {
			return {
				retry: false,
				message: 'Authentication failed. Please check your API key.',
			};
		}

		// Other API errors - can retry
		return {
			retry: true,
			delay: 1000,
			message: 'API request failed. Retrying...',
		};
	}

	/**
	 * Calculate backoff delay (exponential backoff)
	 * @param {number} retryCount - Retry count
	 * @returns {number} Delay time (milliseconds)
	 */
	static calculateBackoff(retryCount) {
		const baseDelay = 1000; // 1 second
		const maxDelay = 60000; // 60 seconds
		const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
		return delay;
	}

	/**
	 * Handle validation error
	 * @param {Error} error - Error object
	 * @returns {Object} Error response
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
	 * Create custom error
	 * @param {string} message - Error message
	 * @param {string} type - Error type
	 * @param {number} status - HTTP status code
	 * @returns {Error} Custom error object
	 */
	static createError(message, type = 'ERROR', status = 500) {
		const error = new Error(message);
		error.type = type;
		error.status = status;
		return error;
	}
}
