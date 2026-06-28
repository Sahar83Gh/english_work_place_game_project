import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  RadialBarChart, RadialBar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import * as XLSX from 'xlsx';
import {
  Key, Play, Pause, Check, X, Download, Bell, MessageSquare, Sparkles, Send, Volume2,
  Trophy, Clock, Plus, Trash2, Edit3, Search, FileSpreadsheet, User, LogOut, AlertCircle,
  CheckCircle2, XCircle, RotateCcw, BookOpen, Lock, Globe, Settings, Users, BarChart3,
  ThumbsUp, ThumbsDown, ShieldCheck, Mail, Minus, Square, PartyPopper, CalendarCheck, Megaphone
} from 'lucide-react';

/* ============================================================
   فونت‌ها و دیزاین‌سیستم «نئو-برutalism کمیک» — مطابق گرافیک ارسالی
   ============================================================ */
function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Vazirmatn:wght@400;500;600;700;800&display=swap');
      .font-fa { font-family: 'Vazirmatn', Tahoma, sans-serif; }
      .font-fun { font-family: 'Baloo 2', 'Vazirmatn', sans-serif; }
    `}</style>
  );
}
const INK = '#0f172a';
function neoShadow(n) { return `${n}px ${n}px 0 0 ${INK}`; }

function WindowBar({ icon, title, tone = '#ffffff', dotBg = 'bg-white/90' }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 border-b-[3px] border-slate-900">
      <div className="flex items-center gap-2 text-sm font-black font-fun" style={{ color: tone }}>
        <span className={`w-6 h-6 rounded-full ${dotBg} border-2 border-slate-900 flex items-center justify-center`}>{icon}</span>
        <span>{title}</span>
      </div>
      <div className="flex gap-1.5 items-center opacity-80" style={{ color: tone }}>
        <Minus size={14} strokeWidth={3} />
        <Square size={11} strokeWidth={3} />
        <XCircle size={16} strokeWidth={2.5} />
      </div>
    </div>
  );
}

/* ============================================================
   ماژول ۱: ذخیره‌سازی و داده‌های اولیه
   ============================================================ */
const SK = {
  BANK: 'app:questionBank',
  SETTINGS: 'app:settings',
  PROPOSALS: 'app:proposals',
  LOGS: 'app:answerLogs',
  CHAT: 'app:chatMessages',
  USER: (u) => `app:user:${u}`,
};

// ====== کاربران نمونه (برای لاگین و ذخیره‌سازی) ======
const SAMPLE_USERS = {
  alireza: { password: '123', role: 'user', displayName: 'علیرضا محمدی' },
  sara: { password: '123', role: 'user', displayName: 'سارا احمدی' },
  mohammad: { password: '123', role: 'user', displayName: 'محمد کریمی' },
  admin: { password: 'admin', role: 'admin', displayName: 'مدیر سیستم' },
  manager: { password: 'manager', role: 'manager', displayName: 'مدیر ارشد' },
};

const DEFAULT_SETTINGS = {
  stagesPerDay: 1,
  questionsPerStage: 5,
  startHour: 8,
  endHour: 17,
  latePenalty: 20,
  basePoints: 10,
  tierThreshold: 3,
  bonusPoints: 50,
  chatEnabled: false,
  questionProposalEnabled: false,
  aiAssistantEnabled: true,
  leaderboardEnabled: true,
  reminderEnabled: true,
  reminderHour: 16,
};

const TOPICS = ['ایمیل اداری', 'جلسات کاری', 'گزارش‌نویسی', 'مذاکره', 'عمومی محیط‌کار'];

function uid(prefix = 'q') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

const DEFAULT_BANK = [
  { id: uid(), type: 'grammarFix', difficulty: 'easy', topic: 'ایمیل اداری',
    sentence: 'The meeting [start] at 10 AM every day.', wrong: 'start', correct: 'starts',
    explanation: 'فعل با فاعل سوم‌شخص مفرد (the meeting) باید s بگیرد: starts.' },
  { id: uid(), type: 'grammarFix', difficulty: 'medium', topic: 'گزارش‌نویسی',
    sentence: 'She [have] finished the report before the deadline.', wrong: 'have', correct: 'has',
    explanation: 'با فاعل سوم‌شخص مفرد (she) از has استفاده می‌شود نه have.' },
  { id: uid(), type: 'collocation', difficulty: 'easy', topic: 'جلسات کاری',
    keyword: 'Pay', options: ['attention', 'a compliment', 'a visit', 'an effort'], correct: 'attention',
    explanation: 'هم‌نشینی درست: Pay attention (توجه کردن).' },
  { id: uid(), type: 'collocation', difficulty: 'medium', topic: 'مذاکره',
    keyword: 'Make', options: ['a decision', 'a research', 'an advice', 'a homework'], correct: 'a decision',
    explanation: 'هم‌نشینی درست: Make a decision (تصمیم گرفتن).' },
  { id: uid(), type: 'scramble', difficulty: 'medium', topic: 'گزارش‌نویسی',
    words: ['must', 'by Friday', 'we', 'submit', 'the', 'report'],
    correctOrder: ['we', 'must', 'submit', 'the', 'report', 'by Friday'],
    explanation: 'ترتیب درست: فاعل + فعل کمکی + فعل + مفعول + قید زمان.' },
  { id: uid(), type: 'scramble', difficulty: 'hard', topic: 'مذاکره',
    words: ['could', 'extend', 'the deadline', 'you', 'please'],
    correctOrder: ['could', 'you', 'please', 'extend', 'the deadline'],
    explanation: 'برای درخواست محترمانه: Could you please + فعل...' },
  { id: uid(), type: 'oddOneOut', difficulty: 'medium', topic: 'مذاکره',
    options: ['Approve', 'Confirm', 'Refuse', 'Validate'], oddOne: 'Refuse',
    explanation: 'سه کلمه‌ی دیگر به معنای «تأیید کردن» هستند؛ Refuse یعنی «رد کردن».' },
  { id: uid(), type: 'oddOneOut', difficulty: 'easy', topic: 'عمومی محیط‌کار',
    options: ['Manager', 'Colleague', 'Deadline', 'Employee'], oddOne: 'Deadline',
    explanation: 'سه کلمه‌ی دیگر به افراد اشاره دارند؛ Deadline یک زمان است نه شخص.' },
  { id: uid(), type: 'syllable', difficulty: 'hard', topic: 'عمومی محیط‌کار',
    word: 'Develop', syllables: ['De', 've', 'lop'], stressedIndex: 1,
    explanation: 'در Develop، هجای دوم (ve) با تکیه‌ی بیشتری ادا می‌شود.' },
  { id: uid(), type: 'syllable', difficulty: 'hard', topic: 'عمومی محیط‌کار',
    word: 'Communication', syllables: ['Com', 'mu', 'ni', 'ca', 'tion'], stressedIndex: 3,
    explanation: 'تکیه‌ی اصلی روی هجای چهارم (ca) قرار دارد.' },
  { id: uid(), type: 'aiGuess', difficulty: 'medium', topic: 'گزارش‌نویسی',
    word: 'Deadline', definition: 'It is a time by which something must be done.',
    explanation: 'Deadline یعنی مهلت یا سر‌رسید انجام کار.' },
  { id: uid(), type: 'aiGuess', difficulty: 'medium', topic: 'مذاکره',
    word: 'Feedback', definition: 'Information or opinions about how well something was done, used to improve it.',
    explanation: 'Feedback یعنی بازخورد یا نظر درباره‌ی عملکرد.' },
  { id: uid(), type: 'fillblank', difficulty: 'easy', topic: 'ایمیل اداری',
    sentence: 'Please find the report ____ to this email.', answer: 'attached',
    explanation: 'عبارت رایج: find ... attached (ضمیمه شده).' },
  { id: uid(), type: 'fillblank', difficulty: 'medium', topic: 'جلسات کاری',
    sentence: 'Let’s ____ the meeting to next Monday.', answer: 'postpone',
    explanation: 'Postpone یعنی به تعویق انداختن.' },
  { id: uid(), type: 'image', difficulty: 'easy', topic: 'عمومی محیط‌کار',
    emoji: '⏰', options: ['Deadline', 'Vacation', 'Salary', 'Coffee'], correct: 'Deadline',
    explanation: 'ساعت یادآور مهلت (Deadline) یک کار است.' },
  { id: uid(), type: 'image', difficulty: 'easy', topic: 'ایمیل اداری',
    emoji: '📎', options: ['Attachment', 'Discount', 'Holiday', 'Salary'], correct: 'Attachment',
    explanation: 'گیره‌کاغذ نشان‌دهنده‌ی فایل پیوست (Attachment) است.' },
  { id: uid(), type: 'mc', difficulty: 'easy', topic: 'جلسات کاری',
    question: 'Choose the correct sentence:',
    options: ['He don’t agree with the plan.', 'He doesn’t agrees with the plan.', 'He doesn’t agree with the plan.', 'He not agree with the plan.'],
    correct: 'He doesn’t agree with the plan.',
    explanation: 'با فاعل سوم‌شخص مفرد، فعل کمکی منفی doesn’t است و فعل اصلی بدون s می‌آید.' },
  { id: uid(), type: 'mc', difficulty: 'medium', topic: 'گزارش‌نویسی',
    question: 'Which word best completes: "We need to ____ the budget for next quarter."',
    options: ['revise', 'rise', 'raise', 'arise'],
    correct: 'revise',
    explanation: 'Revise the budget یعنی بازبینی/اصلاح بودجه.' },
];

async function loadKey(key, shared, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) { /* ignore */ }
  return fallback;
}

async function saveKey(key, value, shared) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) { /* ignore */ }
}

async function askAI(prompt) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await response.json();
    const text = (data.content || []).map((c) => c.text || '').filter(Boolean).join('\n');
    return text || null;
  } catch (e) {
    return null;
  }
}

function exportExcel(rows, filename, sheetName) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName || 'Report');
  XLSX.writeFile(wb, filename);
}

/* ============================================================
   ماژول ۲: توابع کمکی و اتم‌های UI (نئو-برutalism)
   ============================================================ */
function todayStr(d = new Date()) { return d.toISOString().slice(0, 10); }
function diffDays(a, b) { return Math.round((new Date(b) - new Date(a)) / 86400000); }

function ToggleSwitch({ checked, onChange, disabled }) {
  return (
    <button type="button" onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-7 w-12 items-center rounded-full border-[3px] border-slate-900 shadow-[2px_2px_0_0_#0f172a] transition-colors shrink-0 ${checked ? 'bg-emerald-400' : 'bg-slate-300'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white border-[2px] border-slate-900 transition-transform ${checked ? '-translate-x-0.5' : '-translate-x-6'}`} />
    </button>
  );
}

function Badge({ children, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-200 text-slate-900',
    pink: 'bg-pink-300 text-pink-950',
    green: 'bg-emerald-300 text-emerald-950',
    amber: 'bg-amber-300 text-amber-950',
    blue: 'bg-blue-300 text-blue-950',
    red: 'bg-red-300 text-red-950',
    purple: 'bg-fuchsia-300 text-fuchsia-950',
  };
  return <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] tracking-wide ${tones[tone]}`}>{children}</span>;
}

function ProgressBar({ value, max, colorClass = 'bg-emerald-400' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="w-full h-3.5 bg-white rounded-full overflow-hidden border-[2px] border-slate-900">
      <div className={`h-full ${colorClass} transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function NeoButton({ children, onClick, className = '', color = 'bg-amber-300 text-amber-950', disabled, type = 'button' }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`font-fun font-extrabold rounded-xl border-[3px] border-slate-900 shadow-[4px_4px_0_0_#0f172a] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#0f172a] active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:translate-y-0 disabled:shadow-[4px_4px_0_0_#0f172a] ${color} ${className}`}>
      {children}
    </button>
  );
}

