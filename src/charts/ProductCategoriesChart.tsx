import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from "chart.js";
import { useDashboardStore } from "../stores/useDashboardStore";
import { Box, Typography } from "@mui/material";

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

export default function ProductCategoriesChart() {
  const stats = useDashboardStore((s) => s.stats);

  if (!stats) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          沒有產品類別數據
        </Typography>
      </Box>
    );
  }

  const data = {
    labels: Object.keys(stats.productCategories),
    datasets: [
      {
        label: "銷售量",
        data: Object.values(stats.productCategories),
        backgroundColor: [
          'rgba(255, 193, 7, 0.8)',
          'rgba(76, 175, 80, 0.8)',
          'rgba(233, 30, 99, 0.8)',
          'rgba(156, 39, 176, 0.8)',
          'rgba(255, 87, 34, 0.8)',
        ],
        borderColor: [
          'rgba(255, 193, 7, 1)',
          'rgba(76, 175, 80, 1)',
          'rgba(233, 30, 99, 1)',
          'rgba(156, 39, 176, 1)',
          'rgba(255, 87, 34, 1)',
        ],
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const, // 水平柱狀圖
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ${context.parsed.x} 件`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return value + ' 件';
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        }
      },
      y: {
        grid: {
          display: false,
        }
      }
    },
  };

  return (
    <Box sx={{ height: 350 }}>
      <Bar data={data} options={options} />
    </Box>
  );
}
