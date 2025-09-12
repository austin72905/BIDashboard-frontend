import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement } from "chart.js";
import { useDashboardStore } from "../stores/useDashboardStore";
import { Box, Typography } from "@mui/material";

ChartJS.register(Title, Tooltip, Legend, ArcElement);

export default function RegionChart() {
  const stats = useDashboardStore((s) => s.stats);

  if (!stats) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          沒有地區分布數據
        </Typography>
      </Box>
    );
  }

  const regionData = stats.regionDistribution;
  
  const data = {
    labels: Object.keys(regionData),
    datasets: [
      {
        label: "地區分布",
        data: Object.values(regionData),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 205, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            // 直接顯示百分比，因為後端已經返回百分比
            return `${context.label}: ${context.parsed}%`;
          }
        }
      }
    },
    cutout: '50%', // 製作甜甜圈圖
  };

  return (
    <Box sx={{ height: 350, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flex: 1 }}>
        <Doughnut data={data} options={options} />
      </Box>
    </Box>
  );
}
