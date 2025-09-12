import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement } from "chart.js";
import { useDashboardStore } from "../stores/useDashboardStore";
import { Box, Typography } from "@mui/material";

ChartJS.register(Title, Tooltip, Legend, ArcElement);

export default function GenderPieChart() {
  const stats = useDashboardStore((s) => s.stats);

  if (!stats) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          沒有性別分布數據
        </Typography>
      </Box>
    );
  }

  // 性別比例數據（已經是比例值 0-1）
  const maleRatio = stats.genderDistribution.male;
  const femaleRatio = stats.genderDistribution.female;
  
  const data = {
    labels: ["男性", "女性"],
    datasets: [
      {
        label: "比例",
        data: [maleRatio, femaleRatio],
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 99, 132, 0.8)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
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
            const percentage = (context.parsed * 100).toFixed(1);
            return `${context.label}: ${percentage}%`;
          }
        }
      }
    },
  };

  return (
    <Box sx={{ height: 350, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flex: 1 }}>
        <Pie data={data} options={options} />
      </Box>
    </Box>
  );
}
