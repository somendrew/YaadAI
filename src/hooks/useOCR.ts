// src/hooks/useOCR.ts
// On-device OCR using react-native-mlkit-ocr (100% free, no API key)

import { useState } from 'react';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { categorize } from '../lib/categorizer';
import { uploadImage, saveScreenshot } from '../lib/db';

export interface ProcessingResult {
  id: string;
  uri: string;
  text: string;
  category: string;
  success: boolean;
}

export interface UploadProgress {
  current: number;
  total: number;
  status: string;
  results: ProcessingResult[];
}

export function useOCR() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);

  // ── Pick images from camera roll ────────────────────────────
  async function pickImages(): Promise<ImagePicker.ImagePickerAsset[]> {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      throw new Error('Permission to access photos was denied.');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
      selectionLimit: 20, // max 20 at once
    });

    if (result.canceled) return [];
    return result.assets;
  }

  // ── Run OCR on a single image ────────────────────────────────
  async function extractText(uri: string): Promise<string> {
    try {
      const result = await TextRecognition.recognize(uri);
      return result.blocks
        .map((block) => block.text)
        .join('\n')
        .trim();
    } catch (e) {
      console.warn('OCR failed for image:', e);
      return '';
    }
  }

  // ── Process & upload multiple images ────────────────────────
  async function processImages(
    assets: ImagePicker.ImagePickerAsset[]
  ): Promise<ProcessingResult[]> {
    if (assets.length === 0) return [];

    setIsProcessing(true);
    const results: ProcessingResult[] = [];

    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];

      setProgress({
        current: i + 1,
        total: assets.length,
        status: `Reading text from image ${i + 1} of ${assets.length}...`,
        results,
      });

      // Step 1: Extract text
      const text = await extractText(asset.uri);

      setProgress({
        current: i + 1,
        total: assets.length,
        status: `Categorizing image ${i + 1} of ${assets.length}...`,
        results,
      });

      // Step 2: Categorize (free, on-device)
      const category = categorize(text);

      setProgress({
        current: i + 1,
        total: assets.length,
        status: `Uploading image ${i + 1} of ${assets.length}...`,
        results,
      });

      // Step 3: Upload image to Supabase Storage
      const fileName = `screenshot_${i}`;
      const imageUrl = await uploadImage(asset.uri, fileName);

      // Step 4: Save to database
      const saved = await saveScreenshot({
        image_url: imageUrl,
        extracted_text: text || '[No text detected]',
        category,
      });

      const result: ProcessingResult = {
        id: saved?.id ?? String(i),
        uri: asset.uri,
        text: text || '[No text detected]',
        category,
        success: !!saved,
      };

      results.push(result);

      setProgress({
        current: i + 1,
        total: assets.length,
        status:
          i === assets.length - 1
            ? 'All done!'
            : `Processed ${i + 1} of ${assets.length}`,
        results: [...results],
      });
    }

    setIsProcessing(false);
    return results;
  }

  function reset() {
    setProgress(null);
    setIsProcessing(false);
  }

  return {
    isProcessing,
    progress,
    pickImages,
    processImages,
    reset,
  };
}