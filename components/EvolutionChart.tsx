
import React, { useEffect, useRef } from 'react';
import { Chart, registerables, ChartComponentLike } from 'chart.js'; // Removed Scriptable as it's not directly used for props here
import 'chartjs-adapter-date-fns';
import { es } from 'date-fns/locale'; 
import annotationPlugin, { AnnotationOptions } from 'chartjs-plugin-annotation';
import { BloodTestDataPoint, RefRange } from '../types';
import { parseDateValue, parseRefRangeString } from '../utils/chartUtils';

// Register Chart.js components and plugins
Chart.register(...registerables, annotationPlugin as unknown as ChartComponentLike); 

interface EvolutionChartProps {
  parameterName: string;
  data: BloodTestDataPoint[];
  generalRefRanges: Record<string, string>;
}

interface EventDataDetail {
    date: Date;
    id: string;
    description: string;
    lineColor: string;
    displayLabelOnChart: boolean;
    labelConfig?: AnnotationOptions['label'];
    eventTextColorClass?: string; // Tailwind CSS class for text color
}

const EvolutionChart: React.FC<EvolutionChartProps> = ({ parameterName, data, generalRefRanges }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  // Define event lines data (used for both chart annotations and custom HTML legend)
  // Moved here to be accessible by both useEffect and eventsForCustomLegend
  const eventDataForChart: EventDataDetail[] = [
      {
          date: new Date(2025, 2, 17), // March 17, 2025
          id: 'pembro1',
          description: "1ª dosis Pembrolizumab",
          lineColor: 'rgba(255, 165, 0, 0.8)', // Orange
          eventTextColorClass: 'text-orange-500', 
          displayLabelOnChart: false,
      },
      {
          date: new Date(2025, 3, 7),  // April 7, 2025
          id: 'pembro2',
          description: "2ª dosis Pembrolizumab",
          lineColor: 'rgba(255, 204, 0, 0.8)', // Yellow
          eventTextColorClass: 'text-yellow-400',
          displayLabelOnChart: false,
      },
      {
          date: new Date(2025, 4, 5),   // May 5, 2025
          id: 'ensayoEnd',
          description: "Fin del Ensayo",
          lineColor: 'rgba(100, 181, 246, 0.7)', // Light blue
          displayLabelOnChart: true, 
          labelConfig: { 
              content: "Fin del Ensayo",
              display: true,
              position: 'center', 
              rotation: -90,
              backgroundColor: 'rgba(100, 181, 246, 0.5)',
              font: { size: 10, weight: 'bold' },
              color: 'white',
              padding: {top: 6, bottom: 6, left:4, right:4},
              borderRadius: 3,
          }
      }
  ];

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

    const chartAnnotations: AnnotationOptions[] = [];

    // Horizontal reference lines
    if (firstDataPointRefRange.min !== null) {
        chartAnnotations.push({
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
         chartAnnotations.push({
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

    // Generate annotations for event lines on the chart
    eventDataForChart.forEach(event => {
        const annotation: AnnotationOptions = {
            type: 'line',
            xMin: event.date.getTime(),
            xMax: event.date.getTime(),
            borderColor: event.lineColor,
            borderWidth: 2,
            borderDash: [6, 6], 
        };
        if (event.displayLabelOnChart && event.labelConfig) {
            annotation.label = event.labelConfig as any; 
        }
        chartAnnotations.push(annotation);
    });
    
    const chartTitleText = `${parameterName} - Evolución (${generalRefText})`;

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
              font: { size: 14, weight: 500 }, 
              color: '#4b5563' 
            },
            ticks: { color: '#6b7280' } 
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
            labels: { font: { size: 14 }, color: '#374151' } 
          },
          title: {
            display: true,
            text: chartTitleText,
            font: { size: 18, weight: 600 }, 
            padding: { top: 10, bottom: 10 }, // Reduced bottom padding as legend is separate
            color: '#1f2937' 
          },
          tooltip: {
            backgroundColor: '#fff',
            titleColor: '#1f2937',
            bodyColor: '#374151',
            borderColor: '#e5e7eb', 
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
            annotations: chartAnnotations
          }
        } as any, 
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

  // Data for custom HTML legend
  const eventsForCustomLegend = eventDataForChart.filter(
    event => !event.displayLabelOnChart && event.description && event.eventTextColorClass
  );
  
  return (
    <div className="chart-container-wrapper bg-white p-4 rounded-lg shadow-md">
      {eventsForCustomLegend.length > 0 && (
        <div className="mb-3 text-sm">
          <h4 className="font-semibold text-gray-700">Eventos Marcados:</h4>
          <ul className="list-none pl-0 mt-1">
            {eventsForCustomLegend.map(event => {
              const eventDateStr = event.date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
              return (
                <li key={event.id} className={`flex items-baseline mt-0.5`}>
                  <span className="text-gray-600 mr-1.5">• {eventDateStr}:</span>
                  <span className={`font-medium ${event.eventTextColorClass}`}>{event.description}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <canvas ref={chartRef} id="evolutionChart"></canvas>
    </div>
  );
};

export default EvolutionChart;
