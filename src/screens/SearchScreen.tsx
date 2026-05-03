// src/screens/SearchScreen.tsx

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { searchScreenshots, Screenshot } from '../lib/db';
import { CATEGORY_COLORS } from '../lib/categorizer';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Screenshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async (text: string) => {
    setQuery(text);
    if (text.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    const data = await searchScreenshots(text.trim());
    setResults(data);
    setSearched(true);
    setLoading(false);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with search bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#888" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search your notes..."
            placeholderTextColor="#aaa"
            value={query}
            onChangeText={handleSearch}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={18} color="#aaa" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator color="#6C63FF" />
        </View>
      )}

      {/* Results */}
      {!loading && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            searched ? (
              <View style={styles.centered}>
                <Ionicons name="search-outline" size={48} color="#CBD5E0" />
                <Text style={styles.emptyText}>
                  No results for "{query}"
                </Text>
                <Text style={styles.emptySubText}>
                  Try different keywords
                </Text>
              </View>
            ) : (
              <View style={styles.centered}>
                <Ionicons name="text-outline" size={48} color="#CBD5E0" />
                <Text style={styles.emptyText}>Search your saved notes</Text>
                <Text style={styles.emptySubText}>
                  Type anything — code, questions, job requirements...
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <SearchResult
              item={item}
              query={query}
              onPress={() =>
                router.push({ pathname: '/detail', params: { id: item.id } })
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function SearchResult({
  item,
  query,
  onPress,
}: {
  item: Screenshot;
  query: string;
  onPress: () => void;
}) {
  const color =
    CATEGORY_COLORS[item.category as keyof typeof CATEGORY_COLORS] ?? '#CBD5E0';

  // Highlight matching text
  function renderHighlighted(text: string) {
    if (!query) return <Text style={styles.resultText}>{text}</Text>;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <Text style={styles.resultText}>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <Text key={i} style={styles.highlight}>
              {part}
            </Text>
          ) : (
            part
          )
        )}
      </Text>
    );
  }

  // Find the snippet around the first match
  const lowerText = item.extracted_text.toLowerCase();
  const matchIdx = lowerText.indexOf(query.toLowerCase());
  const snippetStart = Math.max(0, matchIdx - 60);
  const snippet = item.extracted_text.slice(snippetStart, snippetStart + 200);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <Ionicons name="image-outline" size={24} color="#CBD5E0" />
        </View>
      )}
      <View style={styles.cardContent}>
        <View style={[styles.badge, { backgroundColor: color + '25' }]}>
          <Text style={[styles.badgeText, { color }]}>{item.category}</Text>
        </View>
        {renderHighlighted(snippet)}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8FC',
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
    height: 42,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#1A1A2E' },
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
  thumb: { width: 80, height: 100 },
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
  resultText: { fontSize: 13, color: '#444', lineHeight: 18 },
  highlight: {
    backgroundColor: '#FEF08A',
    color: '#92400E',
    fontWeight: '600',
  },
  centered: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubText: { fontSize: 13, color: '#888', marginTop: 6, textAlign: 'center' },
});
