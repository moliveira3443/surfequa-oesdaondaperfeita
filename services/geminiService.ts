import { GoogleGenAI, Type } from "@google/genai";
import type { Question, Equation } from '../types';

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

export const generateQuestion = async (): Promise<Question> => {
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

    // Basic validation
    if (questionData.equation1.a === 0 || questionData.equation1.b === 0 || questionData.equation2.a === 0 || questionData.equation2.b === 0) {
      throw new Error("Generated equation has a zero coefficient, retrying.");
    }
    
    // Check for unique solution (determinant is not zero)
    const { a: a1, b: b1 } = questionData.equation1;
    const { a: a2, b: b2 } = questionData.equation2;
    if (a1 * b2 - a2 * b1 === 0) {
        throw new Error("Generated system does not have a unique solution, retrying.");
    }

    return questionData as Question;
  } catch (error) {
    console.error("Error generating question, returning a fallback:", error);
    // Fallback question in case of API error
    return {
      problemText: "Para a onda perfeita, a relação entre a velocidade do vento (x) e a altura da maré (y) é dada por x + y = 12. Além disso, para a prancha ideal, o dobro da velocidade do vento menos a altura da maré deve ser 3. Qual a combinação perfeita de vento e maré?",
      equation1: { a: 1, b: 1, c: 12 },
      equation2: { a: 2, b: -1, c: 3 },
      variableX: "Velocidade do Vento (nós)",
      variableY: "Altura da Maré (m)"
    };
  }
};


export const getSolutionExplanation = async (equation1: Equation, equation2: Equation): Promise<string> => {
    const eq1Str = `${equation1.a}x + ${equation1.b}y = ${equation1.c}`;
    const eq2Str = `${equation2.a}x + ${equation2.b}y = ${equation2.c}`;
    const prompt = `
      Você é um tutor de matemática amigável. Um aluno está aprendendo a resolver sistemas de equações lineares 2x2 em um jogo de surfe.

      O sistema de equações é:
      Equação 1: ${eq1Str}
      Equação 2: ${eq2Str}

      A tarefa é fornecer uma explicação passo a passo em português do Brasil sobre como resolver este sistema. Use o método da adição (eliminação) ou da substituição, o que for mais simples para este sistema específico.

      Estruture sua explicação claramente:
      1. Apresente o sistema de equações.
      2. Explique o método escolhido (adição ou substituição).
      3. Mostre cada passo do cálculo para encontrar o valor de uma variável.
      4. Mostre como substituir esse valor de volta em uma das equações originais para encontrar a segunda variável.
      5. Apresente a solução final como um par ordenado (x, y).
      6. Mantenha a explicação concisa, encorajadora e fácil de entender.
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