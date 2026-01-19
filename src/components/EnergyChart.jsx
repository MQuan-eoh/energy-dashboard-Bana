import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const EnergyChart = ({
  id,
  data,
  lines = [], // Array of { key, color, name }
  unit,
  height = "200px",
}) => {
  const [hiddenKeys, setHiddenKeys] = useState([]);

  const handleLegendClick = (e) => {
    const { dataKey } = e;
    setHiddenKeys((prev) =>
      prev.includes(dataKey)
        ? prev.filter((key) => key !== dataKey)
        : [...prev, dataKey]
    );
  };

  return (
    <div style={{ height: height, width: "100%", marginTop: "1rem" }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 5,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.1)"
            vertical={true}
            horizontal={true}
          />
          <XAxis
            dataKey="time"
            stroke="#ffffffff"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#ffffffff"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={45}
            tickCount={4}
            tickFormatter={(value) => {
              if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
              if (value >= 100) return value.toFixed(0);
              return value.toFixed(1);
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "8px",
              color: "#fff",
            }}
            itemStyle={{ color: "#fff" }}
            labelStyle={{ color: "#ccc" }}
          />
          <Legend
            onClick={handleLegendClick}
            wrapperStyle={{ cursor: "pointer", paddingTop: "10px" }}
          />
          {lines.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.name}
              stroke={line.color}
              strokeWidth={2}
              dot={false}
              hide={hiddenKeys.includes(line.key)}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EnergyChart;
