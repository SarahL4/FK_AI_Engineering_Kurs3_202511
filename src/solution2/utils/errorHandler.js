/**
 * Error Handler Utility
 * Unified error handling for various error types
 */
class ErrorHandler {
	/**
	 * Handle error
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
		console.error('Error:', errorResponse);

		// Apply different strategies based on error type
		switch (errorResponse.error.type) {
			case 'API_ERROR':
				return this.handleAPIError(error, context);
			case 'QUOTA_EXCEEDED':
				return this.handleQuotaError(error, context);
			case 'FILE_ERROR':
				return this.handleFileError(error, context);
			case 'VALIDATION_ERROR':
				return this.handleValidationError(error, context);
			default:
				return this.handleGenericError(error, context);
		}
	}

	/**
	 * Get error type
	 */
	static getErrorType(error) {
		if (error.message?.includes('quota') || error.message?.includes('limit')) {
			return 'QUOTA_EXCEEDED';
		}
		if (error.message?.includes('file') || error.message?.includes('PDF')) {
			return 'FILE_ERROR';
		}
		if (
			error.message?.includes('validation') ||
			error.message?.includes('invalid')
		) {
			return 'VALIDATION_ERROR';
		}
		if (error.status || error.response) {
			return 'API_ERROR';
		}
		return 'GENERIC_ERROR';
	}

	/**
	 * Get error message
	 */
	static getErrorMessage(error) {
		return error.message || 'Unknown error occurred';
	}

	/**
	 * Handle quota exceeded error
	 */
	static handleQuotaError(error, context) {
		console.warn('⚠️  Free API quota exhausted, switching to paid service');
		return {
			message:
				'Free service temporarily unavailable, switched to backup service',
			usePaidService: true,
			retry: true,
		};
	}

	/**
	 * Handle API error
	 */
	static handleAPIError(error, context) {
		// Retry logic
		if (error.status === 429) {
			// Rate limit - implement backoff strategy
			return {
				message: 'API rate limit exceeded, please retry later',
				retry: true,
				delay: this.calculateBackoff(),
			};
		}

		// Return user-friendly error message
		return {
			message: 'API call failed, please retry later',
			retry: true,
		};
	}

	/**
	 * Handle file error
	 */
	static handleFileError(error, context) {
		return {
			message: 'PDF file processing failed, please check file format',
			retry: false,
		};
	}

	/**
	 * Handle validation error
	 */
	static handleValidationError(error, context) {
		return {
			message: error.message || 'Input validation failed',
			retry: false,
		};
	}

	/**
	 * Handle generic error
	 */
	static handleGenericError(error, context) {
		return {
			message: 'Unknown error occurred, please retry later',
			retry: true,
		};
	}

	/**
	 * Calculate backoff delay
	 */
	static calculateBackoff(attemptNumber = 1) {
		return Math.min(1000 * Math.pow(2, attemptNumber), 30000);
	}
}

export { ErrorHandler };
