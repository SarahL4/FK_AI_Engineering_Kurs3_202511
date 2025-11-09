import OpenAI from 'openai';
import fs from 'fs';
import { ErrorHandler } from '../utils/errorHandler.js';
import { Logger } from '../../shared/utils/logger.js';
import dotenv from 'dotenv';
dotenv.config();

/**
 * 文件服务 - 处理 PDF 上传到 OpenAI Vector Store
 */
export class FileService {
	constructor() {
		this.client = new OpenAI({
			apiKey: process.env.OPENAI_API_KEY,
		});
	}

	/**
	 * 上传 PDF 文件到 OpenAI 并创建 Vector Store
	 * @param {string} filePath - 文件路径
	 * @param {string} fileName - 文件名
	 * @returns {Promise<Object>} { vectorStoreId, fileId }
	 */
	async uploadPDFToVectorStore(filePath, fileName = 'FK_Document') {
		try {
			Logger.info(`开始上传文件: ${fileName}`, { filePath });

			// 1. 上传文件到 OpenAI
			const file = await this.client.files.create({
				file: fs.createReadStream(filePath),
				purpose: 'assistants',
			});

			Logger.success(`文件上传成功: ${file.id}`);

			// 2. 创建 Vector Store
			const vectorStore = await this.client.vectorStores.create({
				name: `FK_${Date.now()}`,
			});

			Logger.success(`Vector Store 创建成功: ${vectorStore.id}`);

			// 3. 将文件添加到 Vector Store
			const vectorStoreFile = await this.client.vectorStores.files.create(
				vectorStore.id,
				{
					file_id: file.id,
				}
			);

			Logger.success(`文件已添加到 Vector Store: ${vectorStoreFile.id}`);

			// 4. 等待文件处理完成
			await this.waitForFileProcessing(vectorStore.id, file.id);

			return {
				success: true,
				vectorStoreId: vectorStore.id,
				fileId: file.id,
				fileName: fileName,
				status: 'completed',
			};
		} catch (error) {
			Logger.error('文件上传失败', error, { filePath, fileName });
			throw ErrorHandler.handle(error, {
				operation: 'uploadPDFToVectorStore',
				filePath,
				fileName,
			});
		}
	}

	/**
	 * 等待文件处理完成
	 * @param {string} vectorStoreId - Vector Store ID
	 * @param {string} fileId - 文件 ID
	 * @param {number} maxAttempts - 最大尝试次数
	 * @returns {Promise<void>}
	 */
	async waitForFileProcessing(vectorStoreId, fileId, maxAttempts = 30) {
		for (let i = 0; i < maxAttempts; i++) {
			try {
				const fileStatus = await this.client.vectorStores.files.retrieve(
					vectorStoreId,
					fileId
				);

				console.log(`📊 文件处理状态: ${fileStatus.status}`);

				if (fileStatus.status === 'completed') {
					console.log('✅ 文件处理完成');
					return;
				}

				if (fileStatus.status === 'failed') {
					throw new Error(
						`File processing failed: ${
							fileStatus.last_error?.message || 'Unknown error'
						}`
					);
				}

				// 等待 2 秒后重试
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
	 * 获取 Vector Store 信息
	 * @param {string} vectorStoreId - Vector Store ID
	 * @returns {Promise<Object>} Vector Store 信息
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
	 * 列出 Vector Store 中的文件
	 * @param {string} vectorStoreId - Vector Store ID
	 * @returns {Promise<Array>} 文件列表
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
	 * 删除 Vector Store
	 * @param {string} vectorStoreId - Vector Store ID
	 * @returns {Promise<Object>} 删除结果
	 */
	async deleteVectorStore(vectorStoreId) {
		try {
			await this.client.vectorStores.del(vectorStoreId);
			console.log(`🗑️ Vector Store 已删除: ${vectorStoreId}`);
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
