import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";
import { Line, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Scatter, ScatterChart } from 'recharts';

// --- TIPOS (de types.ts) ---
interface Equation {
  a: number;
  b: number;
  c: number;
}

interface Question {
  problemText: string;
  equation1: Equation;
  equation2: Equation;
  variableX: string;
  variableY: string;
}

type GameState = 'start' | 'loading' | 'playing' | 'feedback' | 'end';

// --- SERVIÇO GEMINI (de services/geminiService.ts) ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const equationSchema = {
  type: Type.OBJECT,
  properties: {
    a: { type: Type.INTEGER, description: "Um inteiro não-nulo entre -10 e 10." },
    b: { type: Type.INTEGER, description: "Um inteiro não-nulo entre -10 e 10." },
    c: { type: Type.INTEGER, description: "Um inteiro entre -50 e 50." },
  },
  required: ['a', 'b', 'c']
};

const questionSchema = {
  type: Type.OBJECT,
  properties: {
    problemText: {
      type: Type.STRING,
      description: "Um problema de palavras em português do Brasil relacionando surfe a um sistema de duas equações lineares.",
    },
    equation1: equationSchema,
    equation2: equationSchema,
    variableX: {
      type: Type.STRING,
      description: "O nome da variável 'x' em português (ex: 'velocidade do vento')."
    },
    variableY: {
      type: Type.STRING,
      description: "O nome da variável 'y' em português (ex: 'altura da maré')."
    },
  },
  required: ['problemText', 'equation1', 'equation2', 'variableX', 'variableY']
};

const generateQuestion = async (): Promise<Question> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Gere um problema de matemática para um jogo com tema de surfe. O problema deve ser modelado por um sistema de duas equações de primeiro grau com duas incógnitas (a1x + b1y = c1 e a2x + b2y = c2). Os coeficientes 'a' e 'b' devem ser inteiros não nulos entre -5 e 5. O sistema deve ter uma solução única com valores inteiros para x e y. O problema deve estar em português do Brasil.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: questionSchema,
      },
    });
    
    const jsonText = response.text.trim();
    const questionData = JSON.parse(jsonText);

    if (questionData.equation1.a === 0 || questionData.equation1.b === 0 || questionData.equation2.a === 0 || questionData.equation2.b === 0) {
      throw new Error("Generated equation has a zero coefficient, retrying.");
    }
    
    const { a: a1, b: b1 } = questionData.equation1;
    const { a: a2, b: b2 } = questionData.equation2;
    if (a1 * b2 - a2 * b1 === 0) {
        throw new Error("Generated system does not have a unique solution, retrying.");
    }

    return questionData as Question;
  } catch (error) {
    console.error("Error generating question, returning a fallback:", error);
    return {
      problemText: "Para a onda perfeita, a relação entre a velocidade do vento (x) e a altura da maré (y) é dada por x + y = 12. Além disso, para a prancha ideal, o dobro da velocidade do vento menos a altura da maré deve ser 3. Qual a combinação perfeita de vento e maré?",
      equation1: { a: 1, b: 1, c: 12 },
      equation2: { a: 2, b: -1, c: 3 },
      variableX: "Velocidade do Vento (nós)",
      variableY: "Altura da Maré (m)"
    };
  }
};

const getSolutionExplanation = async (equation1: Equation, equation2: Equation): Promise<string> => {
    const eq1Str = `${equation1.a}x + ${equation1.b}y = ${equation1.c}`;
    const eq2Str = `${equation2.a}x + ${equation2.b}y = ${equation2.c}`;
    const prompt = `
      Você é um tutor de matemática amigável. Um aluno está aprendendo a resolver sistemas de equações lineares 2x2 em um jogo de surfe.
      O sistema de equações é:
      Equação 1: ${eq1Str}
      Equação 2: ${eq2Str}
      Forneça uma explicação passo a passo em português do Brasil sobre como resolver este sistema. Use o método da adição (eliminação) ou da substituição, o que for mais simples para este sistema específico.
      Estruture sua explicação claramente: 1. Apresente o sistema. 2. Explique o método escolhido. 3. Mostre cada passo para encontrar uma variável. 4. Mostre como substituir para encontrar a segunda variável. 5. Apresente a solução final (x, y). Mantenha a explicação concisa e encorajadora.
    `;
  
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });
      return response.text;
    } catch (error) {
        console.error("Error generating explanation:", error);
        return "Ocorreu um erro ao gerar a explicação. A solução correta é o ponto onde as duas linhas do gráfico se cruzam.";
    }
};

// --- COMPONENTES ---

