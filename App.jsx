// ============================================
// REACT ПРИЛОЖЕНИЕ — ОСНОВНЫЕ КОМПОНЕНТЫ
// ============================================

import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

// Цвета из дизайна Figma
const colors = {
  bg: '#1a1a2e',
  card: '#16213e',
  input: '#0f3460',
  red: '#e94560',
  green: '#4ecdc4',
  text: '#ffffff',
  gray: '#8899aa'
};

// ============================================
// ЭКРАН 1: ЛОГИН
// ============================================
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success) onLogin(data.user);
  };

  return (
    <div style={{ background: colors.bg, height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ background: colors.card, borderRadius: 20, padding: 48, width: 440, textAlign: 'center' }}>
        <h1 style={{ color: colors.text, fontSize: 42 }}>Quiz<span style={{ color: colors.red }}>Master</span></h1>
        <p style={{ color: colors.gray, marginBottom: 36 }}>Войдите в аккаунт</p>
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
          style={{ width: '100%', padding: 14, background: colors.input, border: 'none', borderRadius: 10, color: colors.text, marginBottom: 16 }} />
        <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)}
          style={{ width: '100%', padding: 14, background: colors.input, border: 'none', borderRadius: 10, color: colors.text, marginBottom: 28 }} />
        <button onClick={handleLogin}
          style={{ width: '100%', padding: 14, background: colors.red, color: colors.text, border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
          Войти
        </button>
      </div>
    </div>
  );
}

// ============================================
// ЭКРАН 2: ПАНЕЛЬ ОРГАНИЗАТОРА
// ============================================
function Dashboard({ user }) {
  return (
    <div style={{ background: colors.bg, display: 'flex', height: '100vh', color: colors.text }}>
      <div style={{ width: 260, background: colors.card, padding: 32 }}>
        <h2>Quiz<span style={{ color: colors.red }}>Master</span></h2>
        <div style={{ color: colors.red, marginTop: 40 }}>📊 Мои квизы</div>
        <div style={{ color: colors.gray, marginTop: 12 }}>➕ Создать квиз</div>
        <div style={{ color: colors.gray, marginTop: 12 }}>📋 История</div>
      </div>
      <div style={{ flex: 1, padding: 40 }}>
        <h1>Добро пожаловать, {user.nickname}!</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 36 }}>
          <div style={{ background: colors.card, borderRadius: 14, padding: 24, borderLeft: `4px solid ${colors.red}` }}>
            <div style={{ fontSize: 32, fontWeight: 700 }}>12</div>
            <div style={{ color: colors.gray }}>Всего квизов</div>
          </div>
          <div style={{ background: colors.card, borderRadius: 14, padding: 24, borderLeft: `4px solid ${colors.red}` }}>
            <div style={{ fontSize: 32, fontWeight: 700 }}>340</div>
            <div style={{ color: colors.gray }}>Участников</div>
          </div>
          <div style={{ background: colors.card, borderRadius: 14, padding: 24, borderLeft: `4px solid ${colors.red}` }}>
            <div style={{ fontSize: 32, fontWeight: 700 }}>78%</div>
            <div style={{ color: colors.gray }}>Средний балл</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// ЭКРАН 3: КОМНАТА ОЖИДАНИЯ
// ============================================
function WaitingRoom({ roomCode, participants, isOrganizer, onStart }) {
  return (
    <div style={{ background: colors.bg, height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: colors.text }}>
      <h2>Код комнаты</h2>
      <div style={{ fontSize: 72, fontWeight: 700, color: colors.green, letterSpacing: 12 }}>{roomCode}</div>
      <p style={{ color: colors.gray, marginTop: 8 }}>Поделитесь этим кодом с участниками</p>
      
      <div style={{ background: colors.card, borderRadius: 14, padding: 24, width: 400, marginTop: 40 }}>
        <h3>Участники ({participants.length})</h3>
        {participants.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #1a3050' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: colors.red, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {p.nickname[0]}
            </div>
            <span>{p.nickname}</span>
            <span style={{ color: colors.green, marginLeft: 'auto' }}>Готов ✓</span>
          </div>
        ))}
      </div>
      
      {isOrganizer && (
        <button onClick={onStart} style={{ marginTop: 32, padding: '16px 48px', background: colors.green, color: '#fff', border: 'none', borderRadius: 10, fontSize: 18, cursor: 'pointer' }}>
          Начать квиз
        </button>
      )}
    </div>
  );
}

// ============================================
// ЭКРАН 4: LIVE ВОПРОС
// ============================================
function LiveQuestion({ question, questionIndex, totalQuestions, timeLeft, onAnswer }) {
  return (
    <div style={{ background: colors.bg, height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: colors.text, padding: 40 }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', border: `4px solid ${colors.red}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700 }}>
        {timeLeft}
      </div>
      <div style={{ color: colors.gray, marginTop: 8 }}>Вопрос {questionIndex + 1} из {totalQuestions}</div>
      <div style={{ fontSize: 28, fontWeight: 600, marginTop: 36, textAlign: 'center' }}>{question.text}</div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: 500, marginTop: 40 }}>
        {question.answers.map((a, i) => (
          <button key={i} onClick={() => onAnswer(i)}
            style={{ background: colors.card, border: '2px solid #1a4060', borderRadius: 12, padding: 18, color: colors.text, textAlign: 'left', cursor: 'pointer', fontSize: 16 }}>
            <span style={{ color: colors.red, fontWeight: 700, marginRight: 12 }}>{String.fromCharCode(65 + i)}</span>
            {a.text}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================
// ЭКРАН 5: ЛИДЕРБОРД
// ============================================
function Leaderboard({ results }) {
  return (
    <div style={{ background: colors.bg, height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: colors.text, padding: 40 }}>
      <h1 style={{ fontSize: 32, marginBottom: 40 }}>🏆 Итоги квиза</h1>
      
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, marginBottom: 48 }}>
        {results.slice(0, 3).map((p, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: i === 0 ? 56 : 40 }}>{['🥇', '🥈', '🥉'][i]}</div>
            <div style={{ fontSize: i === 0 ? 28 : 20, fontWeight: 700 }}>{p.score}</div>
            <div>{p.nickname}</div>
          </div>
        ))}
      </div>
      
      {results.slice(3).map((p, i) => (
        <div key={i} style={{ display: 'flex', width: 400, padding: '8px 0', borderBottom: '1px solid #1a3050' }}>
          <span style={{ width: 40 }}>{p.rank}</span>
          <span style={{ flex: 1 }}>{p.nickname}</span>
          <span style={{ fontWeight: 600 }}>{p.score}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================
// ГЛАВНЫЙ КОМПОНЕНТ
// ============================================
export default function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState('login');

  const handleLogin = (userData) => {
    setUser(userData);
    setScreen(userData.role === 'organizer' ? 'dashboard' : 'join');
  };

  return (
    <>
      {screen === 'login' && <LoginScreen onLogin={handleLogin} />}
      {screen === 'dashboard' && <Dashboard user={user} />}
      {/* Остальные экраны переключаются через состояние screen */}
    </>
  );
}