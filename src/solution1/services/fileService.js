import OpenAI from 'openai';
import { ErrorHandler } from '../utils/errorHandler.js';
import { Logger } from '../../shared/utils/logger.js';
import dotenv from 'dotenv';
dotenv.config();

/**
 * File Service - Retrieve Vector Store information
 */
export class FileService {
	constructor() {
		this.client = new OpenAI({
			apiKey: process.env.OPENAI_API_KEY,
		});
		// Get pre-configured Vector Store ID from environment variables
		this.vectorStoreId = process.env.VECTOR_STORE_ID;
	}

	/**
	 * Get configured Vector Store ID
	 * @returns {string} Vector Store ID
	 */
	getVectorStoreId() {
		if (!this.vectorStoreId) {
			throw new Error(
				'VECTOR_STORE_ID not configured in environment variables. Please run: npm run init:vectorstore'
			);
		}
		return this.vectorStoreId;
	}

	/**
	 * Get Vector Store information
	 * @param {string} vectorStoreId - Vector Store ID
	 * @returns {Promise<Object>} Vector Store information
	 */
	async getVectorStoreInfo(vectorStoreId) {
		try {
			const vectorStore = await this.client.vectorStores.retrieve(
				vectorStoreId
			);
			return {
				success: true,
				id: vectorStore.id,
				name: vectorStore.name,
				file_counts: vectorStore.file_counts,
				created_at: vectorStore.created_at,
			};
		} catch (error) {
			throw ErrorHandler.handle(error, {
				operation: 'getVectorStoreInfo',
				vectorStoreId,
			});
		}
	}

	/**
	 * List files in Vector Store
	 * @param {string} vectorStoreId - Vector Store ID
	 * @returns {Promise<Array>} List of files
	 */
	async listFilesInVectorStore(vectorStoreId) {
		try {
			const files = await this.client.vectorStores.files.list(vectorStoreId);
			return {
				success: true,
				files: files.data,
			};
		} catch (error) {
			throw ErrorHandler.handle(error, {
				operation: 'listFilesInVectorStore',
				vectorStoreId,
			});
		}
	}

	/**
	 * Delete Vector Store
	 * @param {string} vectorStoreId - Vector Store ID
	 * @returns {Promise<Object>} Deletion result
	 */
	async deleteVectorStore(vectorStoreId) {
		try {
			await this.client.vectorStores.del(vectorStoreId);
			console.log(`🗑️ Vector Store deleted: ${vectorStoreId}`);
			return {
				success: true,
				message: 'Vector Store deleted successfully',
			};
		} catch (error) {
			throw ErrorHandler.handle(error, {
				operation: 'deleteVectorStore',
				vectorStoreId,
			});
		}
	}
}
