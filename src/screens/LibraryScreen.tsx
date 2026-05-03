// src/screens/LibraryScreen.tsx

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchScreenshots, deleteScreenshot, Screenshot } from '../lib/db';
import { ALL_CATEGORIES, CATEGORY_COLORS } from '../lib/categorizer';

export default function LibraryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const [selectedCategory, setSelectedCategory] = useState<string>(
    params.category ?? 'All'
  );
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await fetchScreenshots(
      selectedCategory === 'All' ? undefined : selectedCategory
    );
    setScreenshots(data);
  }, [selectedCategory]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  async function handleDelete(item: Screenshot) {
    Alert.alert(
      'Delete Screenshot',
      'Remove this from YaadAI? (Original in your gallery is untouched)',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const ok = await deleteScreenshot(item.id);
            if (ok) {
              setScreenshots((prev) => prev.filter((s) => s.id !== item.id));
            }
          },
        },
      ]
    );
  }

  const categories = ['All', ...ALL_CATEGORIES];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Library</Text>
        <TouchableOpacity onPress={() => router.push('/search')}>
          <Ionicons name="search-outline" size={24} color="#1A1A2E" />
        </TouchableOpacity>
      </View>

      {/* Category filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {categories.map((cat) => {
          const active = cat === selectedCategory;
          const color =
            cat === 'All'
              ? '#6C63FF'
              : (CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS] ?? '#888');
          return (
            <TouchableOpacity
              key={cat}
              style={[
                styles.tab,
                active && { backgroundColor: color, borderColor: color },
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[styles.tabText, active && { color: '#fff' }]}
                numberOfLines={1}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* List */}
      <FlatList
        data={screenshots}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={56} color="#CBD5E0" />
            <Text style={styles.emptyTitle}>No screenshots here</Text>
            <Text style={styles.emptyText}>
              Upload some screenshots to see them here
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <ScreenshotCard
            item={item}
            onDelete={() => handleDelete(item)}
            onPress={() =>
              router.push({
                pathname: '/detail',
                params: { id: item.id },
              })
            }
          />
        )}
      />
    </SafeAreaView>
  );
}

function ScreenshotCard({
  item,
  onPress,
  onDelete,
}: {
  item: Screenshot;
  onPress: () => void;
  onDelete: () => void;
}) {
  const color =
    CATEGORY_COLORS[item.category as keyof typeof CATEGORY_COLORS] ??
    '#CBD5E0';

  const date = new Date(item.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Thumbnail */}
      {item.image_url ? (
        <Image
          source={{ uri: item.image_url }}
          style={styles.thumb}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <Ionicons name="image-outline" size={28} color="#CBD5E0" />
        </View>
      )}

      {/* Content */}
      <View style={styles.cardContent}>
        <View style={[styles.badge, { backgroundColor: color + '25' }]}>
          <Text style={[styles.badgeText, { color }]}>{item.category}</Text>
        </View>
        <Text style={styles.cardText} numberOfLines={3}>
          {item.extracted_text}
        </Text>
        <Text style={styles.cardDate}>{date}</Text>
      </View>

      {/* Delete */}
      <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
        <Ionicons name="trash-outline" size={18} color="#FC8181" />
      </TouchableOpacity>
    </TouchableOpacity>
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
  tabsContainer: { backgroundColor: '#fff', maxHeight: 54 },
  tabsContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  tabText: { fontSize: 13, fontWeight: '500', color: '#555' },
  list: { padding: 12, gap: 10 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  thumb: { width: 90, height: 110 },
  thumbPlaceholder: {
    backgroundColor: '#F7F8FC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: { flex: 1, padding: 12, gap: 6 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cardText: { fontSize: 13, color: '#444', lineHeight: 18 },
  cardDate: { fontSize: 11, color: '#aaa' },
  deleteBtn: { padding: 12, justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A2E', marginTop: 12 },
  emptyText: { fontSize: 13, color: '#888', marginTop: 6, textAlign: 'center' },
});
