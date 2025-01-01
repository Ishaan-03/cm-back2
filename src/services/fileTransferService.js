const fs = require('fs').promises;
const path = require('path');
const { TEMP_DIR } = require('../config/constants');

class FileTransferService {
  async moveFileToTemp(file) {
    try {
      const tempFilePath = path.join(TEMP_DIR, file.originalname);
      await fs.copyFile(file.path, tempFilePath);
      return tempFilePath;
    } catch (error) {
      throw new Error(`Failed to move file to temp directory: ${error.message}`);
    }
  }

  async cleanupFiles(filePaths) {
    for (const filePath of filePaths) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.error(`Error cleaning up file ${filePath}:`, error);
      }
    }
  }
}

module.exports = new FileTransferService();