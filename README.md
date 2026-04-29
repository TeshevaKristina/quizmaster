# QuizMaster

Веб-приложение для проведения квизов в реальном времени.

## Ссылка на макеты Figma
[Дизайн в Figma](https://www.figma.com/design/YUj44obPshCys9x5h88kSl/QuizMaster-%E2%80%94-Design?node-id=6-338&t=KnlV68Yzaj8wMMVY-1)

## Стек
- React
- Node.js + Express
- Socket.IO
- JSON (файловая база данных)

## Как запустить

### 1. Установите Node.js
Скачайте с [nodejs.org](https://nodejs.org) (версия LTS)

### 2. Скачайте проект
git clone https://github.com/MarchenkoElisabeth/quiz_app.git
cd quiz_app

### 3. Установите зависимости сервера
npm install express socket.io cors

### 4. Запустите сервер
node server.js

### 5. В новом терминале — клиент
cd client
npm install
npm start

Приложение откроется на http://localhost:3000

## Как тестировать
1. Зарегистрируйте организатора (роль: organizer)
2. Зарегистрируйте участника в другой вкладке (роль: participant)
3. Организатор создаёт квиз и запускает
4. Участник вводит код комнаты и подключается
5. Организатор нажимает «Начать квиз»

## Функции
- Регистрация / вход (организатор и участник)
- Создание квизов с вопросами
- Комнаты по коду
- Live-вопросы с таймером
- Автопереход при ответе всех
- Лидерборд с медалями
- История игр