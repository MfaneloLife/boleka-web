import { ImageAnnotatorClient } from '@google-cloud/vision';
import { adminDb } from './firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Initialize Vision API client
const visionClient = new ImageAnnotatorClient({
  projectId: process.env.FIREBASE_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS, // Path to service account key
});

export interface BarcodeResult {
  id: string;
  type: string;
  data: string;
  format: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence?: number;
  extractedAt: Timestamp;
  userId?: string;
}

export interface ImageLabel {
  id: string;
  description: string;
  score: number;
  confidence: number;
  topicality: number;
}

export interface TextExtraction {
  id: string;
  extractedText: string;
  language?: string;
  confidence: number;
  boundingBoxes: Array<{
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  extractedAt: Timestamp;
  userId?: string;
}

export interface MLVisionResult {
  imageId: string;
  userId: string;
  imageUrl: string;
  filename: string;
  
  // Analysis results
  barcodes: BarcodeResult[];
  labels: ImageLabel[];
  textExtraction?: TextExtraction;
  
  // Processing metadata
  processedAt: Timestamp;
  processingTime: number;
  imageSize: {
    width: number;
    height: number;
  };
  
  // Analysis options used
  analysisOptions: {
    detectBarcodes: boolean;
    detectLabels: boolean;
    extractText: boolean;
    detectFaces: boolean;
    detectObjects: boolean;
  };
}

export class MLVisionService {
  private static readonly COLLECTIONS = {
    VISION_RESULTS: 'ml_vision_results',
    BARCODES: 'scanned_barcodes', 
    TEXT_EXTRACTIONS: 'text_extractions',
    IMAGE_LABELS: 'image_labels',
    PROCESSING_LOGS: 'ml_processing_logs'
  };

  /**
   * Analyze image for barcodes, text, and labels
   */
  static async analyzeImage(
    imageBuffer: Buffer,
    options: {
      detectBarcodes?: boolean;
      detectLabels?: boolean;
      extractText?: boolean;
      detectFaces?: boolean;
      detectObjects?: boolean;
    } = {},
    metadata: {
      userId?: string;
      filename?: string;
      imageUrl?: string;
    } = {}
  ): Promise<MLVisionResult> {
    const startTime = Date.now();
    const analysisOptions = {
      detectBarcodes: true,
      detectLabels: true,
      extractText: true,
      detectFaces: false,
      detectObjects: false,
      ...options
    };

    try {
      const results: Partial<MLVisionResult> = {
        imageId: this.generateId(),
        userId: metadata.userId || 'anonymous',
        imageUrl: metadata.imageUrl || '',
        filename: metadata.filename || 'unknown',
        barcodes: [],
        labels: [],
        analysisOptions,
        processedAt: Timestamp.now(),
        processingTime: 0
      };

      // Get image properties
      const [imageProperties] = await visionClient.imageProperties({
        image: { content: imageBuffer }
      });
      
      results.imageSize = {
        width: (imageProperties as any)?.width || 0,
        height: (imageProperties as any)?.height || 0
      };

      // Barcode detection
      if (analysisOptions.detectBarcodes) {
        const barcodes = await this.detectBarcodes(imageBuffer, metadata.userId);
        results.barcodes = barcodes;
      }

      // Label detection  
      if (analysisOptions.detectLabels) {
        const labels = await this.detectLabels(imageBuffer);
        results.labels = labels;
      }

      // Text extraction
      if (analysisOptions.extractText) {
        const textExtraction = await this.extractText(imageBuffer, metadata.userId);
        results.textExtraction = textExtraction;
      }

      // Calculate processing time
      results.processingTime = Date.now() - startTime;

      // Store results in Firestore
      const docRef = await adminDb
        .collection(this.COLLECTIONS.VISION_RESULTS)
        .add(results);

      return {
        ...results,
        imageId: docRef.id
      } as MLVisionResult;

    } catch (error) {
      console.error('Error analyzing image:', error);
      
      // Log error
      await this.logProcessingError(error as Error, metadata);
      throw error;
    }
  }

  /**
   * Detect barcodes in image
   */
  static async detectBarcodes(imageBuffer: Buffer, userId?: string): Promise<BarcodeResult[]> {
    try {
      const [result] = await visionClient.textDetection({
        image: { content: imageBuffer }
      });

      const barcodes: BarcodeResult[] = [];

      if (result.textAnnotations) {
        for (const annotation of result.textAnnotations) {
          // Check if text looks like a barcode (numbers, specific patterns)
          const text = annotation.description || '';
          if (this.isBarcodePattern(text)) {
            const barcode: BarcodeResult = {
              id: this.generateId(),
              type: this.determineBarcodeType(text),
              data: text,
              format: 'TEXT_DETECTED',
              confidence: 0.85, // Default confidence for text-based detection
              extractedAt: Timestamp.now(),
              userId
            };

            // Extract bounding box if available
            if (annotation.boundingPoly?.vertices) {
              const vertices = annotation.boundingPoly.vertices;
              if (vertices.length >= 2) {
                barcode.boundingBox = {
                  x: vertices[0].x || 0,
                  y: vertices[0].y || 0,
                  width: (vertices[2]?.x || 0) - (vertices[0].x || 0),
                  height: (vertices[2]?.y || 0) - (vertices[0].y || 0)
                };
              }
            }

            barcodes.push(barcode);

            // Store individual barcode
            await adminDb
              .collection(this.COLLECTIONS.BARCODES)
              .add(barcode);
          }
        }
      }

      return barcodes;
    } catch (error) {
      console.error('Error detecting barcodes:', error);
      return [];
    }
  }

