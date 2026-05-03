// src/screens/HomeScreen.tsx

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getCategoryCounts } from '../lib/db';
import { CATEGORY_COLORS } from '../lib/categorizer';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    const data = await getCategoryCounts();
    setCounts(data);
    setTotal(Object.values(data).reduce((a, b) => a + b, 0));
  }, []);

  useEffect(() => {
    loadStats();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const topCategories = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6C63FF" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>YaadAI</Text>
          <Text style={styles.tagline}>Your screenshots, remembered</Text>
        </View>
        <TouchableOpacity
          style={styles.uploadBtn}
          onPress={() => router.push('/upload')}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{total}</Text>
            <Text style={styles.statLabel}>Screenshots saved</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {Object.keys(counts).length}
            </Text>
            <Text style={styles.statLabel}>Topics found</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Quizzes done</Text>
          </View>
        </View>

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <QuickAction
            icon="images-outline"
            label="Upload"
            color="#6C63FF"
            onPress={() => router.push('/upload')}
          />
          <QuickAction
            icon="library-outline"
            label="Library"
            color="#00BFA5"
            onPress={() => router.push('/library')}
          />
          <QuickAction
            icon="search-outline"
            label="Search"
            color="#FF6B35"
            onPress={() => router.push('/search')}
          />
        </View>

        {/* Top categories */}
        {topCategories.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Your Topics</Text>
            {topCategories.map(([category, count]) => (
              <TouchableOpacity
                key={category}
                style={styles.categoryRow}
                onPress={() =>
                  router.push({ pathname: '/library', params: { category } })
                }
              >
                <View
                  style={[
                    styles.categoryDot,
                    {
                      backgroundColor:
                        CATEGORY_COLORS[
                          category as keyof typeof CATEGORY_COLORS
                        ] ?? '#CBD5E0',
                    },
                  ]}
                />
                <Text style={styles.categoryName}>{category}</Text>
                <Text style={styles.categoryCount}>
                  {count} {count === 1 ? 'note' : 'notes'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#aaa" />
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Empty state */}
        {total === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={64} color="#CBD5E0" />
            <Text style={styles.emptyTitle}>No screenshots yet</Text>
            <Text style={styles.emptyText}>
              Tap the + button to upload your first screenshot
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push('/upload')}
            >
              <Text style={styles.emptyBtnText}>Upload Screenshots</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickAction({
  icon,
  label,
  color,
  onPress,
}: {
  icon: any;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionCard} onPress={onPress}>
      <View style={[styles.actionIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FC' },
  header: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appName: { fontSize: 26, fontWeight: '700', color: '#fff' },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  uploadBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 28, fontWeight: '700', color: '#1A1A2E' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  statDivider: { width: 1, backgroundColor: '#F0F0F0' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: { fontSize: 13, fontWeight: '500', color: '#444' },
  categoryRow: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryDot: { width: 12, height: 12, borderRadius: 6 },
  categoryName: { flex: 1, fontSize: 14, fontWeight: '500', color: '#1A1A2E' },
  categoryCount: { fontSize: 13, color: '#888' },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A2E',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  emptyBtn: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 24,
  },
  emptyBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
