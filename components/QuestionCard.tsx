import React from 'react';
import type { Question } from '../types';

interface QuestionCardProps {
  question: Question;
  onAnswerSubmit: (x: string, y: string) => void;
  userAnswer: { x: string; y: string };
  setUserAnswer: (answer: { x: string; y: string }) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, onAnswerSubmit, userAnswer, setUserAnswer }) => {
  const { problemText, equation1, equation2, variableX, variableY } = question;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnswerSubmit(userAnswer.x, userAnswer.y);
  };

  const formatEquation = (eq: {a: number, b: number, c: number}) => {
    const {a, b, c} = eq;
    const formatCoefficient = (coeff: number, isFirst: boolean = false) => {
        if (isFirst) {
          return coeff === 1 ? '' : coeff === -1 ? '-' : `${coeff}`;
        }
        if (coeff > 0) {
          return `+ ${coeff === 1 ? '' : coeff}`;
        }
        return `- ${Math.abs(coeff) === 1 ? '' : Math.abs(coeff)}`;
      };
      return `${formatCoefficient(a, true)}x ${formatCoefficient(b)}y = ${c}`;
  }


  return (
    <div className="w-full max-w-2xl bg-white p-6 md:p-8 rounded-xl shadow-lg border border-gray-200">
      <p className="text-lg text-gray-700 mb-4">{problemText}</p>
      <div className="bg-blue-100 p-4 rounded-lg text-center my-6 space-y-2">
        <p className="text-xl md:text-2xl font-bold text-blue-900 tracking-wider">
          {formatEquation(equation1)}
        </p>
        <p className="text-xl md:text-2xl font-bold text-blue-900 tracking-wider">
          {formatEquation(equation2)}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
          <div className="flex-1">
            <label htmlFor="x" className="block text-sm font-medium text-gray-700 mb-1">{variableX}</label>
            <input
              type="number"
              id="x"
              name="x"
              value={userAnswer.x}
              onChange={(e) => setUserAnswer({ ...userAnswer, x: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Valor de x"
              required
            />
          </div>
          <div className="flex-1">
            <label htmlFor="y" className="block text-sm font-medium text-gray-700 mb-1">{variableY}</label>
            <input
              type="number"
              id="y"
              name="y"
              value={userAnswer.y}
              onChange={(e) => setUserAnswer({ ...userAnswer, y: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Valor de y"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300"
        >
          Verificar Resposta
        </button>
      </form>
    </div>
  );
};

export default QuestionCard;