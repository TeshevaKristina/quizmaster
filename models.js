// ============================================
// МОДЕЛЬ БАЗЫ ДАННЫХ QUIZMASTER
// ============================================

const mongoose = require('mongoose');

// 1. ПОЛЬЗОВАТЕЛЬ
const UserSchema = new mongoose.Schema({
  email:        { type: String, required: true, unique: true },
  password:     { type: String, required: true },
  nickname:     { type: String, required: true },
  role:         { type: String, enum: ['organizer', 'participant'], default: 'participant' },
  avatarColor:  { type: String, default: '#e94560' },
  createdAt:    { type: Date, default: Date.now },
  stats: {
    quizzesPlayed:  { type: Number, default: 0 },
    quizzesCreated: { type: Number, default: 0 },
    totalPoints:    { type: Number, default: 0 },
    wins:           { type: Number, default: 0 }
  }
});

// 2. ВОПРОС (вложенная схема)
const QuestionSchema = new mongoose.Schema({
  type:           { type: String, enum: ['text', 'image'], default: 'text' },
  questionText:   { type: String, required: true },
  imageUrl:       { type: String, default: null },
  multipleChoice: { type: Boolean, default: false },
  timeLimit:      { type: Number, default: 30 },
  points:         { type: Number, default: 100 },
  answers: [{
    text:      { type: String, required: true },
    isCorrect: { type: Boolean, default: false }
  }]
});

// 3. КВИЗ
const QuizSchema = new mongoose.Schema({
  title:           { type: String, required: true },
  description:     { type: String, default: '' },
  organizerId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category:        { type: String, default: 'Общее' },
  duration:        { type: Number, default: 30 },
  maxParticipants: { type: Number, default: 50 },
  roomCode:        { type: String, unique: true },
  questions:       [QuestionSchema],
  status:          { type: String, enum: ['draft', 'active', 'finished'], default: 'draft' },
  createdAt:       { type: Date, default: Date.now }
});

// 4. ИГРОВАЯ СЕССИЯ
const GameSessionSchema = new mongoose.Schema({
  quizId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  roomCode:        { type: String, required: true },
  currentQuestion: { type: Number, default: -1 },
  status:          { type: String, enum: ['waiting', 'in_progress', 'finished'], default: 'waiting' },
  participants: [{
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    nickname: { type: String },
    score:    { type: Number, default: 0 },
    answers: [{
      questionIndex:  { type: Number },
      selectedAnswer: { type: Number },
      isCorrect:      { type: Boolean },
      timeSpent:      { type: Number },
      pointsEarned:   { type: Number }
    }]
  }],
  startedAt:  { type: Date },
  finishedAt: { type: Date }
});

// Экспорт
module.exports = {
  User:        mongoose.model('User', UserSchema),
  Quiz:        mongoose.model('Quiz', QuizSchema),
  GameSession: mongoose.model('GameSession', GameSessionSchema)
};