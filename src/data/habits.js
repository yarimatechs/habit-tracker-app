// src/data/habits.js
// CRUD functions for habits and check-ins, backed by Supabase.

import { supabase } from '../lib/supabase';

// Fetch all habits for the current user (not archived)
export async function fetchHabits() {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('archived', false)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

// Add a new habit
export async function addHabit({ name, icon = '✅', color = '#4F46E5', frequency = 'daily' }) {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;

  const { data, error } = await supabase
    .from('habits')
    .insert([{ name, icon, color, frequency, user_id: userId }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Delete (archive) a habit instead of hard-deleting, so history is kept
export async function archiveHabit(habitId) {
  const { error } = await supabase
    .from('habits')
    .update({ archived: true })
    .eq('id', habitId);

  if (error) throw error;
}

// Fetch all check-ins for a given habit
export async function fetchCheckIns(habitId) {
  const { data, error } = await supabase
    .from('check_ins')
    .select('*')
    .eq('habit_id', habitId)
    .order('completed_on', { ascending: true });

  if (error) throw error;
  return data;
}

// Mark a habit as done for a specific date (defaults to today)
export async function checkInHabit(habitId, date = new Date().toISOString().split('T')[0]) {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;

  const { data, error } = await supabase
    .from('check_ins')
    .insert([{ habit_id: habitId, user_id: userId, completed_on: date }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Undo a check-in for a specific date (in case of a mis-tap)
export async function removeCheckIn(habitId, date) {
  const { error } = await supabase
    .from('check_ins')
    .delete()
    .eq('habit_id', habitId)
    .eq('completed_on', date);

  if (error) throw error;
}