  /**
   * Detect labels in image
   */
  static async detectLabels(imageBuffer: Buffer): Promise<ImageLabel[]> {
    try {
      const [result] = await visionClient.labelDetection({
        image: { content: imageBuffer }
      });

      const labels: ImageLabel[] = [];

      if (result.labelAnnotations) {
        for (const label of result.labelAnnotations) {
          const imageLabel: ImageLabel = {
            id: this.generateId(),
            description: label.description || '',
            score: label.score || 0,
            confidence: label.score || 0,
            topicality: label.topicality || 0
          };

          labels.push(imageLabel);

          // Store individual label
          await adminDb
            .collection(this.COLLECTIONS.IMAGE_LABELS)
            .add({
              ...imageLabel,
              detectedAt: Timestamp.now()
            });
        }
      }

      return labels;
    } catch (error) {
      console.error('Error detecting labels:', error);
      return [];
    }
  }

  /**
   * Extract text from image
   */
  static async extractText(imageBuffer: Buffer, userId?: string): Promise<TextExtraction | undefined> {
    try {
      const [result] = await visionClient.textDetection({
        image: { content: imageBuffer }
      });

      if (result.textAnnotations && result.textAnnotations.length > 0) {
        const fullText = result.textAnnotations[0];
        
        const textExtraction: TextExtraction = {
          id: this.generateId(),
          extractedText: fullText.description || '',
          confidence: 0.9, // Default confidence
          boundingBoxes: [],
          extractedAt: Timestamp.now(),
          userId
        };

        // Extract individual word bounding boxes
        for (let i = 1; i < result.textAnnotations.length; i++) {
          const annotation = result.textAnnotations[i];
          if (annotation.boundingPoly?.vertices) {
            const vertices = annotation.boundingPoly.vertices;
            if (vertices.length >= 2) {
              textExtraction.boundingBoxes.push({
                text: annotation.description || '',
                x: vertices[0].x || 0,
                y: vertices[0].y || 0,
                width: (vertices[2]?.x || 0) - (vertices[0].x || 0),
                height: (vertices[2]?.y || 0) - (vertices[0].y || 0)
              });
            }
          }
        }

        // Store text extraction
        await adminDb
          .collection(this.COLLECTIONS.TEXT_EXTRACTIONS)
          .add(textExtraction);

        return textExtraction;
      }

      return undefined;
    } catch (error) {
      console.error('Error extracting text:', error);
      return undefined;
    }
  }

  /**
   * Get stored barcode scans for user
   */
  static async getUserBarcodes(userId: string, limit: number = 50): Promise<BarcodeResult[]> {
    try {
      const snapshot = await adminDb
        .collection(this.COLLECTIONS.BARCODES)
        .where('userId', '==', userId)
        .orderBy('extractedAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BarcodeResult[];
    } catch (error) {
      console.error('Error getting user barcodes:', error);
      return [];
    }
  }

  /**
   * Get stored text extractions for user
   */
  static async getUserTextExtractions(userId: string, limit: number = 50): Promise<TextExtraction[]> {
    try {
      const snapshot = await adminDb
        .collection(this.COLLECTIONS.TEXT_EXTRACTIONS)
        .where('userId', '==', userId)
        .orderBy('extractedAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TextExtraction[];
    } catch (error) {
      console.error('Error getting user text extractions:', error);
      return [];
    }
  }

  /**
   * Search extracted text content
   */
  static async searchExtractedText(
    query: string, 
    userId?: string,
    limit: number = 20
  ): Promise<TextExtraction[]> {
    try {
      let queryRef = adminDb
        .collection(this.COLLECTIONS.TEXT_EXTRACTIONS)
        .orderBy('extractedAt', 'desc');

      if (userId) {
        queryRef = queryRef.where('userId', '==', userId) as any;
      }

      const snapshot = await queryRef.limit(limit * 3).get(); // Get more to filter

      // Filter by text content (Firestore doesn't support full-text search)
      const results = (snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() })) as TextExtraction[])
        .filter(extraction => extraction.extractedText.toLowerCase().includes(query.toLowerCase()))
        .slice(0, limit);

      return results;
    } catch (error) {
      console.error('Error searching extracted text:', error);
      return [];
    }
  }

  /**
   * Utility functions
   */
  private static generateId(): string {
    return `ml_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static isBarcodePattern(text: string): boolean {
    // Check for common barcode patterns
    const patterns = [
      /^\d{8,}$/, // 8+ digits (EAN, UPC)
      /^\d{3}-\d{10}$/, // ISBN-10 
      /^\d{3}-\d{1}-\d{3}-\d{5}-\d{1}$/, // ISBN-13
      /^[0-9A-Z]{8,}$/, // Code 128 style
    ];

    return patterns.some(pattern => pattern.test(text.trim()));
  }

  private static determineBarcodeType(text: string): string {
    if (/^\d{8}$/.test(text)) return 'EAN-8';
    if (/^\d{13}$/.test(text)) return 'EAN-13';
    if (/^\d{12}$/.test(text)) return 'UPC-A';
    if (/^\d{8}$/.test(text)) return 'UPC-E';
    if (/^\d{3}-\d{10}$/.test(text)) return 'ISBN-10';
    if (/^\d{3}-\d{1}-\d{3}-\d{5}-\d{1}$/.test(text)) return 'ISBN-13';
    return 'CODE-128';
  }

  private static async logProcessingError(error: Error, metadata: any): Promise<void> {
    try {
      await adminDb
        .collection(this.COLLECTIONS.PROCESSING_LOGS)
        .add({
          type: 'error',
          error: error.message,
          stack: error.stack,
          metadata,
          timestamp: Timestamp.now()
        });
    } catch (logError) {
      console.error('Error logging processing error:', logError);
    }
  }
}