// src/screens/HomeScreen.js
// Main screen: shows today's habits as bold color cards with check-off and streaks.

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  fetchHabits,
  fetchCheckIns,
  checkInHabit,
  removeCheckIn,
} from '../data/habits';
import { signOut } from '../data/auth';

const TODAY = new Date().toISOString().split('T')[0];

// Rotating bold colors for habit cards, matching reference app style
const CARD_COLORS = ['#22C55E', '#EF4444', '#3B82F6', '#F97316', '#8B5CF6'];

function calculateStreak(checkIns) {
  if (!checkIns.length) return 0;
  const dates = new Set(checkIns.map((c) => c.completed_on));
  let streak = 0;
  let cursor = new Date();
  while (true) {
    const dateStr = cursor.toISOString().split('T')[0];
    if (dates.has(dateStr)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function HabitCard({ habit, color, checkedToday, streak, onToggle }) {
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: color }]}
      onPress={onToggle}
      activeOpacity={0.85}
    >
      <View style={styles.cardLeft}>
        <Text style={styles.cardIcon}>{habit.icon}</Text>
        <View>
          <Text style={styles.cardTitle}>{habit.name}</Text>
          {streak > 0 && (
            <Text style={styles.cardStreak}>🔥 {streak} day streak</Text>
          )}
        </View>
      </View>
      <View style={[styles.checkCircle, checkedToday && styles.checkCircleActive]}>
        {checkedToday && <Text style={styles.checkMark}>✓</Text>}
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ onAddHabit, onSignedOut }) {
  const [habits, setHabits] = useState([]);
  const [checkInsByHabit, setCheckInsByHabit] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const habitList = await fetchHabits();
      setHabits(habitList);

      const checkInsMap = {};
      for (const habit of habitList) {
        checkInsMap[habit.id] = await fetchCheckIns(habit.id);
      }
      setCheckInsByHabit(checkInsMap);
    } catch (err) {
      Alert.alert('Error loading habits', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleToggle(habit) {
    const checkIns = checkInsByHabit[habit.id] || [];
    const checkedToday = checkIns.some((c) => c.completed_on === TODAY);

    try {
      if (checkedToday) {
        await removeCheckIn(habit.id, TODAY);
      } else {
        await checkInHabit(habit.id, TODAY);
      }
      await loadData();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }

  function handleRefresh() {
    setRefreshing(true);
    loadData();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Today</Text>
          <Text style={styles.headerDate}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>
        <TouchableOpacity onPress={() => signOut().then(onSignedOut)}>
          <Text style={styles.signOut}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No habits yet.</Text>
              <Text style={styles.emptySubtext}>
                Tap the + button below to add your first one.
              </Text>
            </View>
          )
        }
        renderItem={({ item, index }) => {
          const checkIns = checkInsByHabit[item.id] || [];
          const checkedToday = checkIns.some((c) => c.completed_on === TODAY);
          const streak = calculateStreak(checkIns);
          return (
            <HabitCard
              habit={item}
              color={CARD_COLORS[index % CARD_COLORS.length]}
              checkedToday={checkedToday}
              streak={streak}
              onToggle={() => handleToggle(item)}
            />
          );
        }}
      />

      <TouchableOpacity style={styles.fab} onPress={onAddHabit}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  headerDate: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  signOut: {
    color: '#93C5FD',
    fontSize: 14,
    marginTop: 8,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  card: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardStreak: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.85,
    marginTop: 2,
  },
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleActive: {
    backgroundColor: '#FFFFFF',
  },
  checkMark: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 36,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
  fabText: {
    fontSize: 30,
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: -2,
  },
  emptyState: {
    marginTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtext: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
});