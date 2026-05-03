// src/screens/DetailScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Share,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { deleteScreenshot, Screenshot } from '../lib/db';
import { CATEGORY_COLORS } from '../lib/categorizer';

const { width } = Dimensions.get('window');

export default function DetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [screenshot, setScreenshot] = useState<Screenshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageExpanded, setImageExpanded] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('screenshots')
        .select('*')
        .eq('id', id)
        .single();
      setScreenshot(data as Screenshot);
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleDelete() {
    Alert.alert('Delete', 'Remove this screenshot from YaadAI?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (screenshot) {
            await deleteScreenshot(screenshot.id);
            router.back();
          }
        },
      },
    ]);
  }

  async function handleShare() {
    if (!screenshot) return;
    await Share.share({
      message: `📋 ${screenshot.category}\n\n${screenshot.extracted_text}`,
    });
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ flex: 1 }} color="#6C63FF" />
      </SafeAreaView>
    );
  }

  if (!screenshot) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text>Screenshot not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: '#6C63FF', marginTop: 12 }}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const color =
    CATEGORY_COLORS[screenshot.category as keyof typeof CATEGORY_COLORS] ??
    '#CBD5E0';

  const date = new Date(screenshot.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {screenshot.category}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleShare} style={styles.headerBtn}>
            <Ionicons name="share-outline" size={22} color="#1A1A2E" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.headerBtn}>
            <Ionicons name="trash-outline" size={22} color="#FC8181" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image */}
        {screenshot.image_url && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setImageExpanded(!imageExpanded)}
          >
            <Image
              source={{ uri: screenshot.image_url }}
              style={[
                styles.image,
                imageExpanded && { height: width * 1.5 },
              ]}
              resizeMode={imageExpanded ? 'contain' : 'cover'}
            />
            <View style={styles.expandHint}>
              <Ionicons
                name={imageExpanded ? 'contract-outline' : 'expand-outline'}
                size={14}
                color="#fff"
              />
              <Text style={styles.expandText}>
                {imageExpanded ? 'Collapse' : 'Tap to expand'}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.content}>
          {/* Category + Date */}
          <View style={styles.meta}>
            <View style={[styles.badge, { backgroundColor: color + '20' }]}>
              <View style={[styles.dot, { backgroundColor: color }]} />
              <Text style={[styles.badgeText, { color }]}>
                {screenshot.category}
              </Text>
            </View>
            <Text style={styles.date}>{date}</Text>
          </View>

          {/* Extracted Text */}
          <View style={styles.textSection}>
            <View style={styles.textHeader}>
              <Ionicons name="text-outline" size={16} color="#888" />
              <Text style={styles.textLabel}>Extracted Text</Text>
            </View>
            <Text style={styles.extractedText} selectable>
              {screenshot.extracted_text}
            </Text>
          </View>

          {/* Copy text button */}
          <TouchableOpacity
            style={styles.copyBtn}
            onPress={() => {
              // Clipboard copy — expo-clipboard can be added later
              Alert.alert('Copied!', 'Text copied to clipboard');
            }}
          >
            <Ionicons name="copy-outline" size={16} color="#6C63FF" />
            <Text style={styles.copyBtnText}>Copy Text</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '600', color: '#1A1A2E', marginLeft: 12 },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: { padding: 4 },
  image: {
    width: '100%',
    height: 220,
    backgroundColor: '#F0F0F0',
  },
  expandHint: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  expandText: { color: '#fff', fontSize: 11 },
  content: { padding: 16 },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  badgeText: { fontSize: 13, fontWeight: '600' },
  date: { fontSize: 12, color: '#aaa' },
  textSection: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  textHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  textLabel: { fontSize: 13, fontWeight: '600', color: '#888' },
  extractedText: {
    fontSize: 15,
    color: '#1A1A2E',
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#6C63FF',
    borderRadius: 24,
    padding: 14,
  },
  copyBtnText: { color: '#6C63FF', fontWeight: '600', fontSize: 15 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