/* ============================================================
   ماژول ۳: احراز هویت (AUTHENTICATION MODULE) با کاربران نمونه
   ============================================================ */
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();
    if (!trimmedUsername || !trimmedPassword) {
      setError('نام کاربری و رمز عبور را وارد کنید.');
      return;
    }

    // چک کردن کاربران نمونه
    const user = SAMPLE_USERS[trimmedUsername.toLowerCase()];
    if (!user) {
      setError('کاربر یافت نشد. از نام‌های نمونه استفاده کنید: alireza, sara, mohammad, admin, manager');
      return;
    }
    if (user.password !== trimmedPassword) {
      setError('رمز عبور اشتباه است.');
      return;
    }

    setBusy(true);
    setError('');
    setTimeout(() => {
      setBusy(false);
      onLogin(trimmedUsername.toLowerCase(), user.role);
    }, 500);
  }

  return (
    <div className="min-h-[640px] w-full flex items-center justify-center p-4 relative overflow-hidden bg-teal-500 font-fa">
      <GlobalStyle />
      <div className="absolute top-0 left-0 w-64 h-64 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-x-1/3 translate-y-1/3" />

      <div className="w-full max-w-sm bg-teal-300 border-[4px] border-slate-900 rounded-3xl p-7 shadow-[8px_8px_0_0_#0f172a] relative z-10">
        <div className="flex flex-col items-center mb-6">
          <div className="mx-auto w-20 h-20 bg-yellow-400 rounded-full border-[4px] border-slate-900 flex items-center justify-center shadow-[4px_4px_0_0_#0f172a] mb-3 relative">
            <Key size={36} className="text-slate-900 -rotate-45" strokeWidth={2.5} />
            <Sparkles size={20} className="text-white absolute -top-1 -right-1" fill="white" />
          </div>
          <h1 className="text-slate-900 font-black text-2xl tracking-wide font-fun drop-shadow-[2px_2px_0_#ffffff80]">English@Work</h1>
          <p className="text-teal-950/70 text-xs mt-1 font-bold">آموزش زبان انگلیسی کاربردی محیط‌کار</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3" dir="rtl">
          <div>
            <label className="text-teal-950 text-xs mb-1 block font-extrabold">نام کاربری</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="alireza / sara / mohammad / admin / manager"
              className="w-full rounded-xl px-3 py-2.5 bg-white text-slate-900 placeholder-slate-400 outline-none border-[3px] border-slate-900 shadow-[3px_3px_0_0_#0f172a] focus:translate-y-0.5 focus:shadow-[1px_1px_0_0_#0f172a] transition-all font-bold" />
          </div>
          <div>
            <label className="text-teal-950 text-xs mb-1 block font-extrabold">رمز عبور</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="رمز عبور (نمونه: 123 یا admin یا manager)"
              className="w-full rounded-xl px-3 py-2.5 bg-white text-slate-900 placeholder-slate-400 outline-none border-[3px] border-slate-900 shadow-[3px_3px_0_0_#0f172a] focus:translate-y-0.5 focus:shadow-[1px_1px_0_0_#0f172a] transition-all font-bold" />
          </div>
          {error && <p className="text-red-700 bg-red-100 border-2 border-red-700 rounded-lg px-2 py-1.5 text-xs flex items-center gap-1 font-bold"><AlertCircle size={14} />{error}</p>}
          <button disabled={busy} type="submit"
            className="w-full mt-2 py-3 bg-orange-500 text-slate-900 font-black text-lg rounded-xl border-[3px] border-slate-900 shadow-[6px_6px_0_0_#0f172a] hover:translate-y-1 hover:shadow-[2px_2px_0_0_#0f172a] transition-all active:shadow-none disabled:opacity-60 font-fun tracking-wide">
            {busy ? 'در حال ورود...' : "Enter Today's Challenge"}
          </button>
        </form>
        <p className="text-center text-teal-950/70 text-[11px] mt-5 flex items-center justify-center gap-1 font-bold">
          <Lock size={12} /> دسترسی فقط از طریق شبکه داخلی شرکت
        </p>
        <p className="text-center text-teal-950/50 text-[10px] mt-1 font-semibold">کاربران نمونه: alireza, sara, mohammad, admin, manager</p>
      </div>
    </div>
  );
}

/* ============================================================
   ماژول ۴: نوار بالا و تب‌ها (مشترک بین نقش‌ها)
   ============================================================ */
function TopBar({ username, role, points, onLogout, dailyDone, dailyTotal, paused, onTogglePause, showPause }) {
  const roleLabel = { user: 'کاربر', admin: 'ادمین', manager: 'مدیر' }[role];
  const displayName = SAMPLE_USERS[username]?.displayName || username;
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-blue-600 border-b-[4px] border-slate-900 sticky top-0 z-20 font-fa shadow-md">
      <div className="flex items-center gap-2">
        <div className="bg-white text-blue-600 font-black px-3 py-1.5 rounded-xl border-[3px] border-slate-900 font-fun text-sm">App App</div>
        <div className="hidden sm:flex flex-col leading-tight">
          <span className="font-black text-xs text-white tracking-tight">بازی روزانه</span>
          <span className="text-[10px] text-blue-100 font-bold">{dailyDone}/{dailyTotal} سوال</span>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1 bg-yellow-300 text-amber-950 px-3 py-1.5 rounded-full text-sm font-black border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a]">
          <Trophy size={16} fill="currentColor" /> {points}
        </div>
        {showPause && (
          <button onClick={onTogglePause}
            className="flex items-center gap-1 text-xs font-extrabold px-3 py-1.5 rounded-xl bg-white text-slate-900 border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] hover:translate-y-0.5 hover:shadow-none transition tracking-wide">
            {paused ? <Play size={14} /> : <Pause size={14} />} {paused ? 'ادامه' : 'توقف'}
          </button>
        )}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-white font-bold">
          <User size={14} /> {displayName} <Badge tone="amber">{roleLabel}</Badge>
        </div>
        <button onClick={onLogout} className="p-1.5 bg-red-500 text-white border-2 border-slate-900 rounded-lg hover:bg-red-400 shadow-[2px_2px_0_0_#0f172a] active:translate-y-0.5 active:shadow-none transition" title="خروج"><LogOut size={15} /></button>
      </div>
    </div>
  );
}

