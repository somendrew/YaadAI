// src/screens/HomeScreen.tsx
// Phase 2 update: added AI Chat and Quiz quick-action buttons

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

const PURPLE = '#6C63FF';
const PURPLE_LIGHT = '#EEF0FF';

interface Stats {
  total: number;
  categories: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ total: 0, categories: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    const { data } = await supabase
      .from('screenshots')
      .select('category')
      .eq('is_deleted', false);

    if (data) {
      const unique = new Set(data.map((r: { category: string }) => r.category));
      setStats({ total: data.length, categories: unique.size });
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello 👋</Text>
          <Text style={styles.title}>YaadAI</Text>
          <Text style={styles.subtitle}>Your personal knowledge base</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{stats.total}</Text>
            <Text style={styles.statLabel}>Notes saved</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{stats.categories}</Text>
            <Text style={styles.statLabel}>Topics</Text>
          </View>
        </View>

        {/* ── Phase 2 AI Features ── */}
        <Text style={styles.sectionTitle}>✨ AI Features</Text>

        <TouchableOpacity
          style={styles.aiCard}
          onPress={() => router.push('/chat')}
          activeOpacity={0.85}
        >
          <View style={styles.aiIconWrap}>
            <Ionicons name="chatbubble-ellipses" size={28} color={PURPLE} />
          </View>
          <View style={styles.aiCardText}>
            <Text style={styles.aiCardTitle}>Ask Your Notes</Text>
            <Text style={styles.aiCardSub}>
              Chat with AI — get answers cited from your screenshots
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={PURPLE} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.aiCard}
          onPress={() => router.push('/quiz')}
          activeOpacity={0.85}
        >
          <View style={[styles.aiIconWrap, { backgroundColor: '#FFF7ED' }]}>
            <Ionicons name="school" size={28} color="#F97316" />
          </View>
          <View style={styles.aiCardText}>
            <Text style={styles.aiCardTitle}>Quiz Me</Text>
            <Text style={styles.aiCardSub}>
              AI-generated MCQ, true/false &amp; fill-in-the-blank questions
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#F97316" />
        </TouchableOpacity>

        {/* ── Quick Actions ── */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => router.push('/upload')}
            activeOpacity={0.8}
          >
            <Ionicons name="cloud-upload-outline" size={24} color={PURPLE} />
            <Text style={styles.quickLabel}>Upload</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => router.push('/library')}
            activeOpacity={0.8}
          >
            <Ionicons name="library-outline" size={24} color={PURPLE} />
            <Text style={styles.quickLabel}>Library</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => router.push('/search')}
            activeOpacity={0.8}
          >
            <Ionicons name="search-outline" size={24} color={PURPLE} />
            <Text style={styles.quickLabel}>Search</Text>
          </TouchableOpacity>
        </View>

        {/* Tips */}
        <View style={styles.tipBox}>
          <Text style={styles.tipTitle}>💡 Tip</Text>
          <Text style={styles.tipText}>
            Upload more screenshots to improve AI answers and quiz quality. The more
            notes you save, the smarter YaadAI gets!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 20, gap: 16 },

  // Header
  header: { gap: 4, paddingTop: 8 },
  greeting: { fontSize: 14, color: '#888' },
  title: { fontSize: 32, fontWeight: '900', color: PURPLE },
  subtitle: { fontSize: 14, color: '#aaa' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: PURPLE_LIGHT,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  statNum: { fontSize: 28, fontWeight: '900', color: PURPLE },
  statLabel: { fontSize: 12, color: '#888' },

  // Section
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginTop: 4 },

  // AI cards
  aiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  aiIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: PURPLE_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiCardText: { flex: 1, gap: 3 },
  aiCardTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  aiCardSub: { fontSize: 12, color: '#888', lineHeight: 17 },

  // Quick actions
  quickGrid: { flexDirection: 'row', gap: 12 },
  quickBtn: {
    flex: 1,
    backgroundColor: PURPLE_LIGHT,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  quickLabel: { fontSize: 12, fontWeight: '600', color: PURPLE },

  // Tip
  tipBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 20,
  },
  tipTitle: { fontSize: 13, fontWeight: '700', color: '#166534' },
  tipText: { fontSize: 13, color: '#166534', lineHeight: 19 },
});