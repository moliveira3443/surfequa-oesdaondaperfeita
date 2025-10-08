import React, { useState, useEffect, useCallback } from 'react';
import { generateQuestion, getSolutionExplanation } from './services/geminiService';
import type { Question, GameState } from './types';
import QuestionCard from './components/QuestionCard';
import FeedbackCard from './components/FeedbackCard';
import Scoreboard from './components/Scoreboard';

const TOTAL_QUESTIONS = 15;

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState(0);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState({ x: '', y: '' });
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);

  const fetchNewQuestion = useCallback(async () => {
    setGameState('loading');
    setCurrentQuestion(null);
    setUserAnswer({ x: '', y: '' });
    setIsCorrect(null);
    setExplanation(null);
    try {
      const question = await generateQuestion();
      setCurrentQuestion(question);
      setGameState('playing');
    } catch (error) {
        console.error("Failed to fetch new question", error);
        // Handle error, maybe show a message and a retry button
        setGameState('start'); // or an 'error' state
    }
  }, []);

  const handleStartGame = () => {
    setScore(0);
    setQuestionNumber(1);
    fetchNewQuestion();
  };
  
  const handleAnswerSubmit = async (xStr: string, yStr: string) => {
    if (!currentQuestion) return;

    const x = parseFloat(xStr);
    const y = parseFloat(yStr);

    const { equation1, equation2 } = currentQuestion;
    
    const result1 = equation1.a * x + equation1.b * y;
    const result2 = equation2.a * x + equation2.b * y;

    // Use a small tolerance for floating point comparison
    const isCorrectResult = Math.abs(result1 - equation1.c) < 0.001 && Math.abs(result2 - equation2.c) < 0.001;

    if (isCorrectResult) {
      setIsCorrect(true);
      setScore(prev => prev + 10);
      setGameState('feedback');
    } else {
      setIsCorrect(false);
      setGameState('feedback');
      setIsLoadingExplanation(true);
      const expl = await getSolutionExplanation(equation1, equation2);
      setExplanation(expl);
      setIsLoadingExplanation(false);
    }
  };

  const handleNextQuestion = () => {
    if (questionNumber < TOTAL_QUESTIONS) {
        setQuestionNumber(prev => prev + 1);
        fetchNewQuestion();
    } else {
        setGameState('end');
    }
  };

  const renderContent = () => {
    switch (gameState) {
      case 'loading':
        return (
          <div className="flex flex-col items-center text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
            <p className="text-2xl font-semibold text-blue-800">Buscando a onda perfeita...</p>
          </div>
        );
      case 'playing':
        return currentQuestion && (
          <QuestionCard
            question={currentQuestion}
            onAnswerSubmit={handleAnswerSubmit}
            userAnswer={userAnswer}
            setUserAnswer={setUserAnswer}
          />
        );
      case 'feedback':
        return currentQuestion && isCorrect !== null && (
          <FeedbackCard
            isCorrect={isCorrect}
            question={currentQuestion}
            userAnswer={userAnswer}
            explanation={explanation}
            onNextQuestion={handleNextQuestion}
            isLoadingExplanation={isLoadingExplanation}
          />
        );
      case 'end':
        return (
            <div className="text-center bg-white p-8 rounded-xl shadow-lg">
                <h1 className="text-3xl font-bold text-blue-900 mb-4">Fim de Jogo!</h1>
                <p className="text-xl text-gray-700 mb-6">Sua pontuação final foi:</p>
                <p className="text-6xl font-extrabold text-blue-600 mb-8">{score}</p>
                <button
                  onClick={handleStartGame}
                  className="bg-blue-600 text-white font-bold py-3 px-6 rounded-full text-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300 transform hover:scale-105"
                >
                  Jogar Novamente
                </button>
            </div>
        );
      case 'start':
      default:
        return (
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 mb-2">Surf Math</h1>
            <p className="text-xl text-blue-700 mb-8">Aprenda equações e pegue a onda perfeita!</p>
            <button
              onClick={handleStartGame}
              className="bg-blue-600 text-white font-bold py-4 px-8 rounded-full text-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300 transform hover:scale-105"
            >
              Começar a Jogar
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-blue-100 flex items-center justify-center p-4 font-sans relative">
      {gameState !== 'start' && gameState !== 'end' && (
        <Scoreboard 
            score={score} 
            questionNumber={questionNumber}
            totalQuestions={TOTAL_QUESTIONS}
        />
      )}
      <div className="w-full max-w-3xl mx-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default App;