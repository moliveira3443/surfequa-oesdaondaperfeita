import React from 'react';
import type { Equation } from '../types';
// FIX: Removed unused `LineChart` and added `ZAxis` to control the size of the Scatter symbol.
import { Line, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Scatter, ScatterChart } from 'recharts';

interface EquationGraphProps {
  equation1: Equation;
  equation2: Equation;
}

const EquationGraph: React.FC<EquationGraphProps> = ({ equation1, equation2 }) => {
  const { a: a1, b: b1, c: c1 } = equation1;
  const { a: a2, b: b2, c: c2 } = equation2;

  // Function to calculate two points for a line
  const calculateLinePoints = (eq: Equation) => {
    const { a, b, c } = eq;
    const points = [];
    if (b !== 0) { // Avoid division by zero
      points.push({ x: -10, y: (c - a * -10) / b });
      points.push({ x: 10, y: (c - a * 10) / b });
    } else { // Vertical line x = c/a
      points.push({ x: c / a, y: -10 });
      points.push({ x: c / a, y: 10 });
    }
    return points.map(p => ({x: parseFloat(p.x.toFixed(2)), y: parseFloat(p.y.toFixed(2))}));
  };

  const data1 = calculateLinePoints(equation1);
  const data2 = calculateLinePoints(equation2);

  // Calculate intersection point (solution)
  const determinant = a1 * b2 - a2 * b1;
  let intersectionPoint = null;
  if (determinant !== 0) {
    const x = (c1 * b2 - c2 * b1) / determinant;
    const y = (a1 * c2 - a2 * c1) / determinant;
    // FIX: Add a 'z' property to the intersection point data. This will be used by ZAxis to control the symbol size.
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
          {/* FIX: Add ZAxis to control the size of the scatter shape. The range sets a fixed size. */}
          <ZAxis dataKey="z" range={[100, 100]} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Legend />
          <Line 
            data={data1} 
            dataKey="y"
            name={`Eq 1: ${a1}x + ${b1}y = ${c1}`}
            stroke="#1e40af" 
            strokeWidth={2} 
            dot={false}
            isAnimationActive={false}
          />
           <Line 
            data={data2} 
            dataKey="y"
            name={`Eq 2: ${a2}x + ${b2}y = ${c2}`}
            stroke="#be123c" 
            strokeWidth={2} 
            dot={false}
            isAnimationActive={false}
          />
          {intersectionPoint && (
            /* FIX: Removed invalid 'size' prop. Size is now controlled by the ZAxis component. */
            <Scatter name="Solução" data={intersectionPoint} fill="#16a34a" shape="star" />
          )}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EquationGraph;