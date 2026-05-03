// src/screens/UploadScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOCR, ProcessingResult } from '../hooks/useOCR';
import { CATEGORY_COLORS } from '../lib/categorizer';

export default function UploadScreen() {
  const router = useRouter();
  const { isProcessing, progress, pickImages, processImages, reset } = useOCR();
  const [done, setDone] = useState(false);

  async function handlePick() {
    try {
      const assets = await pickImages();
      if (assets.length === 0) return;

      setDone(false);
      const results = await processImages(assets);
      setDone(true);

      const succeeded = results.filter((r) => r.success).length;
      const failed = results.length - succeeded;

      if (failed > 0) {
        Alert.alert(
          'Upload Complete',
          `${succeeded} screenshots saved successfully. ${failed} failed — check your Supabase connection.`
        );
      }
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Something went wrong');
    }
  }

  function handleDone() {
    reset();
    setDone(false);
    router.push('/library');
  }

  // ── Processing state ─────────────────────────────────────────
  if (isProcessing && progress) {
    const pct = Math.round((progress.current / progress.total) * 100);
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.processingTitle}>{progress.status}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {progress.current} / {progress.total}
          </Text>

          {progress.results.length > 0 && (
            <ScrollView style={styles.resultsList}>
              {progress.results.map((r, i) => (
                <ProcessedItem key={i} result={r} />
              ))}
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ── Done state ───────────────────────────────────────────────
  if (done && progress) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Upload Complete</Text>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          <View style={styles.successBadge}>
            <Ionicons name="checkmark-circle" size={48} color="#00BFA5" />
            <Text style={styles.successText}>
              {progress.results.filter((r) => r.success).length} screenshots
              saved!
            </Text>
          </View>

          <Text style={styles.sectionLabel}>What was found:</Text>
          {progress.results.map((r, i) => (
            <ProcessedItem key={i} result={r} expanded />
          ))}

          <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
            <Text style={styles.doneBtnText}>View in Library →</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.uploadMoreBtn} onPress={() => {
            reset();
            setDone(false);
          }}>
            <Text style={styles.uploadMoreText}>Upload More</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Default / picker state ───────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Screenshots</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Upload card */}
        <TouchableOpacity style={styles.uploadCard} onPress={handlePick}>
          <View style={styles.uploadIconWrap}>
            <Ionicons name="cloud-upload-outline" size={48} color="#6C63FF" />
          </View>
          <Text style={styles.uploadTitle}>Pick Screenshots</Text>
          <Text style={styles.uploadSubtitle}>
            Select up to 20 screenshots from your gallery
          </Text>
          <View style={styles.uploadButton}>
            <Text style={styles.uploadButtonText}>Choose from Gallery</Text>
          </View>
        </TouchableOpacity>

        {/* How it works */}
        <Text style={styles.howTitle}>How it works</Text>
        <Step
          num="1"
          icon="images-outline"
          title="Pick screenshots"
          desc="Select any screenshots from your phone gallery — notes, JDs, interview questions, anything."
        />
        <Step
          num="2"
          icon="text-outline"
          title="Text is extracted"
          desc="We read all the text from each image right on your device. No internet needed for this step."
        />
        <Step
          num="3"
          icon="folder-outline"
          title="Auto-categorized"
          desc="We detect the topic — DSA, System Design, Job Description, etc. — and organize it for you."
        />
        <Step
          num="4"
          icon="trash-outline"
          title="Free up space"
          desc="Once saved, you can delete the originals from your gallery and never lose the content."
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function Step({
  num,
  icon,
  title,
  desc,
}: {
  num: string;
  icon: any;
  title: string;
  desc: string;
}) {
  return (
    <View style={styles.step}>
      <View style={styles.stepNum}>
        <Text style={styles.stepNumText}>{num}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDesc}>{desc}</Text>
      </View>
    </View>
  );
}

function ProcessedItem({
  result,
  expanded = false,
}: {
  result: ProcessingResult;
  expanded?: boolean;
}) {
  const color =
    CATEGORY_COLORS[result.category as keyof typeof CATEGORY_COLORS] ??
    '#CBD5E0';

  return (
    <View style={styles.resultItem}>
      <Image source={{ uri: result.uri }} style={styles.resultThumb} />
      <View style={{ flex: 1 }}>
        <View style={[styles.categoryBadge, { backgroundColor: color + '25' }]}>
          <Text style={[styles.categoryBadgeText, { color }]}>
            {result.category}
          </Text>
        </View>
        {expanded && (
          <Text style={styles.resultText} numberOfLines={3}>
            {result.text}
          </Text>
        )}
      </View>
      <Ionicons
        name={result.success ? 'checkmark-circle' : 'close-circle'}
        size={20}
        color={result.success ? '#00BFA5' : '#FC8181'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#1A1A2E' },
  content: { padding: 16, paddingBottom: 40 },
  uploadCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: '#6C63FF',
    borderStyle: 'dashed',
  },
  uploadIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#6C63FF15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A2E', marginBottom: 8 },
  uploadSubtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 24 },
  uploadButton: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
  },
  uploadButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  howTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A2E', marginBottom: 16 },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  stepTitle: { fontSize: 14, fontWeight: '600', color: '#1A1A2E', marginBottom: 4 },
  stepDesc: { fontSize: 13, color: '#666', lineHeight: 18 },
  // Processing
  processingContainer: { flex: 1, padding: 24, alignItems: 'center', paddingTop: 60 },
  processingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A2E',
    marginTop: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: { height: 8, backgroundColor: '#6C63FF', borderRadius: 4 },
  progressText: { fontSize: 13, color: '#888', marginTop: 8, marginBottom: 24 },
  resultsList: { width: '100%' },
  // Results
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  resultThumb: { width: 52, height: 52, borderRadius: 8, backgroundColor: '#F0F0F0' },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  categoryBadgeText: { fontSize: 11, fontWeight: '600' },
  resultText: { fontSize: 12, color: '#666', lineHeight: 16 },
  // Done
  successBadge: { alignItems: 'center', marginBottom: 24, paddingTop: 16 },
  successText: { fontSize: 18, fontWeight: '600', color: '#1A1A2E', marginTop: 8 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#888', marginBottom: 12 },
  doneBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  doneBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  uploadMoreBtn: {
    borderWidth: 1,
    borderColor: '#6C63FF',
    borderRadius: 24,
    padding: 14,
    alignItems: 'center',
  },
  uploadMoreText: { color: '#6C63FF', fontWeight: '600', fontSize: 15 },
});
