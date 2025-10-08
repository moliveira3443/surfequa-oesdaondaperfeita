
import React from 'react';

interface ScoreboardProps {
  score: number;
  questionNumber: number;
  totalQuestions: number;
}

const Scoreboard: React.FC<ScoreboardProps> = ({ score, questionNumber, totalQuestions }) => {
  return (
    <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-md border border-blue-200 flex items-center space-x-4">
      <div className="text-center">
        <div className="text-xs font-bold text-gray-500 uppercase">Questão</div>
        <div className="text-lg font-bold text-blue-900">{questionNumber}/{totalQuestions}</div>
      </div>
      <div className="border-l h-8 border-gray-300"></div>
      <div className="text-center">
        <div className="text-xs font-bold text-gray-500 uppercase">Pontos</div>
        <div className="text-lg font-bold text-blue-900">{score}</div>
      </div>
    </div>
  );
};

export default Scoreboard;