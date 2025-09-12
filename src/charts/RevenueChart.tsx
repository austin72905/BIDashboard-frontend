import { Line } from "react-chartjs-2";
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement } from "chart.js";
import { useDashboardStore } from "../stores/useDashboardStore";
import { Box, Typography } from "@mui/material";

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement);

export default function RevenueChart() {
  const stats = useDashboardStore((s) => s.stats);

  if (!stats) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          沒有營收數據
        </Typography>
      </Box>
    );
  }

  const monthlyData = stats.revenueData.monthly;
  const labels = Object.keys(monthlyData).sort();
  const values = labels.map(month => monthlyData[month]);

  const data = {
    labels: labels.map(month => {
      const [year, monthNum] = month.split('-');
      return `${monthNum}月`;
    }),
    datasets: [
      {
        label: "月營收",
        data: values,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(75, 192, 192)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `營收: NT$ ${context.parsed.y.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return 'NT$ ' + (value / 1000) + 'K';
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        }
      },
      x: {
        grid: {
          display: false,
        }
      }
    },
  };

  return (
    <Box sx={{ height: 350 }}>
      <Line data={data} options={options} />
    </Box>
  );
}
