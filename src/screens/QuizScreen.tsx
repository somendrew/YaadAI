// src/screens/QuizScreen.tsx
// Quiz UI — topic picker → live quiz → score + spaced repetition retry

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuiz } from '../hooks/useQuiz';

const PURPLE = '#6C63FF';
const PURPLE_LIGHT = '#EEF0FF';
const GREEN = '#22C55E';
const RED = '#EF4444';

// ── Topic Picker ─────────────────────────────────────────────────────────────

function TopicPicker({
  categories,
  onSelect,
}: {
  categories: string[];
  onSelect: (topic: string) => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.topicGrid} showsVerticalScrollIndicator={false}>
      <Text style={styles.topicTitle}>Choose a Topic to Quiz</Text>
      <Text style={styles.topicSub}>
        YaadAI will generate questions from your saved notes.
      </Text>

      {/* Daily Quiz shortcut */}
      <TouchableOpacity
        style={styles.dailyBtn}
        onPress={() => onSelect('__daily__')}
        activeOpacity={0.85}
      >
        <Text style={styles.dailyEmoji}>🌅</Text>
        <View>
          <Text style={styles.dailyTitle}>Daily Quiz</Text>
          <Text style={styles.dailySub}>Mixed questions from all your notes</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={PURPLE} />
      </TouchableOpacity>

      <Text style={styles.orLabel}>Or pick a specific topic</Text>

      {categories.length === 0 ? (
        <View style={styles.noNotesBox}>
          <Text style={styles.noNotesText}>
            📭 No categorised notes found. Upload some screenshots first!
          </Text>
        </View>
      ) : (
        categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={styles.topicChip}
            onPress={() => onSelect(cat)}
            activeOpacity={0.75}
          >
            <Text style={styles.topicChipText}>{cat}</Text>
            <Ionicons name="chevron-forward" size={16} color="#888" />
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

// ── Question Card ─────────────────────────────────────────────────────────────

function QuestionCard({
  question,
  index,
  total,
  progress,
  onAnswer,
}: {
  question: NonNullable<ReturnType<typeof useQuiz>['currentQuestion']>;
  index: number;
  total: number;
  progress: number;
  onAnswer: (ans: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [fillText, setFillText] = useState('');
  const [revealed, setRevealed] = useState(false);
  const isCorrect = selected
    ? selected.trim().toLowerCase() === question.answer.trim().toLowerCase()
    : false;

  const handleSelect = (opt: string) => {
    if (revealed) return;
    setSelected(opt);
    setRevealed(true);
    setTimeout(() => onAnswer(opt), 600);
  };

  const handleFillSubmit = () => {
    if (!fillText.trim() || revealed) return;
    setSelected(fillText.trim());
    setRevealed(true);
    setTimeout(() => onAnswer(fillText.trim()), 600);
  };

  return (
    <View style={styles.cardContainer}>
      {/* Progress */}
      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>
          {index + 1} / {total}
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>

      {/* Type badge */}
      <View style={styles.typeBadge}>
        <Text style={styles.typeBadgeText}>
          {question.type === 'mcq'
            ? '🔘 Multiple Choice'
            : question.type === 'truefalse'
            ? '✅ True / False'
            : '✏️ Fill in the Blank'}
        </Text>
      </View>

      {/* Question */}
      <Text style={styles.questionText}>{question.question}</Text>

      {/* MCQ options */}
      {question.type === 'mcq' && question.options && (
        <View style={styles.optionsList}>
          {question.options.map((opt) => {
            const isThis = selected === opt;
            const correct = opt.trim().toLowerCase() === question.answer.trim().toLowerCase();
            const bg = !revealed
              ? '#fff'
              : correct
              ? GREEN + '20'
              : isThis
              ? RED + '20'
              : '#fff';
            const border = !revealed
              ? '#e0e0e0'
              : correct
              ? GREEN
              : isThis
              ? RED
              : '#e0e0e0';

            return (
              <TouchableOpacity
                key={opt}
                style={[styles.option, { backgroundColor: bg, borderColor: border }]}
                onPress={() => handleSelect(opt)}
                activeOpacity={0.75}
                disabled={revealed}
              >
                <Text style={styles.optionText}>{opt}</Text>
                {revealed && correct && (
                  <Ionicons name="checkmark-circle" size={20} color={GREEN} />
                )}
                {revealed && isThis && !correct && (
                  <Ionicons name="close-circle" size={20} color={RED} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* True/False */}
      {question.type === 'truefalse' && (
        <View style={styles.tfRow}>
          {['True', 'False'].map((opt) => {
            const isThis = selected === opt;
            const correct = opt.toLowerCase() === question.answer.toLowerCase();
            const bg = !revealed ? '#fff' : correct ? GREEN + '20' : isThis ? RED + '20' : '#fff';
            const border = !revealed ? '#e0e0e0' : correct ? GREEN : isThis ? RED : '#e0e0e0';

            return (
              <TouchableOpacity
                key={opt}
                style={[styles.tfBtn, { backgroundColor: bg, borderColor: border }]}
                onPress={() => handleSelect(opt)}
                disabled={revealed}
                activeOpacity={0.75}
              >
                <Text style={styles.tfText}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Fill in the blank */}
      {question.type === 'fillintheblank' && (
        <View style={styles.fillContainer}>
          <TextInput
            style={[
              styles.fillInput,
              revealed &&
                (isCorrect ? styles.fillCorrect : styles.fillWrong),
            ]}
            value={fillText}
            onChangeText={setFillText}
            placeholder="Type your answer…"
            placeholderTextColor="#aaa"
            editable={!revealed}
            returnKeyType="done"
            onSubmitEditing={handleFillSubmit}
          />
          {!revealed && (
            <TouchableOpacity
              style={styles.fillSubmit}
              onPress={handleFillSubmit}
              activeOpacity={0.8}
            >
              <Text style={styles.fillSubmitText}>Submit</Text>
            </TouchableOpacity>
          )}
          {revealed && (
            <Text style={[styles.correctLabel, { color: isCorrect ? GREEN : RED }]}>
              {isCorrect ? '✅ Correct!' : `❌ Answer: ${question.answer}`}
            </Text>
          )}
        </View>
      )}

      {/* Explanation (shown after answer) */}
      {revealed && (
        <View style={styles.explanationBox}>
          <Text style={styles.explanationLabel}>💡 Explanation</Text>
          <Text style={styles.explanationText}>{question.explanation}</Text>
        </View>
      )}
    </View>
  );
}

// ── Result Screen ─────────────────────────────────────────────────────────────

function ResultScreen({
  result,
  topic,
  onRetry,
  onRetryWrong,
  onHome,
}: {
  result: NonNullable<ReturnType<typeof useQuiz>['result']>;
  topic: string | null;
  onRetry: () => void;
  onRetryWrong: () => void;
  onHome: () => void;
}) {
  const emoji =
    result.score >= 80 ? '🎉' : result.score >= 50 ? '👍' : '😅';

  return (
    <ScrollView contentContainerStyle={styles.resultContainer}>
      <Text style={styles.resultEmoji}>{emoji}</Text>
      <Text style={styles.resultScore}>{result.score}%</Text>
      <Text style={styles.resultLabel}>
        {result.correct}/{result.total} correct
      </Text>
      <Text style={styles.resultTopic}>{topic}</Text>

      {result.wrongQuestions.length > 0 && (
        <View style={styles.wrongBox}>
          <Text style={styles.wrongTitle}>
            🔁 {result.wrongQuestions.length} question
            {result.wrongQuestions.length > 1 ? 's' : ''} to review
          </Text>
          {result.wrongQuestions.map((q) => (
            <Text key={q.id} style={styles.wrongItem} numberOfLines={2}>
              • {q.question}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.resultActions}>
        {result.wrongQuestions.length > 0 && (
          <TouchableOpacity style={styles.retryWrongBtn} onPress={onRetryWrong}>
            <Text style={styles.retryWrongText}>Retry Wrong Answers</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
          <Text style={styles.retryText}>New Quiz</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.homeBtn} onPress={onHome}>
          <Text style={styles.homeText}>Back to Topics</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function QuizScreen() {
  const {
    state,
    error,
    categories,
    currentQuestion,
    currentIndex,
    questions,
    result,
    selectedTopic,
    progress,
    loadCategories,
    startQuiz,
    submitAnswer,
    retryWrongAnswers,
    reset,
  } = useQuiz();

  useEffect(() => {
    loadCategories();
  }, []);

  const handleTopicSelect = (topic: string) => {
    if (topic === '__daily__') {
      // For daily quiz: pick the first category or mix
      const fallback = categories[0] ?? 'General';
      startQuiz(fallback, 7);
    } else {
      startQuiz(topic, 5);
    }
  };

  // ── Loading ──
  if (state === 'loading') {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={PURPLE} />
        <Text style={styles.loadingText}>Generating your quiz…</Text>
        <Text style={styles.loadingSub}>Reading your notes with AI</Text>
      </SafeAreaView>
    );
  }

  // ── Error ──
  if (state === 'error') {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={reset}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Finished ──
  if (state === 'finished' && result) {
    return (
      <SafeAreaView style={styles.safe}>
        <ResultScreen
          result={result}
          topic={selectedTopic}
          onRetry={reset}
          onRetryWrong={retryWrongAnswers}
          onHome={reset}
        />
      </SafeAreaView>
    );
  }

  // ── Active Quiz ──
  if (state === 'active' && currentQuestion) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView>
          <QuestionCard
            question={currentQuestion}
            index={currentIndex}
            total={questions.length}
            progress={progress}
            onAnswer={submitAnswer}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Topic Picker (idle) ──
  return (
    <SafeAreaView style={styles.safe}>
      <TopicPicker categories={categories} onSelect={handleTopicSelect} />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },

  // Topic picker
  topicGrid: { padding: 20, gap: 12 },
  topicTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a1a' },
  topicSub: { fontSize: 14, color: '#888', marginBottom: 4 },
  dailyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PURPLE_LIGHT,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: PURPLE + '30',
  },
  dailyEmoji: { fontSize: 28 },
  dailyTitle: { fontWeight: '700', color: PURPLE, fontSize: 16 },
  dailySub: { color: '#888', fontSize: 12 },
  orLabel: { fontSize: 13, color: '#aaa', textAlign: 'center', marginVertical: 4 },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#eee',
  },
  topicChipText: { fontSize: 15, color: '#1a1a1a', fontWeight: '500' },
  noNotesBox: {
    backgroundColor: '#fff8e1',
    borderRadius: 12,
    padding: 16,
  },
  noNotesText: { color: '#888', fontSize: 14, textAlign: 'center' },

  // Question card
  cardContainer: { padding: 20, gap: 16 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressLabel: { fontSize: 12, color: '#888', minWidth: 36 },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: 6, backgroundColor: PURPLE, borderRadius: 3 },
  typeBadge: {
    backgroundColor: PURPLE_LIGHT,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  typeBadgeText: { color: PURPLE, fontSize: 12, fontWeight: '600' },
  questionText: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', lineHeight: 26 },

  // MCQ options
  optionsList: { gap: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  optionText: { fontSize: 15, color: '#1a1a1a', flex: 1 },

  // True/False
  tfRow: { flexDirection: 'row', gap: 12 },
  tfBtn: {
    flex: 1,
    padding: 20,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  tfText: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },

  // Fill in blank
  fillContainer: { gap: 10 },
  fillInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    color: '#1a1a1a',
  },
  fillCorrect: { borderColor: GREEN, backgroundColor: GREEN + '10' },
  fillWrong: { borderColor: RED, backgroundColor: RED + '10' },
  fillSubmit: {
    backgroundColor: PURPLE,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  fillSubmitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  correctLabel: { fontSize: 14, fontWeight: '600' },

  // Explanation
  explanationBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  explanationLabel: { fontSize: 13, fontWeight: '700', color: '#92400E' },
  explanationText: { fontSize: 13, color: '#78350F', lineHeight: 20 },

  // Loading/Error
  loadingText: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  loadingSub: { fontSize: 13, color: '#888' },
  errorEmoji: { fontSize: 40 },
  errorText: { fontSize: 15, color: '#888', textAlign: 'center', paddingHorizontal: 32 },

  // Result
  resultContainer: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  resultEmoji: { fontSize: 64 },
  resultScore: { fontSize: 56, fontWeight: '900', color: PURPLE },
  resultLabel: { fontSize: 18, color: '#888', fontWeight: '600' },
  resultTopic: {
    fontSize: 14,
    color: '#aaa',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  wrongBox: {
    backgroundColor: '#FFF5F5',
    borderRadius: 14,
    padding: 16,
    width: '100%',
    gap: 6,
    borderWidth: 1,
    borderColor: RED + '30',
  },
  wrongTitle: { fontWeight: '700', color: RED, fontSize: 14 },
  wrongItem: { fontSize: 13, color: '#555', paddingLeft: 4 },
  resultActions: { width: '100%', gap: 10, marginTop: 8 },
  retryWrongBtn: {
    backgroundColor: RED + '15',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: RED + '40',
  },
  retryWrongText: { color: RED, fontWeight: '700', fontSize: 15 },
  retryBtn: {
    backgroundColor: PURPLE,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  homeBtn: {
    backgroundColor: '#f5f5f5',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  homeText: { color: '#555', fontWeight: '600', fontSize: 15 },
});