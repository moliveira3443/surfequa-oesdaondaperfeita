import React from 'react';
import type { Question } from '../types';
import EquationGraph from './EquationGraph';
import WaveVisualization from './WaveVisualization';

interface FeedbackCardProps {
  isCorrect: boolean;
  question: Question;
  userAnswer: { x: string; y: string };
  explanation: string | null;
  onNextQuestion: () => void;
  isLoadingExplanation: boolean;
}

const FeedbackCard: React.FC<FeedbackCardProps> = ({ isCorrect, question, userAnswer, explanation, onNextQuestion, isLoadingExplanation }) => {
  return (
    <div className={`w-full max-w-2xl bg-white p-6 md:p-8 rounded-xl shadow-lg border-2 ${isCorrect ? 'border-green-400' : 'border-red-400'}`}>
      {isCorrect ? (
        <div>
          <h2 className="text-2xl font-bold text-green-600 mb-4 text-center">Parabéns! Você acertou!</h2>
          <p className="text-center text-gray-700 mb-4">Você encontrou a combinação perfeita para a onda!</p>
          <WaveVisualization x={parseFloat(userAnswer.x)} y={parseFloat(userAnswer.y)} />
          <EquationGraph equation1={question.equation1} equation2={question.equation2} />
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-bold text-red-600 mb-4 text-center">Quase lá!</h2>
          <p className="text-center text-gray-700 mb-4">Essa combinação não forma a onda perfeita. Veja a resolução correta abaixo:</p>
          {isLoadingExplanation ? (
             <div className="flex justify-center items-center my-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="ml-3 text-gray-600">Gerando a explicação...</p>
             </div>
          ) : (
            <div className="bg-orange-50 p-4 rounded-lg my-4 border border-orange-200">
               <h3 className="font-semibold text-lg text-orange-800 mb-2">Passo a passo:</h3>
               <p className="text-gray-800 whitespace-pre-wrap">{explanation}</p>
            </div>
          )}
          <EquationGraph equation1={question.equation1} equation2={question.equation2} />
        </div>
      )}
      <button
        onClick={onNextQuestion}
        className="w-full mt-6 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300"
      >
        Próxima Pergunta
      </button>
    </div>
  );
};

export default FeedbackCard;