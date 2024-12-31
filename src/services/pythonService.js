const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const FormData = require('form-data');
const { PYTHON_BASE_URL } = require('../config/constants');
const { cleanupFile } = require('../utils/fileUtils');

class PythonService {
  constructor() {
    this.token = null;
  }

  async getToken(apiKey) {
    try {
      const response = await axios.post(`${PYTHON_BASE_URL}/get_token`, {
        api_key: apiKey
      });
      this.token = response.data.token;
      return this.token;
    } catch (error) {
      throw new Error('Failed to get token: ' + error.message);
    }
  }

  async processFile(file) {
    if (!this.token) {
      throw new Error('Token not available. Please get token first.');
    }

    const headers = {
      Authorization: `Bearer ${this.token}`
    };

    try {
      const fileType = path.extname(file.originalname).toLowerCase();
      const isVideo = ['.mp4', '.avi', '.mov'].includes(fileType);

      if (isVideo) {
        return await this.processVideo(file, headers);
      } else {
        return await this.processDocument(file, headers);
      }
    } catch (error) {
      throw new Error(`Processing failed: ${error.message}`);
    }
  }

  async processVideo(file, headers) {
    try {
      // Upload video to Python backend for transcription
      const formData = new FormData();
      const fileBuffer = await fs.readFile(file.path);
      formData.append('file', fileBuffer, file.originalname);

      const transcribeResponse = await axios.post(
        `${PYTHON_BASE_URL}/transcribe`,
        formData,
        { 
          headers: {
            ...headers,
            ...formData.getHeaders()
          }
        }
      );

      // Process the transcript
      const processResponse = await axios.post(
        `${PYTHON_BASE_URL}/process_resume`,
        { transcript_url: transcribeResponse.data.transcript_path },
        { headers }
      );

      // Logging the resume path
      console.log('Resume path returned:', processResponse.data.resume_path);

      // Download the resume file from the Python backend
      const resumeDownloadResponse = await axios.get(
        `${PYTHON_BASE_URL}/download_resume`,
        {
          params: { resume_path: processResponse.data.resume_path },
          headers,
          responseType: 'arraybuffer'
        }
      );

      const resumeFilePath = path.join(__dirname, '..', 'downloads', path.basename(processResponse.data.resume_path));
      await fs.writeFile(resumeFilePath, resumeDownloadResponse.data);

      // Create form data for recommendations using the downloaded resume file
      const recommendFormData = new FormData();
      const resumeFileBuffer = await fs.readFile(resumeFilePath);
      recommendFormData.append('resume', resumeFileBuffer, path.basename(resumeFilePath));
      recommendFormData.append('top_n', '5');

      // Get recommendations
      const recommendResponse = await axios.post(
        `${PYTHON_BASE_URL}/recommend`,
        recommendFormData,
        { 
          headers: {
            ...headers,
            ...recommendFormData.getHeaders()
          }
        }
      );

      // Cleanup local file
      await cleanupFile(file.path);
      await cleanupFile(resumeFilePath);

      return recommendResponse.data;
    } catch (error) {
      console.error('Video processing error:', error);
      throw new Error(`Video processing failed: ${error.message}`);
    }
  }

  async processDocument(file, headers) {
    try {
      // Extract text from document
      const formData = new FormData();
      const fileBuffer = await fs.readFile(file.path);
      formData.append('file', fileBuffer, file.originalname);

      const extractResponse = await axios.post(
        `${PYTHON_BASE_URL}/extract_text`,
        formData,
        { 
          headers: {
            ...headers,
            ...formData.getHeaders()
          }
        }
      );

      // Create form data for recommendations using the extracted text
      const recommendFormData = new FormData();
      recommendFormData.append('resume', JSON.stringify(extractResponse.data));
      recommendFormData.append('top_n', '5');

      // Get recommendations
      const recommendResponse = await axios.post(
        `${PYTHON_BASE_URL}/recommend`,
        recommendFormData,
        { 
          headers: {
            ...headers,
            ...recommendFormData.getHeaders()
          }
        }
      );

      // Cleanup uploaded file
      await cleanupFile(file.path);

      return recommendResponse.data;
    } catch (error) {
      throw new Error(`Document processing failed: ${error.message}`);
    }
  }
}

module.exports = new PythonService();