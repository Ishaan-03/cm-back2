const fs = require('fs').promises;
const path = require('path');

const ensureDirectory = async (dir) => {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
};

const cleanupFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error(`Error cleaning up file ${filePath}:`, error);
  }
};

module.exports = {
  ensureDirectory,
  cleanupFile
};