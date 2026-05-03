// src/screens/ChatScreen.tsx
// AI Q&A screen — WhatsApp-style chat UI with RAG + cited sources

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChat, ChatMessage } from '../hooks/useChat';

const PURPLE = '#6C63FF';
const PURPLE_LIGHT = '#EEF0FF';

// ── Individual message bubble ────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';

  return (
    <View
      style={[
        styles.bubbleWrapper,
        isUser ? styles.bubbleRight : styles.bubbleLeft,
      ]}
    >
      {!isUser && (
        <View style={styles.aiAvatar}>
          <Text style={styles.aiAvatarText}>Y</Text>
        </View>
      )}

      <View style={styles.bubbleColumn}>
        <View
          style={[
            styles.bubble,
            isUser ? styles.bubbleUser : styles.bubbleAI,
            msg.error && styles.bubbleError,
          ]}
        >
          {msg.loading ? (
            <View style={styles.typingRow}>
              <ActivityIndicator size="small" color={PURPLE} />
              <Text style={styles.typingText}>Searching your notes…</Text>
            </View>
          ) : (
            <Text
              style={[
                styles.bubbleText,
                isUser ? styles.bubbleTextUser : styles.bubbleTextAI,
              ]}
            >
              {msg.content}
            </Text>
          )}
        </View>

        {/* Source citations */}
        {!isUser && msg.sources && msg.sources.length > 0 && !msg.loading && (
          <View style={styles.sourcesBox}>
            <Text style={styles.sourcesLabel}>
              📎 From {msg.sources.length} note{msg.sources.length > 1 ? 's' : ''}
            </Text>
            {msg.sources.map((s, i) => (
              <Text key={s.id} style={styles.sourceItem} numberOfLines={1}>
                Note {i + 1} · {s.category}
              </Text>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

// ── Suggested starter questions ──────────────────────────────────────────────

const SUGGESTIONS = [
  'What did I save about recursion?',
  'Summarise my system design notes',
  'What are my interview tips?',
  'Explain what I know about SQL',
];

function EmptyState({ onSuggestion }: { onSuggestion: (q: string) => void }) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>🧠</Text>
      <Text style={styles.emptyTitle}>Ask anything from your notes</Text>
      <Text style={styles.emptySubtitle}>
        YaadAI searches your saved screenshots and answers based on what you've
        studied.
      </Text>
      <View style={styles.suggestionGrid}>
        {SUGGESTIONS.map((s) => (
          <TouchableOpacity
            key={s}
            style={styles.suggestionChip}
            onPress={() => onSuggestion(s)}
            activeOpacity={0.7}
          >
            <Text style={styles.suggestionText}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────

export default function ChatScreen() {
  const { messages, isLoading, sendMessage, clearChat } = useChat();
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList>(null);

  const handleSend = async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q) return;
    setInput('');
    await sendMessage(q);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>Y</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>YaadAI</Text>
            <Text style={styles.headerSub}>Ask from your notes</Text>
          </View>
        </View>
        {messages.length > 0 && (
          <TouchableOpacity onPress={clearChat} style={styles.clearBtn}>
            <Ionicons name="trash-outline" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        {messages.length === 0 ? (
          <EmptyState onSuggestion={(q) => handleSend(q)} />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => <MessageBubble msg={item} />}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: true })
            }
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Input bar */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask from your notes…"
            placeholderTextColor="#aaa"
            multiline
            returnKeyType="send"
            onSubmitEditing={() => handleSend()}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!input.trim() || isLoading) && styles.sendBtnDisabled,
            ]}
            onPress={() => handleSend()}
            disabled={!input.trim() || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  flex: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  headerSub: { fontSize: 12, color: '#888' },
  clearBtn: { padding: 8 },

  // Message list
  messageList: { padding: 16, paddingBottom: 8, gap: 12 },

  // Bubble
  bubbleWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 4,
  },
  bubbleLeft: { justifyContent: 'flex-start' },
  bubbleRight: { justifyContent: 'flex-end' },
  bubbleColumn: { flexShrink: 1, gap: 4 },

  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  aiAvatarText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleUser: {
    backgroundColor: PURPLE,
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
  },
  bubbleAI: {
    backgroundColor: PURPLE_LIGHT,
    borderBottomLeftRadius: 4,
    alignSelf: 'flex-start',
  },
  bubbleError: { backgroundColor: '#FFF0F0' },

  bubbleText: { fontSize: 15, lineHeight: 22 },
  bubbleTextUser: { color: '#fff' },
  bubbleTextAI: { color: '#1a1a1a' },

  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typingText: { color: '#888', fontSize: 13 },

  // Sources
  sourcesBox: {
    alignSelf: 'flex-start',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 8,
    gap: 2,
    maxWidth: '82%',
  },
  sourcesLabel: { fontSize: 11, color: '#888', fontWeight: '600' },
  sourceItem: { fontSize: 11, color: PURPLE },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  suggestionGrid: { width: '100%', gap: 8, marginTop: 8 },
  suggestionChip: {
    backgroundColor: PURPLE_LIGHT,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: PURPLE + '30',
  },
  suggestionText: { color: PURPLE, fontSize: 13, fontWeight: '500' },

  // Input bar
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 16 : 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: '#1a1a1a',
    maxHeight: 100,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#ccc' },
});