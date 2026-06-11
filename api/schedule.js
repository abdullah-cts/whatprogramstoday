// Vercel Serverless Function: /api/schedule
// Handles reading and writing today's schedule to Supabase.
//
// GET  /api/schedule  → returns { date, entries } for today (Sydney time),
//                       or { date, entries: [] } if nothing is stored for today.
// POST /api/schedule  → body: { date, entries }
//                       saves schedule to Supabase.

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const tableName = process.env.SUPABASE_TABLE || 'whatprogramstoday_schedules';

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

// Returns today's date string (YYYY-MM-DD) in the Australia/Sydney timezone
function getSydneyDateString() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Australia/Sydney',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function getSupabaseConfigError() {
  if (!supabaseUrl || !supabaseKey) {
    return 'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel or your local environment.';
  }

  return null;
}

async function readScheduleByDate(date) {
  if (!supabase) {
    throw new Error(getSupabaseConfigError());
  }

  const { data, error } = await supabase
    .from(tableName)
    .select('date, entries')
    .eq('date', date)
    .limit(1);

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return { date, entries: [] };
  }

  const record = data[0];
  return {
    date: record.date,
    entries: Array.isArray(record.entries) ? record.entries : [],
  };
}

async function writeScheduleByDate(date, entries) {
  if (!supabase) {
    throw new Error(getSupabaseConfigError());
  }

  const { error: deleteError } = await supabase
    .from(tableName)
    .delete()
    .eq('date', date);

  if (deleteError) {
    throw deleteError;
  }

  const { error: insertError } = await supabase
    .from(tableName)
    .insert({ date, entries });

  if (insertError) {
    throw insertError;
  }
}

module.exports = async function handler(req, res) {
  // ── CORS headers ──────────────────────────────────────────────────────────
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ── GET ───────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const todayDate = getSydneyDateString();
      const stored = await readScheduleByDate(todayDate);
      return res.status(200).json(stored);
    } catch (error) {
      console.error('[schedule GET] Supabase error:', error);
      return res.status(500).json({ error: error.message || 'Failed to load schedule. Please try again.' });
    }
  }

  // ── POST ──────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    try {
      const { date, entries } = req.body;

      if (!date || !Array.isArray(entries)) {
        return res.status(400).json({ error: 'Invalid request. Expected { date, entries[] }.' });
      }

      if (entries.length === 0) {
        return res.status(400).json({ error: 'Cannot publish an empty schedule.' });
      }

      await writeScheduleByDate(date, entries);

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('[schedule POST] Supabase error:', error);
      return res.status(500).json({ error: error.message || 'Failed to save schedule. Please try again.' });
    }
  }

  // ── Method not allowed ────────────────────────────────────────────────────
  return res.status(405).json({ error: 'Method not allowed.' });
};
