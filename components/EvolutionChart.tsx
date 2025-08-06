import React, { useEffect, useRef } from 'react';
import { Chart, registerables, ChartComponentLike } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { es } from 'date-fns/locale';
import annotationPlugin, { AnnotationOptions } from 'chartjs-plugin-annotation';
import { BloodTestDataPoint } from '../types';
import { parseDateValue } from '../utils/chartUtils';

Chart.register(...registerables, annotationPlugin as unknown as ChartComponentLike);

interface EvolutionChartProps {
  dataSets: Record<string, BloodTestDataPoint[]>;
  generalRefRanges: Record<string, string>;
}

interface EventDataDetail {
  date: Date;
  id: string;
  description: string;
  lineColor: string;
  displayLabelOnChart: boolean;
  labelConfig?: AnnotationOptions['label'];
  eventTextColorClass?: string;
}

const EvolutionChart: React.FC<EvolutionChartProps> = ({ dataSets, generalRefRanges }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  const eventDataForChart: EventDataDetail[] = [
    {
      date: new Date(2025, 2, 17),
      id: 'pembro1',
      description: "1ª dosis Pembrolizumab",
      lineColor: 'rgba(255, 165, 0, 0.8)',
      eventTextColorClass: 'text-orange-500',
      displayLabelOnChart: false,
    },
    {
      date: new Date(2025, 3, 7),
      id: 'pembro2',
      description: "2ª dosis Pembrolizumab",
      lineColor: 'rgba(255, 204, 0, 0.8)',
      eventTextColorClass: 'text-yellow-400',
      displayLabelOnChart: false,
    },
    {
      date: new Date(2025, 4, 5),
      id: 'ensayoEnd',
      description: "Fin del Ensayo",
      lineColor: 'rgba(100, 181, 246, 0.7)',
      displayLabelOnChart: true,
      labelConfig: {
        content: "Fin del Ensayo",
        display: true,
        position: 'center',
        rotation: -90,
        backgroundColor: 'rgba(100, 181, 246, 0.5)',
        font: { size: 10, weight: 'bold' },
        color: 'white',
        padding: { top: 6, bottom: 6, left: 4, right: 4 },
        borderRadius: 3,
      }
    }
  ];

  useEffect(() => {
    const parameterNames = Object.keys(dataSets);
    if (!chartRef.current || parameterNames.length === 0) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
      return;
    }

    const colorPalette = [
      'rgba(54, 162, 235, 0.7)',
      'rgba(255, 99, 132, 0.7)',
      'rgba(75, 192, 192, 0.7)',
      'rgba(255, 206, 86, 0.7)',
      'rgba(153, 102, 255, 0.7)',
      'rgba(255, 159, 64, 0.7)',
    ];

    const datasets = parameterNames.map((param, idx) => {
      const sortedData = [...dataSets[param]].sort(
        (a, b) => parseDateValue(a.date).getTime() - parseDateValue(b.date).getTime()
      );
      return {
        label: `${param}${sortedData[0]?.unit ? ` (${sortedData[0].unit})` : ''}`,
        data: sortedData.map(d => ({
          x: parseDateValue(d.date),
          y: d.value,
          unit: d.unit,
          refRange: d.refRange,
          note: d.note,
        })),
        borderColor: colorPalette[idx % colorPalette.length],
        backgroundColor: colorPalette[idx % colorPalette.length],
        tension: 0.3,
        parsing: false,
      };
    });

    const allValues = datasets.flatMap(ds => ds.data.map((p: any) => p.y));

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const chartAnnotations: AnnotationOptions[] = eventDataForChart.map(event => ({
      type: 'line',
      xMin: event.date,
      xMax: event.date,
      borderColor: event.lineColor,
      borderWidth: 2,
      label: event.displayLabelOnChart ? event.labelConfig : undefined,
    }));

    chartInstanceRef.current = new Chart(chartRef.current, {
      type: 'line',
      data: { datasets },
      options: {
        maintainAspectRatio: false,
        parsing: false,
        scales: {
          x: {
            type: 'time',
            adapters: { date: { locale: es } },
            time: {
              unit: 'day',
              tooltipFormat: 'dd/MM/yyyy',
              displayFormats: { day: 'dd/MM/yy' },
            },
            title: {
              display: true,
              text: 'Fecha del Análisis',
              font: { size: 14, weight: 500 },
              color: '#4b5563',
            },
            ticks: { color: '#6b7280' },
          },
          y: {
            title: {
              display: true,
              text: 'Valor',
              font: { size: 14, weight: 500 },
              color: '#4b5563',
            },
            ticks: { color: '#6b7280' },
            beginAtZero: allValues.every(v => v >= 0)
              ? (Math.min(...allValues) < 20 ? true : false)
              : false,
          },
        },
        plugins: {
          legend: { position: 'top', labels: { font: { size: 14 }, color: '#374151' } },
          title: {
            display: true,
            text: 'Evolución de Parámetros',
            font: { size: 18, weight: 600 },
            padding: { top: 10, bottom: 10 },
            color: '#1f2937',
          },
          tooltip: {
            backgroundColor: '#fff',
            titleColor: '#1f2937',
            bodyColor: '#374151',
            borderColor: '#e5e7eb',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              title: function (tooltipItems) {
                const date = new Date(tooltipItems[0].parsed.x);
                return date.toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                });
              },
              label: function (context) {
                const raw: any = context.raw;
                let label = `${context.dataset.label}: `;
                if (raw.y !== null) {
                  label += `${raw.y} ${raw.unit || ''}`;
                }
                if (raw.refRange) {
                  label += ` (Ref: ${raw.refRange})`;
                }
                if (raw.note) {
                  label += ` (${raw.note})`;
                }
                return label;
              },
            },
          },
          annotation: { annotations: chartAnnotations },
        } as any,
        interaction: { mode: 'index', intersect: false },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [dataSets, generalRefRanges]);

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