const EquationGraph: React.FC<{ equation1: Equation, equation2: Equation }> = ({ equation1, equation2 }) => {
  const { a: a1, b: b1, c: c1 } = equation1;
  const { a: a2, b: b2, c: c2 } = equation2;

  const calculateLinePoints = (eq: Equation) => {
    const { a, b, c } = eq;
    const points = [];
    if (b !== 0) {
      points.push({ x: -10, y: (c - a * -10) / b });
      points.push({ x: 10, y: (c - a * 10) / b });
    } else {
      points.push({ x: c / a, y: -10 });
      points.push({ x: c / a, y: 10 });
    }
    return points.map(p => ({x: parseFloat(p.x.toFixed(2)), y: parseFloat(p.y.toFixed(2))}));
  };

  const data1 = calculateLinePoints(equation1);
  const data2 = calculateLinePoints(equation2);

  const determinant = a1 * b2 - a2 * b1;
  let intersectionPoint = null;
  if (determinant !== 0) {
    const x = (c1 * b2 - c2 * b1) / determinant;
    const y = (a1 * c2 - a2 * c1) / determinant;
    intersectionPoint = [{ x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)), z: 100 }];
  }

  const allPoints = [...data1, ...data2];
  const domainPadding = 5;
  const xDomain = [Math.min(...allPoints.map(p => p.x)) - domainPadding, Math.max(...allPoints.map(p => p.x)) + domainPadding];
  const yDomain = [Math.min(...allPoints.map(p => p.y)) - domainPadding, Math.max(...allPoints.map(p => p.y)) + domainPadding];

  return (
    <div className="w-full h-64 md:h-80 my-4">
       <h3 className="text-center font-semibold text-lg text-blue-800 mb-2">Gráfico do Sistema</h3>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" dataKey="x" name="X" domain={xDomain} />
          <YAxis type="number" dataKey="y" name="Y" domain={yDomain}/>
          <ZAxis dataKey="z" range={[100, 100]} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Legend />
          <Line data={data1} dataKey="y" name={`Eq 1: ${a1}x + ${b1}y = ${c1}`} stroke="#1e40af" strokeWidth={2} dot={false} isAnimationActive={false}/>
          <Line data={data2} dataKey="y" name={`Eq 2: ${a2}x + ${b2}y = ${c2}`} stroke="#be123c" strokeWidth={2} dot={false} isAnimationActive={false}/>
          {intersectionPoint && (
            <Scatter name="Solução" data={intersectionPoint} fill="#16a34a" shape="star" />
          )}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

const WaveVisualization: React.FC<{ x: number, y: number }> = ({ x, y }) => {
  const amplitude = Math.max(10, 20 + Math.abs(y) * 2); 
  const frequency = 0.05 + Math.abs(x) * 0.005; 
  const points = [];
  const width = 500;
  const height = 200;

  for (let i = 0; i <= width; i++) {
    points.push(`${i},${height / 2 + amplitude * Math.sin(i * frequency)}`);
  }

  const path = `M0,${height / 2} L${points.join(' ')} L${width},${height / 2} L${width},${height} L0,${height} Z`;

  return (
    <div className="w-full my-4 p-4 bg-blue-200 rounded-lg shadow-inner">
      <h3 className="text-center font-semibold text-lg text-blue-800 mb-2">Sua Onda Perfeita!</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        <defs><linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style={{ stopColor: '#60a5fa', stopOpacity: 1 }} /><stop offset="100%" style={{ stopColor: '#2563eb', stopOpacity: 1 }} /></linearGradient></defs>
        <path d={path} fill="url(#waveGradient)" />
      </svg>
    </div>
  );
};

const Scoreboard: React.FC<{ score: number; questionNumber: number; totalQuestions: number; }> = ({ score, questionNumber, totalQuestions }) => {
  return (
    <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-md border border-blue-200 flex items-center space-x-4">
      <div className="text-center"><div className="text-xs font-bold text-gray-500 uppercase">Questão</div><div className="text-lg font-bold text-blue-900">{questionNumber}/{totalQuestions}</div></div>
      <div className="border-l h-8 border-gray-300"></div>
      <div className="text-center"><div className="text-xs font-bold text-gray-500 uppercase">Pontos</div><div className="text-lg font-bold text-blue-900">{score}</div></div>
    </div>
  );
};

const QuestionCard: React.FC<{ question: Question; onAnswerSubmit: (x: string, y: string) => void; userAnswer: { x: string; y: string }; setUserAnswer: (answer: { x: string; y: string }) => void; }> = ({ question, onAnswerSubmit, userAnswer, setUserAnswer }) => {
  const { problemText, equation1, equation2, variableX, variableY } = question;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnswerSubmit(userAnswer.x, userAnswer.y);
  };

  const formatEquation = (eq: {a: number, b: number, c: number}) => {
    const {a, b, c} = eq;
    const formatCoefficient = (coeff: number, isFirst: boolean = false) => {
        if (isFirst) { return coeff === 1 ? '' : coeff === -1 ? '-' : `${coeff}`; }
        if (coeff > 0) { return `+ ${coeff === 1 ? '' : coeff}`; }
        return `- ${Math.abs(coeff) === 1 ? '' : Math.abs(coeff)}`;
      };
      return `${formatCoefficient(a, true)}x ${formatCoefficient(b)}y = ${c}`;
  }

  return (
    <div className="w-full max-w-2xl bg-white p-6 md:p-8 rounded-xl shadow-lg border border-gray-200">
      <p className="text-lg text-gray-700 mb-4">{problemText}</p>
      <div className="bg-blue-100 p-4 rounded-lg text-center my-6 space-y-2">
        <p className="text-xl md:text-2xl font-bold text-blue-900 tracking-wider">{formatEquation(equation1)}</p>
        <p className="text-xl md:text-2xl font-bold text-blue-900 tracking-wider">{formatEquation(equation2)}</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
          <div className="flex-1">
            <label htmlFor="x" className="block text-sm font-medium text-gray-700 mb-1">{variableX}</label>
            <input type="number" id="x" name="x" value={userAnswer.x} onChange={(e) => setUserAnswer({ ...userAnswer, x: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Valor de x" required />
          </div>
          <div className="flex-1">
            <label htmlFor="y" className="block text-sm font-medium text-gray-700 mb-1">{variableY}</label>
            <input type="number" id="y" name="y" value={userAnswer.y} onChange={(e) => setUserAnswer({ ...userAnswer, y: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Valor de y" required />
          </div>
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300">Verificar Resposta</button>
      </form>
    </div>
  );
};

const FeedbackCard: React.FC<{ isCorrect: boolean; question: Question; userAnswer: { x: string; y: string }; explanation: string | null; onNextQuestion: () => void; isLoadingExplanation: boolean; }> = ({ isCorrect, question, userAnswer, explanation, onNextQuestion, isLoadingExplanation }) => {
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
             <div className="flex justify-center items-center my-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div><p className="ml-3 text-gray-600">Gerando a explicação...</p></div>
          ) : (
            <div className="bg-orange-50 p-4 rounded-lg my-4 border border-orange-200"><h3 className="font-semibold text-lg text-orange-800 mb-2">Passo a passo:</h3><p className="text-gray-800 whitespace-pre-wrap">{explanation}</p></div>
          )}
          <EquationGraph equation1={question.equation1} equation2={question.equation2} />
        </div>
      )}
      <button onClick={onNextQuestion} className="w-full mt-6 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300">Próxima Pergunta</button>
    </div>
  );
};


// --- COMPONENTE PRINCIPAL APP ---
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
        setGameState('start');
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
          <div className="flex flex-col items-center text-center"><div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div><p className="text-2xl font-semibold text-blue-800">Buscando a onda perfeita...</p></div>
        );
      case 'playing':
        return currentQuestion && (
          <QuestionCard question={currentQuestion} onAnswerSubmit={handleAnswerSubmit} userAnswer={userAnswer} setUserAnswer={setUserAnswer} />
        );
      case 'feedback':
        return currentQuestion && isCorrect !== null && (
          <FeedbackCard isCorrect={isCorrect} question={currentQuestion} userAnswer={userAnswer} explanation={explanation} onNextQuestion={handleNextQuestion} isLoadingExplanation={isLoadingExplanation} />
        );
      case 'end':
        return (
            <div className="text-center bg-white p-8 rounded-xl shadow-lg">
                <h1 className="text-3xl font-bold text-blue-900 mb-4">Fim de Jogo!</h1>
                <p className="text-xl text-gray-700 mb-6">Sua pontuação final foi:</p>
                <p className="text-6xl font-extrabold text-blue-600 mb-8">{score}</p>
                <button onClick={handleStartGame} className="bg-blue-600 text-white font-bold py-3 px-6 rounded-full text-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300 transform hover:scale-105">Jogar Novamente</button>
            </div>
        );
      case 'start':
      default:
        return (
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 mb-2">Surf Math</h1>
            <p className="text-xl text-blue-700 mb-8">Aprenda equações e pegue a onda perfeita!</p>
            <button onClick={handleStartGame} className="bg-blue-600 text-white font-bold py-4 px-8 rounded-full text-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300 transform hover:scale-105">Começar a Jogar</button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-blue-100 flex items-center justify-center p-4 font-sans relative">
      {gameState !== 'start' && gameState !== 'end' && (
        <Scoreboard score={score} questionNumber={questionNumber} totalQuestions={TOTAL_QUESTIONS} />
      )}
      <div className="w-full max-w-3xl mx-auto">
        {renderContent()}
      </div>
    </div>
  );
};


// --- PONTO DE ENTRADA DA APLICAÇÃO ---
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);