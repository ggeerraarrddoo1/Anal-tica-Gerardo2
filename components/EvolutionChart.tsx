
import React, { useEffect, useRef } from 'react';
import { Chart, registerables, ScriptableCartesianScaleContext, ScriptableChartContext, ChartComponentLike, Scriptable } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { es } from 'date-fns/locale'; 
import annotationPlugin, { AnnotationOptions } from 'chartjs-plugin-annotation';
import { BloodTestDataPoint, RefRange } from '../types';
import { parseDateValue, parseRefRangeString } from '../utils/chartUtils';

// Register Chart.js components and plugins
Chart.register(...registerables, annotationPlugin as unknown as ChartComponentLike); // Cast for newer Chart.js versions

interface EvolutionChartProps {
  parameterName: string;
  data: BloodTestDataPoint[];
  generalRefRanges: Record<string, string>;
}

const EvolutionChart: React.FC<EvolutionChartProps> = ({ parameterName, data, generalRefRanges }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) {
        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
            chartInstanceRef.current = null;
        }
      return;
    }

    const sortedData = [...data].sort((a, b) => parseDateValue(a.date).getTime() - parseDateValue(b.date).getTime());
    
    const labels = sortedData.map(d => parseDateValue(d.date));
    const values = sortedData.map(d => d.value);
    const units = sortedData.length > 0 ? sortedData[0].unit : '';
    
    const firstDataPointRefRange: RefRange = sortedData.length > 0 ? parseRefRangeString(sortedData[0].refRange) : {min: null, max: null, text: 'N/A'};
    const generalRefText = generalRefRanges[parameterName] || `Ref: ${firstDataPointRefRange.text}`;

    const annotations: AnnotationOptions[] = [];

    // Horizontal reference lines
    if (firstDataPointRefRange.min !== null) {
        annotations.push({
            type: 'line',
            yMin: firstDataPointRefRange.min,
            yMax: firstDataPointRefRange.min,
            borderColor: 'rgba(255, 99, 132, 0.7)', // Reddish
            borderWidth: 2,
            borderDash: [6, 6],
            label: {
                content: `Ref Min: ${firstDataPointRefRange.min}`,
                display: true,
                position: 'end',
                backgroundColor: 'rgba(255, 99, 132, 0.7)',
                font: { style: 'normal', size: 10, weight: 'normal' },
                color: 'white',
                padding: 3,
                borderRadius: 3
            }
        });
    }
    if (firstDataPointRefRange.max !== null) {
         annotations.push({
            type: 'line',
            yMin: firstDataPointRefRange.max,
            yMax: firstDataPointRefRange.max,
            borderColor: 'rgba(75, 192, 192, 0.7)', // Greenish
            borderWidth: 2,
            borderDash: [6,6],
            label: {
                content: `Ref Max: ${firstDataPointRefRange.max}`,
                display: true,
                position: 'end',
                backgroundColor: 'rgba(75, 192, 192, 0.7)',
                font: { style: 'normal', size: 10, weight: 'normal' },
                color: 'white',
                padding: 3,
                borderRadius: 3
            }
        });
    }

    // Vertical date lines with specific configurations
    const eventLines = [
        {
            date: new Date(2025, 2, 17), // March 17, 2025
            label: "1ª dosis Pembrolizumab",
            borderColor: 'rgba(255, 204, 0, 0.8)', // Yellow
            borderDash: [6, 6],
            labelColor: 'black',
            labelBackgroundColor: 'rgba(255, 204, 0, 0.6)'
        },
        {
            date: new Date(2025, 3, 7),  // April 7, 2025
            label: "2ª dosis Pembrolizumab",
            borderColor: 'rgba(255, 204, 0, 0.8)', // Yellow
            borderDash: [6, 6],
            labelColor: 'black',
            labelBackgroundColor: 'rgba(255, 204, 0, 0.6)'
        },
        {
            date: new Date(2025, 4, 5),   // May 5, 2025
            label: "Fin del Ensayo",
            borderColor: 'rgba(100, 181, 246, 0.7)', // Light blue
            borderDash: [6, 6],
            labelColor: 'white',
            labelBackgroundColor: 'rgba(100, 181, 246, 0.5)'
        }
    ];

    eventLines.forEach(event => {
        annotations.push({
            type: 'line',
            xMin: event.date.getTime(),
            xMax: event.date.getTime(),
            borderColor: event.borderColor,
            borderWidth: 2,
            borderDash: event.borderDash,
            label: {
                content: event.label,
                display: true,
                position: 'center', 
                rotation: -90,
                backgroundColor: event.labelBackgroundColor,
                font: { size: 10, weight: 'bold' },
                color: event.labelColor,
                padding: {top: 6, bottom: 6, left:4, right:4}, // Adjusted padding for vertical
                borderRadius: 3,
                yAdjust: 0, // Adjust if needed for centering
            }
        });
    });


    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    chartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: `${parameterName} (${units})`,
          data: values,
          borderColor: '#4f46e5', // Indigo-600
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          tension: 0.1,
          fill: false,
          pointBackgroundColor: '#4f46e5',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#4f46e5',
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'time',
            adapters: {
                date: {
                    locale: es 
                }
            },
            time: {
              unit: 'day',
              tooltipFormat: 'dd/MM/yyyy', 
              displayFormats: {
                day: 'dd/MM/yy' 
              }
            },
            title: {
              display: true,
              text: 'Fecha del Análisis',
              font: { size: 14, weight: 500 }, // Tailwind text-sm, font-medium equivalent
              color: '#4b5563' // Gray-600 (Good for white bg)
            },
            ticks: { color: '#6b7280' } // Gray-500 (Good for white bg)
          },
          y: {
            title: {
              display: true,
              text: `Valor (${units})`,
              font: { size: 14, weight: 500 },
              color: '#4b5563'
            },
            ticks: { color: '#6b7280' },
            beginAtZero: values.every(v => v >=0) ? (Math.min(...values) < 20 ? true : false) : false 
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: { font: { size: 14 }, color: '#374151' } // Gray-700
          },
          title: {
            display: true,
            text: `${parameterName} - Evolución (${generalRefText})`,
            font: { size: 18, weight: 600 }, // Tailwind text-lg, font-semibold
            padding: { top: 10, bottom: 20 },
            color: '#1f2937' // Gray-800
          },
          tooltip: {
            backgroundColor: '#fff',
            titleColor: '#1f2937',
            bodyColor: '#374151',
            borderColor: '#e5e7eb', // Gray-200
            borderWidth: 1,
            padding: 10,
            callbacks: {
              title: function(tooltipItems) {
                const date = new Date(tooltipItems[0].parsed.x);
                return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
              },
              label: function(context) {
                let label = `${parameterName}: `;
                if (context.parsed.y !== null) {
                  label += `${context.parsed.y} ${units}`;
                }
                const dataPoint = sortedData[context.dataIndex];
                if (dataPoint && dataPoint.refRange) {
                  label += ` (Ref: ${dataPoint.refRange})`;
                }
                if (dataPoint && dataPoint.note) {
                  label += ` (${dataPoint.note})`;
                }
                return label;
              }
            }
          },
          annotation: {
            annotations: annotations
          }
        } as any, // Cast the entire plugins object to 'any' to bypass strict plugin options typing for 'annotation' key
        interaction: {
          mode: 'index',
          intersect: false,
        },
      }
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parameterName, data, generalRefRanges]); 

  
  return (
    <div className="chart-container-wrapper bg-white p-4 rounded-lg shadow-md">
      <canvas ref={chartRef} id="evolutionChart"></canvas>
    </div>
  );
};

export default EvolutionChart;