function TabNav({ tabs, active, onChange }) {
  return (
    <div className="flex gap-2 px-3 pt-3 pb-1 overflow-x-auto no-scrollbar bg-blue-500 font-fa">
      {tabs.map((t) => (
        <button key={t.key} onClick={() => onChange(t.key)}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition tracking-wide border-[3px] border-slate-900 ${active === t.key ? 'bg-yellow-300 text-slate-900 shadow-[3px_3px_0_0_#0f172a] -translate-y-0.5' : 'bg-blue-400 text-white hover:bg-blue-300 shadow-[2px_2px_0_0_#0f172a]'}`}>
          {t.icon}{t.label}
        </button>
      ))}
    </div>
  );
}

/* ============================================================
   ماژول ۵: بازی (GAME ENGINE MODULE) - گرافیک نئو-برutalism
   ============================================================ */
function questionLabel(q) {
  switch (q.type) {
    case 'grammarFix': return q.sentence.replace(/\[(.*?)\]/, '$1');
    case 'collocation': return `${q.keyword} + ?`;
    case 'scramble': return q.correctOrder.join(' ');
    case 'oddOneOut': return q.options.join(' / ');
    case 'syllable': return q.word;
    case 'aiGuess': return q.word;
    case 'fillblank': return q.sentence;
    case 'image': return `${q.emoji} → ${q.correct}`;
    case 'mc': return q.question;
    default: return '-';
  }
}

function buildStage(bank, wrongMap, count, difficulty) {
  let pool = bank.filter((q) => q.difficulty === difficulty);
  if (pool.length < count) pool = bank;
  const reviewIds = Object.keys(wrongMap || {});
  const reviewCount = Math.min(Math.floor(count * 0.3), reviewIds.length);
  const reviewPicked = [];
  const shuffledReview = [...reviewIds].sort(() => Math.random() - 0.5);
  for (const id of shuffledReview) {
    const q = bank.find((x) => x.id === id);
    if (q && reviewPicked.length < reviewCount) reviewPicked.push({ ...q, isReview: true });
  }
  const remaining = count - reviewPicked.length;
  const others = [...pool].filter((q) => !reviewPicked.some((r) => r.id === q.id)).sort(() => Math.random() - 0.5).slice(0, remaining);
  const stage = [...reviewPicked, ...others].sort(() => Math.random() - 0.5);
  while (stage.length < count && bank.length > 0) {
    const extra = bank[Math.floor(Math.random() * bank.length)];
    if (!stage.find((s) => s.id === extra.id)) stage.push(extra);
    else break;
  }
  return stage.slice(0, count);
}

// ====== کارت بازخورد - حالا با همان توضیح برای درست و غلط ======
function FeedbackPanel({ correct, explanation }) {
  return (
    <div className={`mt-4 rounded-xl p-3 flex items-start gap-2 border-[3px] border-slate-900 shadow-[3px_3px_0_0_#0f172a] ${correct ? 'bg-emerald-300 text-emerald-950' : 'bg-red-300 text-red-950'}`}>
      {correct ? <CheckCircle2 className="shrink-0 mt-0.5" size={20} /> : <XCircle className="shrink-0 mt-0.5" size={20} />}
      <div>
        <p className="font-black text-sm font-fun">{correct ? 'پاسخ صحیح ✅' : 'پاسخ نادرست ❌'}</p>
        {explanation && <p className="text-xs mt-1 leading-relaxed font-bold">{explanation}</p>}
      </div>
    </div>
  );
}

function AIExplainButton({ aiEnabled, prompt }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  if (!aiEnabled) return null;
  async function run() {
    setOpen(true);
    if (text) return;
    setLoading(true);
    const res = await askAI(prompt);
    setLoading(false);
    setText(res || 'دستیار هوش مصنوعی در دسترس نیست؛ بعداً تلاش کنید.');
  }
  return (
    <div className="mt-3">
      <button onClick={run} className="flex items-center gap-1.5 bg-blue-800 hover:bg-blue-700 text-white text-xs font-extrabold px-4 py-2 rounded-full border-2 border-slate-900 shadow-[3px_3px_0_0_#0f172a] hover:translate-y-0.5 hover:shadow-[1px_1px_0_0_#0f172a] transition tracking-wide">
        <Sparkles size={14} /> Explain with AI
      </button>
      {open && (
        <div className="mt-2 bg-white border-[3px] border-slate-900 rounded-xl p-3 text-xs leading-relaxed text-slate-900 font-bold shadow-[3px_3px_0_0_#0f172a]" dir="rtl">
          {loading ? 'دستیار هوش مصنوعی در حال فکر کردن است…' : text}
        </div>
      )}
    </div>
  );
}

function OptionButton({ children, onClick, state }) {
  const cls = {
    idle: 'bg-white hover:-translate-y-0.5 text-slate-900 shadow-[3px_3px_0_0_#0f172a]',
    correct: 'bg-emerald-300 text-emerald-950 shadow-[3px_3px_0_0_#0f172a] scale-[1.02]',
    wrong: 'bg-red-400 text-white shadow-[3px_3px_0_0_#0f172a]',
    disabled: 'bg-white/40 text-slate-400 shadow-none',
  }[state];
  return (
    <button onClick={onClick} disabled={state !== 'idle'}
      className={`w-full text-right px-4 py-2.5 rounded-xl text-sm font-extrabold border-[3px] border-slate-900 transition-all duration-150 ${cls}`} dir="ltr">
      {children}
    </button>
  );
}

function QuestionShell({ title, subtitle, gradient, isReview, children }) {
  return (
    <div className="rounded-[1.75rem] p-5 border-[4px] border-slate-900 shadow-[8px_8px_0_0_#0f172a] text-white relative overflow-hidden font-fa" style={{ background: gradient }}>
      {isReview && <div className="absolute top-3 left-3"><Badge tone="amber">🔁 مرور</Badge></div>}
      <div className="mb-3">
        <h3 className="font-black text-xl leading-tight tracking-wide font-fun drop-shadow-[2px_2px_0_rgba(0,0,0,0.25)]">{title}</h3>
        {subtitle && <p className="text-white/90 text-xs mt-1 font-bold">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function QuestionCard({ q, onAnswer, aiEnabled }) {
  const [answered, setAnswered] = useState(false);
  const [picked, setPicked] = useState(null);
  const [textVal, setTextVal] = useState('');
  const [scrambleSel, setScrambleSel] = useState([]);
  const [hint, setHint] = useState('');

  function finish(isCorrect, userAnswerText, correctAnswerText) {
    setAnswered(true);
    onAnswer({ correct: isCorrect, userAnswer: userAnswerText, correctAnswer: correctAnswerText });
  }

  /* ---------- SCRAMBLE (فیروزه‌ای - مطابق تصویر) ---------- */
  if (q.type === 'scramble') {
    function toggleWord(w) {
      if (answered) return;
      if (scrambleSel.includes(w)) setScrambleSel(scrambleSel.filter((s) => s !== w));
      else setScrambleSel([...scrambleSel, w]);
    }
    function submit() {
      const built = scrambleSel.join(' ').toLowerCase();
      const correctStr = q.correctOrder.join(' ').toLowerCase();
      finish(built === correctStr, scrambleSel.join(' '), q.correctOrder.join(' '));
    }
    return (
      <QuestionShell title="Drag-and-drop word block scramble" subtitle="کلمات را به ترتیب درست انتخاب کنید" gradient="linear-gradient(160deg,#22d3ee 0%,#0e7490 100%)" isReview={q.isReview}>
        <div className="min-h-[48px] bg-white rounded-xl p-2.5 flex flex-wrap gap-1.5 mb-3 border-[3px] border-slate-900" dir="ltr">
          {scrambleSel.length === 0 && <span className="text-slate-400 text-xs px-1 py-1 font-bold">جمله‌ی شما اینجا ساخته می‌شود...</span>}
          {scrambleSel.map((w, i) => (
            <button key={i} onClick={() => toggleWord(w)} disabled={answered}
              className="bg-amber-300 text-amber-950 text-xs font-extrabold px-3 py-1.5 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a]">{w}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5" dir="ltr">
          {q.words.map((w, i) => (
            <button key={i} onClick={() => toggleWord(w)} disabled={answered || scrambleSel.includes(w)}
              className={`text-xs font-extrabold px-3 py-1.5 rounded-lg border-2 border-slate-900 transition ${scrambleSel.includes(w) ? 'bg-white/20 text-white/40' : 'bg-white text-cyan-900 hover:-translate-y-0.5 shadow-[2px_2px_0_0_#0f172a]'}`}>{w}</button>
          ))}
        </div>
        {!answered ? (
          <button onClick={submit} disabled={scrambleSel.length !== q.words.length}
            className="mt-4 w-full bg-amber-300 disabled:opacity-40 text-amber-950 font-extrabold py-2.5 rounded-xl text-sm tracking-wide border-[3px] border-slate-900 shadow-[4px_4px_0_0_#0f172a] hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#0f172a] transition font-fun">
            بررسی جمله
          </button>
        ) : (
          <FeedbackPanel correct={scrambleSel.join(' ').toLowerCase() === q.correctOrder.join(' ').toLowerCase()} explanation={q.explanation} />
        )}
        <AIExplainButton aiEnabled={aiEnabled} prompt={`قاعده ترتیب کلمات برای جمله "${q.correctOrder.join(' ')}" را به فارسی خلاصه توضیح بده.`} />
      </QuestionShell>
    );
  }

  /* ---------- COLLOCATION (سبز - مطابق تصویر) ---------- */
  if (q.type === 'collocation') {
    const opts = q.options || [];
    const correctVal = q.correct;
    return (
      <QuestionShell title="Collocation Pairs" subtitle={<span>هم‌نشینی درست را انتخاب کنید: <b dir="ltr">"{q.keyword} ___"</b></span>} gradient="linear-gradient(160deg,#4ade80 0%,#15803d 100%)" isReview={q.isReview}>
        <div className="grid grid-cols-2 gap-2.5">
          {opts.map((opt) => {
            let state = 'idle';
            if (answered) {
              if (opt === correctVal) state = 'correct';
              else if (opt === picked) state = 'wrong';
              else state = 'disabled';
            }
            return (
              <button key={opt} onClick={() => { if (!answered) { setPicked(opt); finish(opt === correctVal, opt, correctVal); } }}
                disabled={answered}
                className={`px-3 py-2.5 rounded-xl text-sm font-extrabold border-[3px] border-slate-900 transition-all duration-150 ${
                  state === 'idle' ? 'bg-white text-slate-900 hover:-translate-y-0.5 shadow-[3px_3px_0_0_#0f172a]' :
                  state === 'correct' ? 'bg-emerald-300 text-emerald-950 shadow-[3px_3px_0_0_#0f172a]' :
                  state === 'wrong' ? 'bg-red-400 text-white shadow-[3px_3px_0_0_#0f172a]' :
                  'bg-white/30 text-white/50 shadow-none'
                }`}>
                {opt}
              </button>
            );
          })}
        </div>
        {answered && <FeedbackPanel correct={picked === correctVal} explanation={q.explanation} />}
        <AIExplainButton aiEnabled={aiEnabled} prompt={`به فارسی توضیح بده چرا هم‌نشینی "${q.keyword} ${correctVal}" درست است.`} />
      </QuestionShell>
    );
  }

  /* ---------- AI GUESS (بنفش - مطابق تصویر Vocabulary Guess) ---------- */
  if (q.type === 'aiGuess') {
    function checkGuess() {
      finish(textVal.trim().toLowerCase() === q.word.toLowerCase(), textVal, q.word);
    }
    return (
      <QuestionShell title="Vocabulary Guess" subtitle="AI-Bot یک سرنخ می‌دهد — شما کلمه را حدس بزنید" gradient="linear-gradient(160deg,#8b5cf6 0%,#4c1d95 100%)" isReview={q.isReview}>
        <div className="bg-white rounded-xl p-3 mb-3 flex items-start gap-2 border-[3px] border-slate-900">
          <span className="w-8 h-8 rounded-full bg-violet-200 border-2 border-slate-900 flex items-center justify-center shrink-0"><Sparkles size={16} className="text-violet-700" /></span>
          <p className="text-sm font-bold text-slate-900" dir="ltr">{q.definition}</p>
        </div>
        {!answered ? (
          <>
            <div className="flex gap-2" dir="ltr">
              <input value={textVal} onChange={(e) => setTextVal(e.target.value)}
                placeholder="type the word..."
                className="flex-1 rounded-xl px-3 py-2 text-sm bg-white text-slate-900 placeholder-slate-400 outline-none border-[3px] border-slate-900 font-bold" />
              <button onClick={checkGuess}
                className="bg-amber-300 text-amber-950 font-extrabold px-4 rounded-xl text-sm tracking-wide border-[3px] border-slate-900 shadow-[3px_3px_0_0_#0f172a] hover:translate-y-0.5 hover:shadow-[1px_1px_0_0_#0f172a] transition font-fun">
                حدس بزن
              </button>
            </div>
            <button onClick={() => setHint(`سرنخ: حرف "${q.word[0]}" و ${q.word.length} حرف`)}
              className="mt-2 text-xs text-white underline font-extrabold">نیاز به سرنخ دارم</button>
            {hint && <p className="text-xs text-yellow-200 mt-1 font-bold">{hint}</p>}
          </>
        ) : (
          <FeedbackPanel correct={textVal.trim().toLowerCase() === q.word.toLowerCase()} explanation={q.explanation} />
        )}
        <AIExplainButton aiEnabled={aiEnabled} prompt={`کلمه "${q.word}" را با مثال کاربردی در محیط کار به فارسی خلاصه توضیح بده.`} />
      </QuestionShell>
    );
  }

  /* ---------- SYLLABLE STRESS (تیره - مطابق تصویر Syllable Stress Diagram) ---------- */
  if (q.type === 'syllable') {
    function speak() {
      try {
        const u = new SpeechSynthesisUtterance(q.word);
        u.lang = 'en-US'; u.rate = 0.85;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      } catch (e) { /* ignore */ }
    }
    return (
      <QuestionShell title="Syllable Stress Diagram" subtitle="کدام هجا با تکیه‌ی بیشتری ادا می‌شود؟" gradient="linear-gradient(160deg,#1e293b 0%,#020617 100%)" isReview={q.isReview}>
        <div className="flex items-center justify-center gap-3 mb-4 bg-white/10 rounded-xl p-3 border-[3px] border-white/20">
          <span className="text-2xl font-black font-fun" dir="ltr">{q.word}</span>
          <button onClick={speak} className="bg-yellow-300 text-amber-950 rounded-full p-2.5 border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] hover:translate-y-0.5 hover:shadow-none transition">
            <Volume2 size={18} />
          </button>
        </div>
        {/* نمودار موج صوتی تزئینی مطابق تصویر */}
        <div className="flex items-end justify-center gap-1 h-10 mb-4">
          {[6, 14, 22, 10, 18, 8, 16, 24, 12, 6, 20, 9].map((h, i) => (
            <div key={i} className="w-1.5 rounded-full bg-gradient-to-t from-pink-500 via-cyan-400 to-yellow-300" style={{ height: `${h}px` }} />
          ))}
        </div>
        <div className="flex justify-center gap-3" dir="ltr">
          {q.syllables.map((s, i) => {
            let state = 'idle';
            if (answered) {
              if (i === q.stressedIndex) state = 'correct';
              else if (i === picked) state = 'wrong';
              else state = 'disabled';
            }
            return (
              <button key={i} disabled={answered} onClick={() => { if (!answered) { setPicked(i); finish(i === q.stressedIndex, s, q.syllables[q.stressedIndex]); } }}
                className={`px-5 py-3 rounded-xl font-black text-sm border-[3px] border-slate-900 transition ${
                  state === 'idle' ? 'bg-white text-slate-900 hover:-translate-y-0.5 shadow-[3px_3px_0_0_#0f172a]' :
                  state === 'correct' ? 'bg-emerald-400 text-emerald-950 shadow-[3px_3px_0_0_#0f172a]' :
                  state === 'wrong' ? 'bg-red-400 text-white shadow-[3px_3px_0_0_#0f172a]' :
                  'bg-white/10 text-white/30 shadow-none'
                }`}>
                {s}
              </button>
            );
          })}
        </div>
        {answered && <FeedbackPanel correct={picked === q.stressedIndex} explanation={q.explanation} />}
        <AIExplainButton aiEnabled={aiEnabled} prompt={`قاعده تکیه (stress) روی کلمه "${q.word}" را به فارسی خلاصه توضیح بده.`} />
      </QuestionShell>
    );
  }

  /* ---------- سایر موارد (چهارگزینه‌ای، تصحیح گرامری Email Proofreading، جای خالی، تصویری، odd-one-out) ---------- */
  if (q.type === 'mc' || q.type === 'grammarFix' || q.type === 'fillblank' || q.type === 'image' || q.type === 'oddOneOut') {
    let gradient = 'linear-gradient(160deg,#a78bfa 0%,#5b21b6 100%)';
    let title = q.question || '';
    let subtitle = 'یک گزینه را انتخاب کنید';
    let opts = [];
    let correctVal = '';

    if (q.type === 'mc') {
      gradient = 'linear-gradient(160deg,#a78bfa 0%,#5b21b6 100%)';
      title = q.question;
      opts = q.options || [];
      correctVal = q.correct;
    } else if (q.type === 'grammarFix') {
      gradient = 'linear-gradient(160deg,#f472b6 0%,#9d174d 100%)';
      title = 'Email Proofreading';
      subtitle = 'کلمه‌ی غلط را پیدا کنید و تصحیح‌شده را تایپ کنید';
      const words = q.sentence.split(' ');
      return (
        <QuestionShell title={title} subtitle={subtitle} gradient={gradient} isReview={q.isReview}>
          <div className="flex justify-center mb-3">
            <span className="w-16 h-16 rounded-full bg-yellow-300 border-[3px] border-slate-900 flex items-center justify-center shadow-[3px_3px_0_0_#0f172a]"><Mail size={30} className="text-pink-700" /></span>
          </div>
          <p className="bg-white rounded-xl p-3 text-sm leading-relaxed font-bold text-slate-900 border-[3px] border-slate-900" dir="ltr">
            {words.map((w, i) => {
              const clean = w.replace(/[\[\]]/g, '');
              const isTarget = w.includes('[');
              return <span key={i} className={isTarget ? 'bg-yellow-200 underline decoration-pink-600 decoration-2 px-0.5 rounded font-black' : ''}>{clean} </span>;
            })}
          </p>
          {!answered ? (
            <div className="mt-3 flex gap-2" dir="ltr">
              <input value={textVal} onChange={(e) => setTextVal(e.target.value)}
                placeholder="type the correction..."
                className="flex-1 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 placeholder-slate-400 outline-none border-[3px] border-slate-900 font-bold" />
              <button onClick={() => finish(textVal.trim().toLowerCase() === q.correct.toLowerCase(), textVal, q.correct)}
                className="bg-amber-300 text-amber-950 font-extrabold px-4 rounded-lg text-sm tracking-wide border-[3px] border-slate-900 shadow-[3px_3px_0_0_#0f172a] hover:translate-y-0.5 hover:shadow-[1px_1px_0_0_#0f172a] transition font-fun">تایید</button>
            </div>
          ) : (
            <FeedbackPanel correct={textVal.trim().toLowerCase() === q.correct.toLowerCase()} explanation={q.explanation} />
          )}
          <AIExplainButton aiEnabled={aiEnabled} prompt={`به فارسی خلاصه توضیح بده چرا در جمله "${q.sentence.replace(/[\[\]]/g, '')}" کلمه "${q.wrong}" باید به "${q.correct}" تبدیل شود.`} />
        </QuestionShell>
      );
    } else if (q.type === 'fillblank') {
      gradient = 'linear-gradient(160deg,#22d3ee 0%,#0e7490 100%)';
      title = 'Fill in the Blank';
      subtitle = 'کلمه‌ی مناسب را تایپ کنید';
      return (
        <QuestionShell title={title} subtitle={subtitle} gradient={gradient} isReview={q.isReview}>
          <p className="bg-white rounded-xl p-3 text-sm font-bold text-slate-900 border-[3px] border-slate-900" dir="ltr">{q.sentence}</p>
          {!answered ? (
            <div className="mt-3 flex gap-2" dir="ltr">
              <input value={textVal} onChange={(e) => setTextVal(e.target.value)}
                placeholder="your answer..."
                className="flex-1 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 placeholder-slate-400 outline-none border-[3px] border-slate-900 font-bold" />
              <button onClick={() => finish(textVal.trim().toLowerCase() === q.answer.toLowerCase(), textVal, q.answer)}
                className="bg-amber-300 text-amber-950 font-extrabold px-4 rounded-lg text-sm tracking-wide border-[3px] border-slate-900 shadow-[3px_3px_0_0_#0f172a] hover:translate-y-0.5 hover:shadow-[1px_1px_0_0_#0f172a] transition font-fun">تایید</button>
            </div>
          ) : <FeedbackPanel correct={textVal.trim().toLowerCase() === q.answer.toLowerCase()} explanation={q.explanation} />}
          <AIExplainButton aiEnabled={aiEnabled} prompt={`به فارسی خلاصه توضیح بده چرا در جای خالی "${q.sentence}" پاسخ "${q.answer}" درست است.`} />
        </QuestionShell>
      );
    } else if (q.type === 'image') {
      gradient = 'linear-gradient(160deg,#38bdf8 0%,#075985 100%)';
      title = 'این تصویر به کدام کلمه اشاره دارد؟';
      opts = q.options || [];
      correctVal = q.correct;
    } else if (q.type === 'oddOneOut') {
      gradient = 'linear-gradient(160deg,#fb7185 0%,#9f1239 100%)';
      title = 'کدام کلمه اضافی است؟ (Odd One Out)';
      opts = q.options || [];
      correctVal = q.oddOne;
    }

    if (opts.length > 0) {
      return (
        <QuestionShell title={title} subtitle={subtitle} gradient={gradient} isReview={q.isReview}>
          {q.type === 'image' && (
            <div className="flex justify-center mb-4">
              <div className="text-6xl bg-white rounded-2xl border-[3px] border-slate-900 shadow-[4px_4px_0_0_#0f172a] w-28 h-28 flex items-center justify-center">{q.emoji}</div>
            </div>
          )}
          <div className="space-y-2.5">
            {opts.map((opt) => {
              let state = 'idle';
              if (answered) {
                if (opt === correctVal) state = 'correct';
                else if (opt === picked) state = 'wrong';
                else state = 'disabled';
              }
              return (
                <OptionButton key={opt} state={state} onClick={() => {
                  if (answered) return;
                  setPicked(opt);
                  finish(opt === correctVal, opt, correctVal);
                }}>{opt}</OptionButton>
              );
            })}
          </div>
          {answered && <FeedbackPanel correct={picked === correctVal} explanation={q.explanation} />}
          <AIExplainButton aiEnabled={aiEnabled} prompt={`به فارسی توضیح بده چرا پاسخ "${correctVal}" برای این سوال درست است.`} />
        </QuestionShell>
      );
    }
  }

  return null;
}

/* ============================================================
   ماژول ۵ ادامه: GameModule
   ============================================================ */
function GameModule({ username, role, settings, bank, userData, setUserData, onLog, aiEnabled }) {
  const [stage, setStage] = useState(null);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [results, setResults] = useState([]);
  const [lateMsg, setLateMsg] = useState('');
  const [outOfHours, setOutOfHours] = useState(false);
  const [finished, setFinished] = useState(false);
  const [alreadyPlayedToday, setAlreadyPlayedToday] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (role === 'user' && (hour < settings.startHour || hour >= settings.endHour)) setOutOfHours(true);
    else setOutOfHours(false);
  }, [settings.startHour, settings.endHour, role]);

  useEffect(() => {
    const today = todayStr();

    // ادامه‌ی مرحله‌ی ناتمام امروز
    if (userData.activeStage && userData.activeStage.dateKey === today && !userData.activeStage.finished) {
      setStage(userData.activeStage.questions);
      setIdx(userData.activeStage.idx);
      setResults(userData.activeStage.results);
      setPaused(userData.activeStage.paused);
      return;
    }

    // ✅ اگر کاربر همین امروز مرحله را تمام کرده، دیگر سوال جدیدی نشان نده —
    // فقط پیام «بازی امروز را انجام دادی» نمایش بده تا فردا.
    if (userData.lastPlayedDate === today) {
      setAlreadyPlayedToday(true);
      setStage(userData.activeStage ? userData.activeStage.questions : []);
      setResults(userData.activeStage ? userData.activeStage.results : []);
      setFinished(true);
      return;
    }

    // در غیر این صورت، مرحله‌ی جدید امروز را بساز (همراه جریمه‌ی تأخیر در صورت نیاز)
    let penaltyMsg = '';
    let updated = { ...userData };
    if (userData.lastPlayedDate && userData.lastPlayedDate !== today) {
      const d = diffDays(userData.lastPlayedDate, today);
      if (d > 0) {
        const penalty = settings.latePenalty * d;
        updated.totalPoints = Math.max(0, (updated.totalPoints || 0) - penalty);
        penaltyMsg = `به‌دلیل ${d} روز تأخیر، ${penalty} امتیاز کسر شد.`;
      }
    }
    const difficulty = ['easy', 'medium', 'hard'][new Date().getDate() % 3];
    const stageQs = buildStage(bank, updated.wrongMap || {}, settings.questionsPerStage, difficulty);
    updated.activeStage = { dateKey: today, questions: stageQs, idx: 0, results: [], paused: false, finished: false };
    setUserData(updated);
    setStage(stageQs); setIdx(0); setResults([]); setPaused(false); setLateMsg(penaltyMsg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persistStage(next) {
    setUserData((prev) => ({ ...prev, activeStage: { ...prev.activeStage, ...next } }));
  }

  function handleAnswer(res) {
    const q = stage[idx];
    const newResults = [...results, { ...res, question: q }];
    setResults(newResults);
    onLog({ username, questionId: q.id, type: q.type, correct: res.correct, userAnswer: res.userAnswer, correctAnswer: res.correctAnswer, answeredAt: new Date().toISOString() });

    setUserData((prev) => {
      const wrongMap = { ...(prev.wrongMap || {}) };
      let wrongDetails = { ...(prev.wrongDetails || {}) };
      if (!res.correct) {
        wrongMap[q.id] = (wrongMap[q.id] || 0) + 1;
        wrongDetails[q.id] = { userAnswer: res.userAnswer, correctAnswer: res.correctAnswer, explanation: q.explanation };
      } else if (wrongMap[q.id]) {
        delete wrongMap[q.id];
        delete wrongDetails[q.id];
      }
      let totalPoints = prev.totalPoints || 0;
      if (res.correct) {
        const pts = newResults.length <= settings.tierThreshold ? settings.basePoints : settings.bonusPoints;
        totalPoints += pts;
      }
      const history = [...(prev.history || [])];
      return { ...prev, wrongMap, wrongDetails, totalPoints, history, activeStage: { ...prev.activeStage, idx, results: newResults } };
    });
    setTimeout(() => {
      if (idx + 1 < stage.length) {
        setIdx(idx + 1);
        persistStage({ idx: idx + 1 });
      } else {
        finishStage(newResults);
      }
    }, 1400);
  }

  function finishStage(finalResults) {
    setFinished(true);
    const correctCount = finalResults.filter((r) => r.correct).length;
    setUserData((prev) => {
      const history = [...(prev.history || []), {
        date: todayStr(), correct: correctCount, wrong: finalResults.length - correctCount,
        pointsEarned: finalResults.reduce((sum, r, i) => sum + (r.correct ? (i < settings.tierThreshold ? settings.basePoints : settings.bonusPoints) : 0), 0),
      }];
      return { ...prev, lastPlayedDate: todayStr(), history, activeStage: { ...prev.activeStage, finished: true } };
    });
  }

  function togglePause() {
    setPaused((p) => { persistStage({ paused: !p }); return !p; });
  }

  if (outOfHours) {
    return (
      <div className="p-8 text-center font-fa">
        <div className="inline-flex w-20 h-20 rounded-full bg-slate-200 border-[3px] border-slate-900 items-center justify-center mb-3"><Clock className="text-slate-500" size={36} /></div>
        <h3 className="font-black text-slate-800 font-fun text-lg">بازی فقط در ساعات کاری شرکت فعال است</h3>
        <p className="text-slate-500 text-sm mt-1 font-bold">ساعت مجاز: {settings.startHour}:۰۰ تا {settings.endHour}:۰۰</p>
      </div>
    );
  }
  if (!stage) return <div className="p-8 text-center text-slate-400 font-bold font-fa">در حال آماده‌سازی مرحله...</div>;

  // ✅ صفحه‌ی «بازی امروز را انجام دادی» — تا فردا سوال جدیدی نمایش داده نمی‌شود
  if (alreadyPlayedToday) {
    const correctCount = results.filter((r) => r.correct).length;
    return (
      <div className="p-6 text-center font-fa max-w-md mx-auto">
        <div className="bg-emerald-300 border-[4px] border-slate-900 rounded-[1.75rem] shadow-[8px_8px_0_0_#0f172a] p-8">
          <div className="inline-flex w-20 h-20 rounded-full bg-white border-[3px] border-slate-900 items-center justify-center mb-3 shadow-[3px_3px_0_0_#0f172a]">
            <CalendarCheck className="text-emerald-700" size={36} />
          </div>
          <h3 className="font-black text-xl text-emerald-950 font-fun">بازی امروز رو انجام دادی! 🎉</h3>
          {results.length > 0 && <p className="text-emerald-900 mt-2 text-sm font-bold">پاسخ صحیح: {correctCount} از {results.length}</p>}
          <p className="text-emerald-900/80 text-xs mt-3 font-extrabold bg-white/60 inline-block px-3 py-1.5 rounded-full border-2 border-slate-900">
            ⏳ مرحله‌ی فردا، روز بعد برات آماده می‌شه
          </p>
        </div>
      </div>
    );
  }

  if (finished) {
    const correctCount = results.filter((r) => r.correct).length;
    return (
      <div className="p-6 text-center font-fa max-w-md mx-auto">
        <div className="bg-yellow-300 border-[4px] border-slate-900 rounded-[1.75rem] shadow-[8px_8px_0_0_#0f172a] p-8">
          <div className="inline-flex w-20 h-20 rounded-full bg-white border-[3px] border-slate-900 items-center justify-center mb-3 shadow-[3px_3px_0_0_#0f172a]">
            <PartyPopper className="text-amber-600" size={36} />
          </div>
          <h3 className="font-black text-xl text-amber-950 font-fun">مرحله‌ی امروز تمام شد! 🎉</h3>
          <p className="text-amber-900 mt-1 font-bold">پاسخ صحیح: {correctCount} از {stage.length}</p>
          <div className="mt-3"><ProgressBar value={correctCount} max={stage.length} colorClass="bg-emerald-400" /></div>
          <p className="text-xs text-amber-900/80 mt-3 font-extrabold">فردا یک مرحله‌ی جدید منتظر شماست. تا آن‌موقع سوال جدیدی نشان داده نمی‌شود.</p>
        </div>
      </div>
    );
  }

  const q = stage[idx];
  return (
    <div className="p-4 max-w-xl mx-auto font-fa">
      {lateMsg && <div className="mb-3 bg-amber-200 text-amber-900 text-xs p-2.5 rounded-xl flex items-center gap-1.5 font-bold border-[2px] border-slate-900"><AlertCircle size={14} />{lateMsg}</div>}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-extrabold text-slate-600 bg-white border-2 border-slate-900 rounded-full px-2.5 py-1">سوال {idx + 1} از {stage.length}</span>
        <Badge tone="purple">{q.topic || 'عمومی'}</Badge>
      </div>
      <ProgressBar value={idx} max={stage.length} colorClass="bg-violet-400" />
      <div className="mt-4">
        {paused ? (
          <div className="rounded-[1.75rem] p-10 text-center bg-slate-200 border-[4px] border-slate-900 shadow-[8px_8px_0_0_#0f172a]">
            <Pause className="mx-auto text-slate-500" size={36} />
            <p className="text-slate-600 mt-2 text-sm font-bold">بازی متوقف شد — پیشرفت شما ذخیره شده است.</p>
            <NeoButton onClick={togglePause} className="mt-3 px-5 py-2 text-sm" color="bg-violet-400 text-violet-950">ادامه‌ی بازی</NeoButton>
          </div>
        ) : (
          <QuestionCard key={q.id} q={q} onAnswer={handleAnswer} aiEnabled={aiEnabled} />
        )}
      </div>
    </div>
  );
}

/* ============================================================
   ماژول ۶: مدیریت محتوا (ADMIN MODULE)
   ============================================================ */
function emptyDraft() {
  return { id: null, type: 'mc', topic: TOPICS[0], difficulty: 'easy', question: '', options: ['', '', '', ''], correct: '', explanation: '' };
}

function AdminContentModule({ bank, setBank, settings, setSettings, editLog, setEditLog }) {
  const [draft, setDraft] = useState(emptyDraft());
  const [search, setSearch] = useState('');
  const [filterTopic, setFilterTopic] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  function saveDraft() {
    if (!draft.question.trim() || !draft.correct.trim()) return;
    if (draft.id) {
      setBank(bank.map((q) => (q.id === draft.id ? { ...draft } : q)));
      setEditLog([...editLog, { id: uid('log'), action: 'edit', questionId: draft.id, at: new Date().toISOString() }]);
    } else {
      const nq = { ...draft, id: uid() };
      setBank([nq, ...bank]);
      setEditLog([...editLog, { id: uid('log'), action: 'add', questionId: nq.id, at: new Date().toISOString() }]);
    }
    setDraft(emptyDraft());
  }

  function startEdit(q) {
    setDraft({
      id: q.id, type: q.type, topic: q.topic || TOPICS[0], difficulty: q.difficulty,
      question: q.question || questionLabel(q), options: q.options || ['', '', '', ''],
      correct: q.correct || q.answer || q.correctOrder?.join(' ') || '', explanation: q.explanation || '',
    });
  }

  function doDelete(id) {
    setBank(bank.filter((q) => q.id !== id));
    setEditLog([...editLog, { id: uid('log'), action: 'delete', questionId: id, at: new Date().toISOString() }]);
    setConfirmDelete(null);
  }

  const filtered = bank.filter((q) =>
    (!search || questionLabel(q).toLowerCase().includes(search.toLowerCase()) || (q.topic || '').includes(search)) &&
    (!filterTopic || q.topic === filterTopic));

  return (
    <div className="p-4 grid lg:grid-cols-2 gap-5 max-w-6xl mx-auto font-fa">
      <div className="rounded-3xl border-[4px] border-slate-900 shadow-[8px_8px_0_0_#0f172a] overflow-hidden bg-blue-700">
        <WindowBar icon={<Plus size={13} className="text-blue-700" />} title="Add a new Question" tone="#ffffff" />
        <div className="p-4 space-y-2.5">
          <input value={draft.question} onChange={(e) => setDraft({ ...draft, question: e.target.value })}
            placeholder="متن سوال" className="w-full rounded-lg px-3 py-2 text-sm bg-blue-950 text-white placeholder-blue-300 outline-none border-[2px] border-blue-400 focus:border-pink-400 font-bold" />
          <div className="flex gap-3 flex-wrap text-xs font-extrabold text-blue-100">
            {[['mc', 'چهارگزینه‌ای'], ['fillblank', 'جای خالی'], ['image', 'تصویری']].map(([v, l]) => (
              <label key={v} className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" checked={draft.type === v} onChange={() => setDraft({ ...draft, type: v })} /> {l}
              </label>
            ))}
          </div>
          {draft.options.map((opt, i) => (
            <input key={i} value={opt} onChange={(e) => { const o = [...draft.options]; o[i] = e.target.value; setDraft({ ...draft, options: o }); }}
              placeholder={`گزینه ${i + 1}${i < 3 ? '' : ' (اختیاری)'}`}
              className="w-full rounded-lg px-3 py-2 text-sm bg-blue-950 text-white placeholder-blue-300 outline-none border-[2px] border-blue-400 focus:border-pink-400 font-bold" />
          ))}
          <input value={draft.correct} onChange={(e) => setDraft({ ...draft, correct: e.target.value })}
            placeholder="پاسخ صحیح" className="w-full rounded-lg px-3 py-2 text-sm bg-blue-950 text-white placeholder-blue-300 outline-none border-[2px] border-blue-400 focus:border-pink-400 font-bold" />
          <textarea value={draft.explanation} onChange={(e) => setDraft({ ...draft, explanation: e.target.value })}
            placeholder="توضیح در صورت پاسخ اشتباه" rows={2}
            className="w-full rounded-lg px-3 py-2 text-sm bg-blue-950 text-white placeholder-blue-300 outline-none border-[2px] border-blue-400 focus:border-pink-400 resize-none font-bold" />
          <div className="flex gap-2">
            <select value={draft.topic} onChange={(e) => setDraft({ ...draft, topic: e.target.value })}
              className="flex-1 rounded-lg px-2 py-2 text-sm bg-blue-950 text-white outline-none border-[2px] border-blue-400 font-bold">
              {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={draft.difficulty} onChange={(e) => setDraft({ ...draft, difficulty: e.target.value })}
              className="flex-1 rounded-lg px-2 py-2 text-sm bg-blue-950 text-white outline-none border-[2px] border-blue-400 font-bold">
              <option value="easy">آسان</option>
              <option value="medium">متوسط</option>
              <option value="hard">دشوار</option>
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <NeoButton onClick={saveDraft} color="bg-pink-400 text-pink-950" className="flex-1 py-2 text-sm">
              {draft.id ? 'ذخیره تغییرات' : 'Apply'}
            </NeoButton>
            {draft.id && <button onClick={() => setDraft(emptyDraft())} className="bg-blue-900 text-white px-3 rounded-xl text-sm font-bold border-2 border-blue-400">انصراف</button>}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-3xl border-[4px] border-slate-900 shadow-[8px_8px_0_0_#0f172a] overflow-hidden bg-blue-700">
          <WindowBar icon={<Settings size={13} className="text-blue-700" />} title="Full Dashboard" tone="#ffffff" />
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3 text-xs text-white font-bold">
              <LabeledRange label="تعداد سوالات هر مرحله" value={settings.questionsPerStage} min={3} max={15}
                onChange={(v) => setSettings({ ...settings, questionsPerStage: v })} />
              <LabeledRange label="تعداد مراحل در روز" value={settings.stagesPerDay} min={1} max={3}
                onChange={(v) => setSettings({ ...settings, stagesPerDay: v })} />
              <LabeledRange label="ساعت شروع" value={settings.startHour} min={0} max={23}
                onChange={(v) => setSettings({ ...settings, startHour: v })} />
              <LabeledRange label="ساعت پایان" value={settings.endHour} min={0} max={23}
                onChange={(v) => setSettings({ ...settings, endHour: v })} />
              <LabeledRange label="کسر امتیاز هر روز تأخیر" value={settings.latePenalty} min={0} max={100}
                onChange={(v) => setSettings({ ...settings, latePenalty: v })} />
              <LabeledRange label="امتیاز پایه هر سوال" value={settings.basePoints} min={5} max={50}
                onChange={(v) => setSettings({ ...settings, basePoints: v })} />
            </div>
            <div className="mt-4 space-y-2.5 border-t-[3px] border-blue-400 pt-3">
              <ToggleRow label="چت بین کاربران حین بازی" checked={settings.chatEnabled} onChange={(v) => setSettings({ ...settings, chatEnabled: v })} />
              <ToggleRow label="ارسال سوال پیشنهادی توسط کاربران" checked={settings.questionProposalEnabled} onChange={(v) => setSettings({ ...settings, questionProposalEnabled: v })} />
              <ToggleRow label="دستیار هوش مصنوعی" checked={settings.aiAssistantEnabled} onChange={(v) => setSettings({ ...settings, aiAssistantEnabled: v })} />
              <ToggleRow label="نمایش جدول امتیازات" checked={settings.leaderboardEnabled} onChange={(v) => setSettings({ ...settings, leaderboardEnabled: v })} />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border-[4px] border-slate-900 shadow-[8px_8px_0_0_#0f172a] bg-white p-4">
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute right-2.5 top-2.5 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجو بر اساس متن یا موضوع..."
                className="w-full rounded-lg pr-8 pl-2 py-1.5 text-xs bg-slate-50 outline-none border-[2px] border-slate-900 font-bold" />
            </div>
            <select value={filterTopic} onChange={(e) => setFilterTopic(e.target.value)} className="text-xs rounded-lg border-[2px] border-slate-900 px-1 font-bold">
              <option value="">همه موضوعات</option>
              {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="max-h-72 overflow-y-auto space-y-1.5">
            {filtered.map((q) => (
              <div key={q.id} className="flex items-center justify-between bg-slate-50 hover:bg-slate-100 rounded-xl px-2.5 py-1.5 text-xs border-2 border-slate-200">
                <div className="truncate flex-1 font-bold" dir="ltr">
                  <span className="font-extrabold">{questionLabel(q)}</span>
                  <span className="text-slate-400 mr-2"> · {q.topic} · {q.difficulty}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => startEdit(q)} className="text-blue-600 p-1 hover:bg-blue-100 rounded"><Edit3 size={14} /></button>
                  <button onClick={() => setConfirmDelete(q.id)} className="text-red-600 p-1 hover:bg-red-100 rounded"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p className="text-center text-slate-400 text-xs py-4 font-bold">سوالی یافت نشد.</p>}
          </div>
          <p className="text-[10px] text-slate-400 mt-2 font-bold">تعداد کل سوالات: {bank.length} | ویرایش‌ها: {editLog.length}</p>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border-[4px] border-slate-900 shadow-[8px_8px_0_0_#0f172a] p-6 max-w-sm w-full text-center">
            <div className="inline-flex w-16 h-16 rounded-full bg-red-200 border-[3px] border-slate-900 items-center justify-center mb-2"><AlertCircle className="text-red-600" size={28} /></div>
            <p className="font-black mt-2 text-slate-800 font-fun">آیا از حذف این سوال مطمئن هستید؟</p>
            <p className="text-xs text-slate-400 mt-1 font-bold">این عمل قابل بازگشت نیست.</p>
            <div className="flex gap-2 mt-4">
              <NeoButton onClick={() => doDelete(confirmDelete)} color="bg-red-400 text-red-950" className="flex-1 py-2 text-sm">حذف</NeoButton>
              <button onClick={() => setConfirmDelete(null)} className="flex-1 bg-slate-100 border-[2px] border-slate-900 rounded-xl py-2 text-sm font-extrabold">انصراف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LabeledRange({ label, value, min, max, onChange }) {
  return (
    <label className="block bg-blue-900/40 rounded-xl p-2 border-2 border-blue-400">
      <span className="block mb-1">{label}: <b className="text-yellow-300">{value}</b></span>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-pink-500" />
    </label>
  );
}
function ToggleRow({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between text-white text-xs font-extrabold">
      <span>{label}</span>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
  );
}

/* ============================================================
   ماژول ۷: گزارش‌گیری (REPORTING MODULE) - مخصوص مدیر
   ============================================================ */
function ReportingModule({ allUsers, settings, setSettings, logs, role }) {
  const [search, setSearch] = useState('');

  // فقط کاربران عادی و ادمین (نه مدیر) را در گزارش نشان بده
  const players = allUsers.filter(u => u.role !== 'manager');
  const rows = players.filter((u) => !search || u.username.includes(search));
  const leaderboard = [...rows].sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0)).slice(0, 6);
  const avgScore = rows.length ? Math.round(rows.reduce((s, u) => s + (u.totalPoints || 0), 0) / rows.length) : 0;
  const masteryPct = Math.min(100, Math.round(avgScore / 10));

  const activityData = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'].map((d) => ({
    day: d, ساعت: Math.round(Math.random() * 8 + 2),
  }));

  function exportMonthlyExcel() {
    const data = leaderboard.map((u, i) => ({
      رتبه: i + 1, نام_کاربری: u.username, مجموع_امتیاز_ماهانه: u.totalPoints || 0,
      تعداد_بازی: (u.history || []).length, میانگین_امتیاز_هر_بازی: (u.history || []).length ? Math.round((u.totalPoints || 0) / u.history.length) : 0,
    }));
    exportExcel(data, `monthly-report-${todayStr()}.xlsx`, 'گزارش ماهانه');
  }

  const medal = ['🥇', '🥈', '🥉'];

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4 font-fa">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-3xl border-[4px] border-slate-900 shadow-[8px_8px_0_0_#0f172a] overflow-hidden bg-blue-900">
          <WindowBar icon={<BarChart3 size={13} className="text-blue-900" />} title="User Active Hours" tone="#ffffff" />
          <div className="p-3">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                <YAxis tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="ساعت" fill="#38bdf8" radius={[4, 4, 0, 0]} stroke="#0f172a" strokeWidth={1} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-3xl border-[4px] border-slate-900 shadow-[8px_8px_0_0_#0f172a] overflow-hidden bg-blue-900">
          <WindowBar icon={<Trophy size={13} className="text-blue-900" />} title="Monthly Score Leaderboard" tone="#ffffff" />
          <div className="p-3">
            <div className="flex justify-end mb-1">
              {settings.leaderboardEnabled ? <Badge tone="green">فعال برای کاربران</Badge> : <Badge tone="red">غیرفعال</Badge>}
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={leaderboard} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                <YAxis type="category" dataKey="username" width={70} tick={{ fill: '#e2e8f0', fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="totalPoints" fill="#a78bfa" radius={[0, 6, 6, 0]} stroke="#0f172a" strokeWidth={1} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-3xl border-[4px] border-slate-900 shadow-[8px_8px_0_0_#0f172a] overflow-hidden bg-blue-900">
          <WindowBar icon={<Sparkles size={13} className="text-blue-900" />} title="Company Mastery Percentage" tone="#ffffff" />
          <div className="p-4 flex items-center gap-4">
            <div className="w-28 h-28 shrink-0">
              <ResponsiveContainer>
                <RadialBarChart innerRadius="65%" outerRadius="100%" data={[{ name: 'mastery', value: masteryPct, fill: '#34d399' }]} startAngle={90} endAngle={-270}>
                  <RadialBar dataKey="value" cornerRadius={20} background={{ fill: '#1e293b' }} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="text-4xl font-black text-emerald-400 font-fun">{masteryPct}%</p>
              <p className="text-white/70 text-xs font-bold mt-1">میانگین تسلط شرکت</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border-[4px] border-slate-900 shadow-[8px_8px_0_0_#0f172a] overflow-hidden bg-blue-900 flex flex-col items-center justify-center gap-3 p-5">
          <div className="w-14 h-14 rounded-full bg-emerald-300 border-[3px] border-slate-900 flex items-center justify-center"><FileSpreadsheet className="text-emerald-900" size={26} /></div>
          <button onClick={exportMonthlyExcel}
            className="bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-black px-6 py-3 rounded-full text-sm flex items-center gap-2 tracking-wide border-[3px] border-slate-900 shadow-[5px_5px_0_0_#0f172a] hover:translate-y-1 hover:shadow-[2px_2px_0_0_#0f172a] transition font-fun">
            Export to Excel <span className="w-6 h-6 rounded-full bg-yellow-300 border-2 border-slate-900 flex items-center justify-center text-xs">💰</span>
          </button>
          <p className="text-[10px] text-white/60 font-bold">گزارش رتبه‌بندی پایان ماه</p>
        </div>
      </div>

      <div className="rounded-3xl border-[4px] border-slate-900 shadow-[8px_8px_0_0_#0f172a] overflow-hidden bg-white">
        <WindowBar icon={<Users size={13} className="text-slate-900" />} title="لیست کاربران فعال" tone="#0f172a" dotBg="bg-blue-100" />
        <div className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex gap-1 text-lg">{medal.slice(0, Math.min(3, leaderboard.length)).map((m, i) => <span key={i}>{m}</span>)}</div>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجوی کاربر..."
              className="text-xs border-[2px] border-slate-900 rounded-lg px-2 py-1 font-bold" />
          </div>
          <table className="w-full text-xs">
            <thead><tr className="text-slate-500 border-b-2 border-slate-900 font-extrabold"><th className="text-right py-1.5">نام کاربری</th><th>امتیاز کل</th><th>تعداد بازی</th><th>آخرین بازی</th></tr></thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.username} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-1.5 font-extrabold">{u.username}</td>
                  <td className="text-center font-bold">{u.totalPoints || 0}</td>
                  <td className="text-center font-bold">{(u.history || []).length}</td>
                  <td className="text-center font-bold">{u.lastPlayedDate || '—'}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={4} className="text-center text-slate-400 py-4 font-bold">هنوز کاربری بازی نکرده است.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {role === 'manager' && (
        <div className="rounded-3xl border-[4px] border-slate-900 shadow-[8px_8px_0_0_#0f172a] overflow-hidden bg-white">
          <WindowBar icon={<ShieldCheck size={13} className="text-slate-900" />} title="لاگ کامل پاسخ‌ها (مدیران)" tone="#0f172a" dotBg="bg-blue-100" />
          <div className="p-4 max-h-48 overflow-y-auto text-xs">
            {logs.slice(-30).reverse().map((l) => (
              <div key={l.id} className="flex justify-between border-b border-slate-100 py-1 font-bold">
                <span>{l.username}</span><span className="text-slate-400">{l.type}</span>
                <span className={l.correct ? 'text-emerald-600' : 'text-red-500'}>{l.correct ? 'درست' : 'غلط'}</span>
                <span className="text-slate-400">{new Date(l.answeredAt).toLocaleTimeString('fa-IR')}</span>
              </div>
            ))}
            {logs.length === 0 && <p className="text-center text-slate-400 py-3 font-bold">لاگی ثبت نشده است.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   ماژول ۸: پروفایل کاربر (USER PROFILE MODULE) - فقط برای کاربر عادی
   ============================================================ */
function downloadMistakesReport(username, wrongDetails, bank) {
  const items = Object.keys(wrongDetails).map(id => {
    const q = bank.find(b => b.id === id);
    if (!q) return null;
    const detail = wrongDetails[id];
    return {
      questionText: questionLabel(q),
      options: q.options ? q.options.join(' | ') : '-',
      userAnswer: detail.userAnswer || '—',
      correctAnswer: detail.correctAnswer || q.correct || q.answer || q.oddOne || q.word,
      explanation: detail.explanation || q.explanation || '-'
    };
  }).filter(Boolean);

  const rowsHtml = items.map((w, i) => `
    <tr>
      <td style="padding:8px;border:1px solid #ddd;">${i + 1}</td>
      <td style="padding:8px;border:1px solid #ddd;">${w.questionText}</td>
      <td style="padding:8px;border:1px solid #ddd;">${w.options}</td>
      <td style="padding:8px;border:1px solid #ddd;color:#b91c1c;">${w.userAnswer}</td>
      <td style="padding:8px;border:1px solid #ddd;color:#15803d;">${w.correctAnswer}</td>
      <td style="padding:8px;border:1px solid #ddd;">${w.explanation}</td>
    </tr>`).join('');
  const html = `<!DOCTYPE html><html dir="rtl" lang="fa"><head><meta charset="utf-8" />
    <title>گزارش اشتباهات - ${username}</title>
    <style>
      body{font-family:'Vazirmatn','Tahoma',sans-serif;padding:24px;color:#1f2937}
      h1{color:#1e3a8a} table{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px}
      th{background:#1e3a8a;color:#fff;padding:8px;border:1px solid #ddd}
      td{padding:8px;border:1px solid #ddd}
    </style></head><body>
    <h1>گزارش سوالات اشتباه — ${username}</h1>
    <p>تاریخ: ${new Date().toLocaleDateString('fa-IR')}</p>
    <table><thead><tr><th>#</th><th>سوال</th><th>گزینه‌ها</th><th>پاسخ شما</th><th>پاسخ صحیح</th><th>توضیح</th></tr></thead>
    <tbody>${rowsHtml || '<tr><td colspan="6" style="text-align:center;">هیچ اشتباهی ثبت نشده 🎉</td></tr>'}</tbody></table>
    <p style="margin-top:24px;font-size:12px;color:#6b7280;">برای ذخیره PDF: Ctrl+P سپس «Save as PDF»</p>
    </body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `mistakes-${username}.html`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function ProfileModule({ username, userData, bank }) {
  const history = userData.history || [];
  const dailyData = history.slice(-7).map((h, i) => ({ name: h.date?.slice(5) || i, امتیاز: h.pointsEarned || 0 }));
  const monthlyTrend = history.slice(-12).map((h, i) => ({ name: h.date?.slice(5) || i, امتیاز: (history.slice(0, i + 1).reduce((s, x) => s + (x.pointsEarned || 0), 0)) }));
  const totalCorrect = history.reduce((s, h) => s + (h.correct || 0), 0);
  const totalWrong = history.reduce((s, h) => s + (h.wrong || 0), 0);
  const accuracy = totalCorrect + totalWrong > 0 ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100) : 0;

  const radarData = [
    { skill: 'Grammar', value: 60 + (accuracy % 30) },
    { skill: 'Fluency', value: 55 + (accuracy % 25) },
    { skill: 'Vocabulary', value: 65 + (accuracy % 20) },
    { skill: 'Pronunciation', value: 50 + (accuracy % 35) },
  ];

  const wrongDetails = userData.wrongDetails || {};
  const wrongCount = Object.keys(wrongDetails).length;

  return (
    <div className="p-4 max-w-4xl mx-auto font-fa" dir="rtl">
      <div className="rounded-3xl border-[4px] border-slate-900 shadow-[8px_8px_0_0_#0f172a] overflow-hidden bg-blue-700">
        <WindowBar icon={<User size={13} className="text-blue-700" />} title="User Profile" tone="#ffffff" />
        <div className="p-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-blue-100 text-xs font-extrabold">پروفایل کاربر</p>
              <h2 className="text-2xl font-black flex items-center gap-2 tracking-tight text-white font-fun">{username}</h2>
              <p className="mt-2 text-4xl font-black text-yellow-300 font-fun">{userData.totalPoints || 0} <span className="text-sm text-blue-100 font-bold">امتیاز کل</span></p>
              <p className="text-xs text-blue-100 mt-1 font-bold">درصد پاسخ صحیح: {accuracy}% · تعداد بازی‌ها: {history.length}</p>
            </div>
            <button onClick={() => downloadMistakesReport(username, wrongDetails, bank)}
              className="flex items-center gap-2 bg-yellow-300 hover:bg-yellow-200 text-amber-950 font-black px-5 py-3.5 rounded-full border-[3px] border-slate-900 shadow-[5px_5px_0_0_#0f172a] hover:translate-y-1 hover:shadow-[2px_2px_0_0_#0f172a] transition tracking-wide font-fun">
              Download PDF of Errors <Download size={20} strokeWidth={2.5} />
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-5">
            <div className="bg-blue-900/50 rounded-2xl p-3 border-[2px] border-blue-400">
              <p className="text-xs text-blue-100 mb-1 font-extrabold">مهارت‌های زبانی</p>
              <ResponsiveContainer width="100%" height={150}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#94a3b8" />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: '#e2e8f0', fontSize: 9 }} />
                  <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                  <Radar dataKey="value" stroke="#facc15" fill="#facc15" fillOpacity={0.5} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-blue-900/50 rounded-2xl p-3 border-[2px] border-blue-400">
              <p className="text-xs text-blue-100 mb-1 font-extrabold">امتیاز روزانه</p>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={dailyData}>
                  <XAxis dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 9 }} />
                  <YAxis tick={{ fill: '#cbd5e1', fontSize: 9 }} />
                  <Tooltip /><Bar dataKey="امتیاز" fill="#4ade80" radius={[4, 4, 0, 0]} stroke="#0f172a" strokeWidth={1} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-blue-900/50 rounded-2xl p-3 border-[2px] border-blue-400">
              <p className="text-xs text-blue-100 mb-1 font-extrabold">روند ماهانه</p>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={monthlyTrend}>
                  <XAxis dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 9 }} />
                  <YAxis tick={{ fill: '#cbd5e1', fontSize: 9 }} />
                  <Tooltip /><Line type="monotone" dataKey="امتیاز" stroke="#fb7185" strokeWidth={3} dot={{ r: 3, fill: '#fb7185', stroke: '#0f172a', strokeWidth: 1 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-3xl border-[4px] border-slate-900 shadow-[8px_8px_0_0_#0f172a] bg-white p-4">
        <h4 className="font-black text-sm text-slate-800 mb-2 font-fun">سوالات اشتباه ثبت‌شده ({wrongCount})</h4>
        <div className="max-h-44 overflow-y-auto space-y-1.5">
          {Object.keys(wrongDetails).map((id) => {
            const q = bank.find(b => b.id === id);
            if (!q) return null;
            const detail = wrongDetails[id];
            return (
              <div key={id} className="text-xs bg-slate-50 border-2 border-slate-200 rounded-xl p-2 flex justify-between gap-2 font-bold">
                <span className="truncate" dir="ltr">{questionLabel(q)}</span>
                <Badge tone="green">{detail.correctAnswer}</Badge>
              </div>
            );
          })}
          {wrongCount === 0 && <p className="text-center text-slate-400 text-xs py-3 font-bold">عالی! هیچ اشتباهی ثبت نشده 🎉</p>}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ماژول ۹: نوتیفیکیشن (NOTIFICATION MODULE)
   ============================================================ */
function NotificationModule({ role, settings, setSettings, hasPlayedToday }) {
  const hour = new Date().getHours();
  const showBanner = role === 'user' && settings.reminderEnabled && !hasPlayedToday && hour >= settings.reminderHour;
  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4 font-fa">
      {role === 'user' && (
        <div className="rounded-3xl border-[4px] border-slate-900 shadow-[8px_8px_0_0_#0f172a] overflow-hidden relative"
          style={{ background: 'linear-gradient(160deg,#f9a8d4 0%,#fbcfe8 60%,#fde68a 100%)' }}>
          <div className="flex justify-end px-3 pt-2"><XCircle size={20} className="text-slate-900/60" /></div>
          <div className="px-6 pb-6 text-center relative">
            <div className="inline-flex w-16 h-16 rounded-full bg-pink-500 border-[3px] border-slate-900 items-center justify-center -rotate-12 shadow-[4px_4px_0_0_#0f172a] mb-2">
              <Megaphone className="text-white" size={28} fill="currentColor" />
            </div>
            <p className="font-black text-slate-900 mt-2 text-lg font-fun leading-snug">
              {showBanner ? <>فقط ۱۰ دقیقه وقت،<br />چالش امروز منتظرته!</> : 'یادآور روزانه‌ی شما فعال است ✅'}
            </p>
            <p className="text-xs text-slate-700 mt-2 font-bold">یادآوری روزانه از طریق ایمیل، ساعت {settings.reminderHour}:۰۰</p>
          </div>
        </div>
      )}
      {(role === 'admin') && (
        <div className="rounded-3xl border-[4px] border-slate-900 shadow-[8px_8px_0_0_#0f172a] overflow-hidden bg-white">
          <WindowBar icon={<Bell size={13} className="text-slate-900" />} title="تنظیم یادآور ایمیلی" tone="#0f172a" dotBg="bg-pink-100" />
          <div className="p-4">
            <ToggleRowLight label="فعال‌سازی ارسال ایمیل یادآور" checked={settings.reminderEnabled} onChange={(v) => setSettings({ ...settings, reminderEnabled: v })} />
            <label className="block mt-3 text-xs text-slate-700 font-bold">
              ساعت ارسال: <b className="text-pink-600">{settings.reminderHour}:۰۰</b>
              <input type="range" min={10} max={18} value={settings.reminderHour} onChange={(e) => setSettings({ ...settings, reminderHour: Number(e.target.value) })} className="w-full mt-1 accent-pink-500" />
            </label>
            <button onClick={() => setSettings({ ...settings, reminderEnabled: true, reminderHour: 16 })}
              className="mt-3 text-xs text-blue-600 underline flex items-center gap-1 font-extrabold"><RotateCcw size={12} /> بازگشت به پیش‌فرض</button>
          </div>
        </div>
      )}
    </div>
  );
}
function ToggleRowLight({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between text-sm text-slate-800 font-extrabold">
      <span>{label}</span>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
  );
}

/* ============================================================
   ماژول ۱۰: مشارکت کاربران (PARTICIPATION MODULE) - US-24
   ============================================================ */
function ParticipationModule({ role, username, settings, proposals, setProposals, bank, setBank }) {
  const [form, setForm] = useState({ question: '', type: 'mc', options: ['', '', ''], correct: '', explanation: '', topic: TOPICS[0] });
  const [submitted, setSubmitted] = useState(false);

  if (!settings.questionProposalEnabled && role === 'user') {
    return <div className="p-8 text-center text-slate-400 text-sm font-bold font-fa">این قابلیت توسط ادمین غیرفعال است.</div>;
  }

  function submitProposal() {
    if (!form.question.trim() || !form.correct.trim()) return;
    setProposals([...proposals, { id: uid('prop'), ...form, by: username, at: new Date().toISOString(), status: 'pending' }]);
    setSubmitted(true);
    setForm({ question: '', type: 'mc', options: ['', '', ''], correct: '', explanation: '', topic: TOPICS[0] });
  }

  function decide(id, status) {
    const p = proposals.find((x) => x.id === id);
    setProposals(proposals.map((x) => (x.id === id ? { ...x, status } : x)));
    if (status === 'approved' && p) {
      setBank([{ id: uid(), type: p.type, question: p.question, options: p.options, correct: p.correct, explanation: p.explanation, topic: p.topic, difficulty: 'medium' }, ...bank]);
    }
  }

  if (role === 'admin') {
    const pending = proposals.filter((p) => p.status === 'pending');
    return (
      <div className="p-4 max-w-3xl mx-auto font-fa">
        <div className="rounded-3xl border-[4px] border-slate-900 shadow-[8px_8px_0_0_#0f172a] overflow-hidden bg-fuchsia-500">
          <WindowBar icon={<Send size={13} className="text-fuchsia-600" />} title="درخواست‌های سوالات جدید" tone="#ffffff" />
          <div className="p-4 space-y-2.5 max-h-80 overflow-y-auto">
            {pending.map((p) => (
              <div key={p.id} className="bg-white rounded-xl p-3 text-slate-900 text-xs border-[3px] border-slate-900 shadow-[3px_3px_0_0_#0f172a]">
                <p className="font-black" dir="ltr">{p.question}</p>
                <p className="text-slate-500 mt-1 font-bold">پیشنهاددهنده: {p.by} · {new Date(p.at).toLocaleDateString('fa-IR')} · پاسخ صحیح: {p.correct}</p>
                <div className="flex gap-2 mt-2">
                  <NeoButton onClick={() => decide(p.id, 'approved')} color="bg-emerald-300 text-emerald-950" className="px-3 py-1 text-xs flex items-center gap-1"><ThumbsUp size={12} /> تأیید</NeoButton>
                  <NeoButton onClick={() => decide(p.id, 'rejected')} color="bg-red-300 text-red-950" className="px-3 py-1 text-xs flex items-center gap-1"><ThumbsDown size={12} /> رد</NeoButton>
                </div>
              </div>
            ))}
            {pending.length === 0 && <p className="text-white/80 text-xs text-center py-4 font-bold">درخواست در انتظار بررسی وجود ندارد.</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto font-fa">
      <div className="rounded-3xl border-[4px] border-slate-900 shadow-[8px_8px_0_0_#0f172a] overflow-hidden bg-fuchsia-500">
        <WindowBar icon={<Send size={13} className="text-fuchsia-600" />} title="Submission Question" tone="#ffffff" />
        {submitted ? (
          <div className="p-6 text-center text-white text-sm font-bold">
            سوال شما با موفقیت ثبت شد و پس از بررسی توسط مدیر، در صورت تأیید به بانک سوالات اضافه می‌شود.
            <button onClick={() => setSubmitted(false)} className="block mx-auto mt-3 text-pink-100 underline text-xs font-extrabold">ارسال سوال دیگر</button>
          </div>
        ) : (
          <div className="p-4 space-y-2.5">
            <input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="متن سوال پیشنهادی"
              className="w-full rounded-lg px-3 py-2 text-sm bg-blue-700 text-white placeholder-blue-200 outline-none border-[2px] border-fuchsia-300 font-bold" />
            {form.options.map((o, i) => (
              <input key={i} value={o} onChange={(e) => { const opts = [...form.options]; opts[i] = e.target.value; setForm({ ...form, options: opts }); }}
                placeholder={`گزینه ${i + 1}`} className="w-full rounded-lg px-3 py-2 text-sm bg-blue-700 text-white placeholder-blue-200 outline-none border-[2px] border-fuchsia-300 font-bold" />
            ))}
            <input value={form.correct} onChange={(e) => setForm({ ...form, correct: e.target.value })} placeholder="پاسخ صحیح"
              className="w-full rounded-lg px-3 py-2 text-sm bg-blue-700 text-white placeholder-blue-200 outline-none border-[2px] border-fuchsia-300 font-bold" />
            <input value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} placeholder="توضیح (اختیاری)"
              className="w-full rounded-lg px-3 py-2 text-sm bg-blue-700 text-white placeholder-blue-200 outline-none border-[2px] border-fuchsia-300 font-bold" />
            <NeoButton onClick={submitProposal} color="bg-amber-300 text-amber-950" className="w-full py-2.5 text-sm">ارسال سوال پیشنهادی</NeoButton>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   ماژول ۱۱: چت (CHAT MODULE) — فقط برای کاربر عادی؛
   ادمین/مدیر فقط می‌توانند آن را از تنظیمات روشن/خاموش کنند (بدون دسترسی به تب چت)
   ============================================================ */
const MOCK_PLAYERS = ['Sara.M', 'Reza.K', 'Niloofar.T', 'Amir.H'];

function ChatModule({ role, username, settings, chatMessages, setChatMessages }) {
  const [tab, setTab] = useState(settings.chatEnabled ? 'team' : 'ai');
  const [input, setInput] = useState('');
  const [aiMsgs, setAiMsgs] = useState([{ role: 'ai', text: 'سلام! من دستیار آموزش زبان انگلیسی محیط‌کار هستم. هر سوالی دارید بپرسید 🙂' }]);
  const [aiLoading, setAiLoading] = useState(false);

  function sendTeamMessage() {
    if (!input.trim() || input.length > 100) return;
    setChatMessages([...chatMessages, { id: uid('msg'), by: username, text: input.trim(), at: new Date().toISOString() }]);
    setInput('');
  }

  async function sendAIMessage() {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setAiMsgs((m) => [...m, { role: 'user', text: userMsg }]);
    setInput(''); setAiLoading(true);
    const res = await askAI(`نقش تو دستیار آموزش زبان انگلیسی محیط‌کار برای کارمندان ایرانی است. کوتاه، دوستانه و کاربردی به فارسی پاسخ بده: ${userMsg}`);
    setAiLoading(false);
    setAiMsgs((m) => [...m, { role: 'ai', text: res || 'سرویس موقتاً در دسترس نیست.' }]);
  }

  if (!settings.chatEnabled && !settings.aiAssistantEnabled) {
    return <div className="p-8 text-center text-slate-400 text-sm font-bold font-fa">چت و دستیار هوش مصنوعی هر دو غیرفعال هستند.</div>;
  }

  return (
    <div className="p-4 max-w-3xl mx-auto font-fa">
      <div className="rounded-3xl border-[4px] border-slate-900 shadow-[8px_8px_0_0_#0f172a] overflow-hidden bg-blue-600 relative">
        <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500 rounded-bl-[80px] z-0 opacity-70" />
        <WindowBar icon={<MessageSquare size={13} className="text-blue-600" />} title="Chat" tone="#ffffff" />
        <div className="flex border-b-[3px] border-slate-900 relative z-10 bg-blue-600">
          {settings.chatEnabled && (
            <button onClick={() => setTab('team')} className={`flex-1 py-2.5 text-xs font-extrabold flex items-center justify-center gap-1.5 tracking-wide border-l-[2px] border-slate-900 ${tab === 'team' ? 'bg-yellow-300 text-slate-900' : 'text-white/70 hover:bg-blue-500'}`}>
              <MessageSquare size={14} /> گفتگو با همکاران
            </button>
          )}
          {settings.aiAssistantEnabled && (
            <button onClick={() => setTab('ai')} className={`flex-1 py-2.5 text-xs font-extrabold flex items-center justify-center gap-1.5 tracking-wide ${tab === 'ai' ? 'bg-yellow-300 text-slate-900' : 'text-white/70 hover:bg-blue-500'}`}>
              <Sparkles size={14} /> دستیار هوش مصنوعی
            </button>
          )}
        </div>

        {tab === 'team' && settings.chatEnabled && (
          <div className="flex relative z-10">
            <div className="flex-1 p-3">
              <div className="h-56 overflow-y-auto space-y-2 pr-1">
                {chatMessages.map((m) => (
                  <div key={m.id} className={`max-w-[75%] flex items-end gap-1.5 ${m.by === username ? 'mr-auto flex-row-reverse' : ''}`}>
                    <div className="w-7 h-7 rounded-full bg-pink-400 border-2 border-slate-900 shrink-0" />
                    <div className={`px-3 py-1.5 rounded-2xl text-xs font-bold border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] ${m.by === username ? 'bg-orange-400 text-slate-900' : 'bg-white text-slate-900'}`}>
                      <p className="font-black opacity-60 text-[10px]">{m.by}</p>{m.text}
                    </div>
                  </div>
                ))}
                {chatMessages.length === 0 && <p className="text-white/60 text-xs text-center mt-10 font-bold">هنوز پیامی ارسال نشده.</p>}
              </div>
              <div className="flex gap-2 mt-2">
                <input value={input} maxLength={100} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendTeamMessage()}
                  placeholder="پیام کوتاه (حداکثر ۱۰۰ کاراکتر)" className="flex-1 rounded-xl px-3 py-2 text-xs bg-white text-slate-900 placeholder-slate-400 outline-none border-[2px] border-slate-900 font-bold" />
                <button onClick={sendTeamMessage} className="bg-yellow-300 rounded-xl p-2.5 text-slate-900 border-[2px] border-slate-900 shadow-[2px_2px_0_0_#0f172a] hover:translate-y-0.5 hover:shadow-none transition"><Send size={14} /></button>
              </div>
              <p className="text-white/60 text-[10px] mt-1.5 font-bold">Limited to 100 characters</p>
            </div>
            <div className="w-32 border-r-[3px] border-slate-900 p-3 hidden sm:block bg-blue-800">
              <p className="text-white/70 text-[10px] mb-2 font-extrabold">Active Players</p>
              {MOCK_PLAYERS.map((p) => (
                <div key={p} className="flex items-center gap-1.5 mb-2">
                  <span className="w-5 h-5 rounded-full bg-yellow-400 border-2 border-slate-900" />
                  <span className="text-white/90 text-[10px] font-bold">{p}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'ai' && settings.aiAssistantEnabled && (
          <div className="p-3 relative z-10">
            <div className="h-56 overflow-y-auto space-y-2 pr-1">
              {aiMsgs.map((m, i) => (
                <div key={i} className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed font-bold border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] ${m.role === 'user' ? 'bg-orange-400 text-slate-900 mr-auto' : 'bg-white text-slate-900'}`}>{m.text}</div>
              ))}
              {aiLoading && <div className="bg-white/80 text-slate-500 text-xs px-3 py-2 rounded-xl w-fit font-bold border-2 border-slate-900">در حال نوشتن پاسخ…</div>}
            </div>
            <div className="flex gap-2 mt-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendAIMessage()}
                placeholder="سوالت رو از دستیار بپرس..." className="flex-1 rounded-xl px-3 py-2 text-xs bg-white text-slate-900 placeholder-slate-400 outline-none border-[2px] border-slate-900 font-bold" />
              <button onClick={sendAIMessage} className="bg-yellow-300 rounded-xl p-2.5 text-slate-900 border-[2px] border-slate-900 shadow-[2px_2px_0_0_#0f172a] hover:translate-y-0.5 hover:shadow-none transition"><Send size={14} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   ماژول ۱۲: برنامه اصلی (APP) - با کاربران نمونه
   ============================================================ */
export default function App() {
  const [booted, setBooted] = useState(false);
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('game');

  const [bank, setBank] = useState(DEFAULT_BANK);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [proposals, setProposals] = useState([]);
  const [logs, setLogs] = useState([]);
  const [editLog, setEditLog] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [userData, setUserData] = useState({ totalPoints: 0, history: [], wrongMap: {}, wrongDetails: {}, lastPlayedDate: null, activeStage: null });
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    (async () => {
      const [b, s, p, l, c] = await Promise.all([
        loadKey(SK.BANK, true, DEFAULT_BANK),
        loadKey(SK.SETTINGS, true, DEFAULT_SETTINGS),
        loadKey(SK.PROPOSALS, true, []),
        loadKey(SK.LOGS, true, []),
        loadKey(SK.CHAT, true, []),
      ]);
      setBank(b); setSettings(s); setProposals(p); setLogs(l); setChatMessages(c);
      setBooted(true);
    })();
  }, []);

  useEffect(() => { if (booted) saveKey(SK.BANK, bank, true); }, [bank, booted]);
  useEffect(() => { if (booted) saveKey(SK.SETTINGS, settings, true); }, [settings, booted]);
  useEffect(() => { if (booted) saveKey(SK.PROPOSALS, proposals, true); }, [proposals, booted]);
  useEffect(() => { if (booted) saveKey(SK.LOGS, logs.slice(-200), true); }, [logs, booted]);
  useEffect(() => { if (booted) saveKey(SK.CHAT, chatMessages.slice(-100), true); }, [chatMessages, booted]);

  async function handleLogin(username, role) {
    const existing = await loadKey(SK.USER(username), true, null);
    const ud = existing || { totalPoints: 0, history: [], wrongMap: {}, wrongDetails: {}, lastPlayedDate: null, activeStage: null };
    setUserData(ud);
    setSession({ username, role });
    setActiveTab(role === 'admin' ? 'admin' : role === 'manager' ? 'report' : 'game');

    if (role !== 'manager') {
      const knownUsers = await loadKey('app:knownUsers', true, []);
      if (!knownUsers.includes(username)) {
        await saveKey('app:knownUsers', [...knownUsers, username], true);
        // ذخیره role کاربر در داده‌های کاربری
        await saveKey(SK.USER(username), { ...ud, role }, true);
      }
    }
  }

  useEffect(() => {
    if (!session) return;
    saveKey(SK.USER(session.username), { ...userData, role: session.role }, true);
  }, [userData, session]);

  useEffect(() => {
    if (!session || (session.role !== 'manager' && session.role !== 'admin')) return;
    (async () => {
      const knownUsers = await loadKey('app:knownUsers', true, []);
      const list = await Promise.all(knownUsers.map(async (u) => {
        const data = await loadKey(SK.USER(u), true, {});
        return { username: u, ...data };
      }));
      setAllUsers(list);
    })();
  }, [session, activeTab]);

  function handleLogout() { setSession(null); }

  if (!booted) {
    return <div className="min-h-[500px] flex items-center justify-center text-slate-400 font-bold font-fa">در حال بارگذاری…</div>;
  }
  if (!session) return <LoginScreen onLogin={handleLogin} />;

  const { username, role } = session;
  const hasPlayedToday = userData.lastPlayedDate === todayStr();
  const gameIsActive = activeTab === 'game' && !!userData.activeStage && !userData.activeStage.finished;

  const tabs = [];
  if (role === 'user') {
    tabs.push({ key: 'game', label: 'بازی روزانه', icon: <Trophy size={14} /> });
    tabs.push({ key: 'profile', label: 'پروفایل من', icon: <User size={14} /> });
    if (settings.questionProposalEnabled) tabs.push({ key: 'participate', label: 'پیشنهاد سوال', icon: <Plus size={14} /> });
    if (settings.chatEnabled || settings.aiAssistantEnabled) tabs.push({ key: 'chat', label: 'چت', icon: <MessageSquare size={14} /> });
    tabs.push({ key: 'notify', label: 'یادآور', icon: <Bell size={14} /> });
  }
  if (role === 'admin') {
    // توجه: طبق درخواست، ادمین فقط می‌تواند چت را روشن/خاموش کند (در تب «مدیریت محتوا»)
    // و خودش به تب گفتگو/چت دسترسی ندارد.
    tabs.push({ key: 'admin', label: 'مدیریت محتوا', icon: <Settings size={14} /> });
    tabs.push({ key: 'participate', label: 'سوالات پیشنهادی', icon: <Plus size={14} /> });
    tabs.push({ key: 'notify', label: 'یادآور', icon: <Bell size={14} /> });
    tabs.push({ key: 'game', label: 'پیش‌نمایش بازی', icon: <Trophy size={14} /> });
  }
  if (role === 'manager') {
    // مدیر هم به چت دسترسی ندارد و به پروفایل نیازی ندارد.
    tabs.push({ key: 'report', label: 'گزارش‌گیری', icon: <BarChart3 size={14} /> });
  }

  return (
    <div className="min-h-[640px] bg-pink-50 rounded-3xl overflow-hidden flex flex-col border-[4px] border-slate-900 font-fa" dir="rtl">
      <GlobalStyle />
      <TopBar username={username} role={role} points={userData.totalPoints || 0} onLogout={handleLogout}
        dailyDone={userData.activeStage ? userData.activeStage.results?.length || 0 : 0}
        dailyTotal={settings.questionsPerStage} paused={!!userData.activeStage?.paused}
        showPause={gameIsActive}
        onTogglePause={() => setUserData((p) => ({ ...p, activeStage: { ...p.activeStage, paused: !p.activeStage.paused } }))} />
      <TabNav tabs={tabs} active={activeTab} onChange={setActiveTab} />
      <div className="flex-1 bg-pink-50 p-2">
        {activeTab === 'game' && (
          <GameModule username={username} role={role} settings={settings} bank={bank} userData={userData}
            setUserData={setUserData} aiEnabled={settings.aiAssistantEnabled}
            onLog={(entry) => setLogs((l) => [...l, { id: uid('log'), ...entry }])} />
        )}
        {activeTab === 'admin' && (
          <AdminContentModule bank={bank} setBank={setBank} settings={settings} setSettings={setSettings} editLog={editLog} setEditLog={setEditLog} />
        )}
        {activeTab === 'report' && <ReportingModule allUsers={allUsers} settings={settings} setSettings={setSettings} logs={logs} role={role} />}
        {activeTab === 'profile' && <ProfileModule username={username} userData={userData} bank={bank} />}
        {activeTab === 'notify' && <NotificationModule role={role} settings={settings} setSettings={setSettings} hasPlayedToday={hasPlayedToday} />}
        {activeTab === 'participate' && (
          <ParticipationModule role={role} username={username} settings={settings} proposals={proposals} setProposals={setProposals} bank={bank} setBank={setBank} />
        )}
        {activeTab === 'chat' && <ChatModule role={role} username={username} settings={settings} chatMessages={chatMessages} setChatMessages={setChatMessages} />}
      </div>
      <div className="px-4 py-2 bg-slate-900 text-center text-[10px] text-slate-300 flex items-center justify-center gap-1.5 font-bold">
        <Globe size={11} /> تحت وب · واکنش‌گرا · بدون نیاز به نصب · دسترسی فقط از شبکه داخلی
      </div>
    </div>
  );
}
