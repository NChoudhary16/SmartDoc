const { UnstructuredClient } = require("unstructured-client");
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

class UnstructuredService {
  constructor() {
    this.client = new UnstructuredClient({
      serverURL: process.env.UNSTRUCTURED_API_URL || "https://api.unstructuredapp.io",
      security: {
        apiKeyAuth: process.env.UNSTRUCTURED_API_KEY,
      },
    });
  }

  /**
   * Partitions a document into structured elements (tables, text, titles).
   * @param {string} filePath - Path to the file
   * @returns {Array} - List of partitioned elements
   */
  async partitionDocument(filePath) {
    try {
      if (!process.env.UNSTRUCTURED_API_KEY) {
         console.warn('Unstructured API Key missing. Falling back to OCR.');
         return null;
      }

      console.log(`Sending ${filePath} to Unstructured.io for structural analysis...`);
      const data = fs.readFileSync(filePath);
      
      const res = await this.client.general.partition({
        partitionParameters: {
          files: {
            content: data,
            fileName: filePath.split('/').pop(),
          },
          strategy: "hi_res", // High resolution is better for tables
          pdfInferTableStructure: true,
        },
      });

      if (res.statusCode === 200) {
        return res.elements;
      } else {
        throw new Error(`Unstructured API error: ${res.statusCode}`);
      }
    } catch (error) {
      console.error('Unstructured Service Error:', error);
      return null; // Fallback to OCR
    }
  }

  /**
   * Helper to format elements into a cleaner "Source of Truth" string for the LLM
   */
  formatElements(elements) {
    if (!elements) return "";
    return elements.map(el => `[${el.type}] ${el.text}`).join('\n');
  }
}

module.exports = new UnstructuredService();
