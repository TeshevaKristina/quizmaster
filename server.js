const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

const DB = path.join(__dirname, 'data');
if (!fs.existsSync(DB)) fs.mkdirSync(DB);

function load(f) {
  const p = path.join(DB, `${f}.json`);
  if (!fs.existsSync(p)) { fs.writeFileSync(p, '[]'); return []; }
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}
function save(f, d) { fs.writeFileSync(path.join(DB, `${f}.json`), JSON.stringify(d, null, 2)); }
function add(f, item) {
  const d = load(f);
  item._id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  item.createdAt = new Date().toISOString();
  d.push(item); save(f, d);
  return item;
}
function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; } return 'h_' + Math.abs(h).toString(36); }
function code() { return Math.random().toString(36).slice(2, 8).toUpperCase(); }
function formatTime(seconds) {
  if (!seconds || seconds <= 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const rooms = {};

// ====== API ======
app.post('/api/register', (req, res) => {
  const { email, password, nickname, role } = req.body;
  if (!email || !password || !nickname) return res.json({ success: false, error: 'Все поля обязательны' });
  if (load('users').find(u => u.email === email)) return res.json({ success: false, error: 'Email занят' });
  const u = add('users', { email, password: hash(password), nickname, role: role || 'participant', stats: { played: 0, created: 0, points: 0, wins: 0 } });
  res.json({ success: true, user: { id: u._id, nickname: u.nickname, email: u.email, role: u.role, stats: u.stats } });
});

app.post('/api/login', (req, res) => {
  const u = load('users').find(u => u.email === req.body.email && u.password === hash(req.body.password));
  if (!u) return res.json({ success: false, error: 'Неверные данные' });
  res.json({ success: true, user: { id: u._id, nickname: u.nickname, email: u.email, role: u.role, stats: u.stats } });
});

app.post('/api/quizzes', (req, res) => {
  const q = add('quizzes', { ...req.body, roomCode: code(), status: 'draft', questions: req.body.questions || [] });
  res.json(q);
});

app.get('/api/quizzes/:uid', (req, res) => {
  res.json(load('quizzes').filter(q => q.organizerId === req.params.uid));
});

app.get('/api/history/:uid', (req, res) => {
  res.json(load('history').filter(h => h.participants && h.participants.some(p => p.userId === req.params.uid)));
});

// ====== SOCKET.IO ======
io.on('connection', (socket) => {
  console.log('🟢', socket.id);

  socket.on('create-room', ({ quizId, roomCode }) => {
    const quizzes = load('quizzes');
    const quiz = quizzes.find(q => q._id === quizId);
    if (!quiz) return socket.emit('error', { message: 'Квиз не найден' });
    const c = roomCode || code();
    rooms[c] = {
      quiz, organizerSid: socket.id, participants: [],
      currentQuestionIndex: 0, answeredInCurrentRound: 0
    };
    socket.join(c);
    socket.emit('room-created', { roomCode: c, participants: [], isOrganizer: true });
  });

  socket.on('join-room', ({ roomCode, nickname, userId }) => {
    const room = rooms[roomCode];
    if (!room) return socket.emit('error', { message: 'Комната не найдена' });
    if (socket.id === room.organizerSid) return;
    if (!room.participants.find(p => p.sid === socket.id)) {
      room.participants.push({ sid: socket.id, userId, nickname, score: 0, totalTime: 0, answeredQuestions: [] });
    }
    socket.join(roomCode);
    const list = room.participants.map(p => ({ nickname: p.nickname, score: p.score }));
    socket.emit('room-state', { roomCode, participants: list, isOrganizer: false });
    io.to(roomCode).emit('participants-updated', { participants: list });
  });

  socket.on('start-question', ({ roomCode, questionIndex }) => {
    const room = rooms[roomCode];
    if (!room) return;
    const question = room.quiz.questions[questionIndex || 0];
    if (!question) return;
    room.currentQuestionIndex = questionIndex || 0;
    room.answeredInCurrentRound = 0;
    io.to(roomCode).emit('show-question', {
      question, questionIndex: questionIndex || 0,
      totalQuestions: room.quiz.questions.length,
      timeLimit: question.timeLimit || 30, roomCode
    });
  });

  socket.on('next-question', ({ roomCode, questionIndex }) => {
    const room = rooms[roomCode];
    if (!room) return;
    const question = room.quiz.questions[questionIndex];
    if (!question) return;
    room.currentQuestionIndex = questionIndex;
    room.answeredInCurrentRound = 0;
    io.to(roomCode).emit('show-question', {
      question, questionIndex,
      totalQuestions: room.quiz.questions.length,
      timeLimit: question.timeLimit || 30, roomCode
    });
  });

  socket.on('submit-answer', ({ roomCode, questionIndex, answerIndex, timeSpent }) => {
    const room = rooms[roomCode];
    if (!room || socket.id === room.organizerSid) return;
    const user = room.participants.find(p => p.sid === socket.id);
    if (!user) return;
    if (!user.answeredQuestions) user.answeredQuestions = [];
    if (user.answeredQuestions.includes(questionIndex)) return;
    user.answeredQuestions.push(questionIndex);
    const question = room.quiz.questions[questionIndex];
    if (!question) return;
    const isCorrect = question.answers[answerIndex]?.isCorrect || false;
    if (isCorrect) {
      const points = Math.max(10, (question.points || 100) - Math.floor((timeSpent || 0) * 2));
      user.score += points;
    }
    user.totalTime += (timeSpent || 0);
    room.answeredInCurrentRound++;
    io.to(roomCode).emit('answer-stats', {
      totalAnswered: room.answeredInCurrentRound,
      totalParticipants: room.participants.length
    });
    if (room.answeredInCurrentRound >= room.participants.length) {
      setTimeout(() => {
        if (!rooms[roomCode]) return;
        const nextIndex = questionIndex + 1;
        const nextQuestion = room.quiz.questions[nextIndex];
        if (nextQuestion) {
          room.currentQuestionIndex = nextIndex;
          room.answeredInCurrentRound = 0;
          io.to(roomCode).emit('show-question', {
            question: nextQuestion, questionIndex: nextIndex,
            totalQuestions: room.quiz.questions.length,
            timeLimit: nextQuestion.timeLimit || 30, roomCode
          });
        } else {
          finishQuiz(roomCode);
        }
      }, 1500);
    }
  });

  socket.on('show-leaderboard', ({ roomCode }) => finishQuiz(roomCode));

  function finishQuiz(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;
    const playersOnly = room.participants.filter(p => p.sid !== room.organizerSid);
    const leaderboard = playersOnly
      .sort((a, b) => b.score - a.score)
      .map((p, i) => ({ nickname: p.nickname, score: p.score, rank: i + 1, time: formatTime(p.totalTime || 0) }));
    io.to(roomCode).emit('leaderboard', { leaderboard });
    add('history', { roomCode, quizTitle: room.quiz.title, organizerId: room.quiz.organizerId, participants: room.participants, leaderboard, finishedAt: new Date().toISOString() });
    delete rooms[roomCode];
  }

  socket.on('disconnect', () => {
    Object.keys(rooms).forEach(code => {
      const idx = rooms[code].participants.findIndex(p => p.sid === socket.id);
      if (idx !== -1) {
        rooms[code].participants.splice(idx, 1);
        io.to(code).emit('participants-updated', {
          participants: rooms[code].participants.map(p => ({ nickname: p.nickname, score: p.score }))
        });
      }
    });
  });
});

server.listen(3001, () => console.log('🚀 Сервер на 3001'));