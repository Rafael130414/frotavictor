import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { FuelEntry } from '../types';
import { format, parseISO } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ConsumptionChartProps {
  entries: FuelEntry[];
}

export const ConsumptionChart: React.FC<ConsumptionChartProps> = ({ entries }) => {
  // Usar useMemo para evitar recálculos desnecessários
  const { labels, consumptionData } = useMemo(() => {
    const sortedEntries = [...entries].sort((a, b) => 
      parseISO(a.date).getTime() - parseISO(b.date).getTime()
    );

    // Calcular consumo usando os litros do abastecimento anterior
    const consumption = sortedEntries.slice(1).map((entry, index) => {
      const prevEntry = sortedEntries[index];
      const kmDiff = entry.currentKm - prevEntry.currentKm;
      return kmDiff / prevEntry.liters;
    });

    const dateLabels = sortedEntries.slice(1).map(entry => 
      format(parseISO(entry.date), 'dd/MM/yyyy')
    );

    return {
      labels: dateLabels,
      consumptionData: consumption
    };
  }, [entries]);

  // Configurações do gráfico memorizadas
  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: true,
    animation: {
      duration: 0 // Desabilitar animações para melhor performance
    },
    plugins: {
      legend: {
        display: false // Remover legenda para simplificar
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1e3a8a',
        bodyColor: '#1e3a8a',
        bodyFont: {
          weight: 'bold',
        },
        padding: 12,
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          label: (context: any) => `Consumo: ${context.raw.toFixed(1)} km/l`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: false // Remover grid para melhor performance
        },
        ticks: {
          font: {
            weight: '500',
          },
          padding: 8,
        },
        title: {
          display: true,
          text: 'Consumo (km/l)',
          font: {
            size: 14,
            weight: 'bold',
          },
          padding: 16,
        },
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true,
          maxTicksLimit: 10 // Limitar número de labels no eixo X
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    elements: {
      point: {
        radius: 4, // Reduzir tamanho dos pontos
        hoverRadius: 6,
      },
      line: {
        tension: 0.2, // Reduzir tensão da curva
      },
    },
  }), []);

  // Dados do gráfico memorizados
  const data = useMemo(() => ({
    labels,
    datasets: [
      {
        data: consumptionData,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
      },
    ],
  }), [labels, consumptionData]);

  // Não renderizar se não houver dados suficientes
  if (entries.length < 2) {
    return (
      <div className="w-full h-48 flex items-center justify-center text-gray-500">
        Dados insuficientes para gerar o gráfico
      </div>
    );
  }

  return (
    <div className="w-full h-full p-4">
      <Line options={options} data={data} />
    </div>
  );
};