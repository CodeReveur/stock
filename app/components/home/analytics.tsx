"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import AlertNotification from "../menu/notify";

interface Analytic {
  day: string;
  previous: number;
  current: number;
}

const Analytics = () => {
  const [analytics, setAnalytics] = useState<Analytic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/reports/analytics/weekly");
        if (!res.ok) throw new Error("Failed to fetch analytics");

        const data = await res.json();
        setAnalytics(data);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if(loading) return (<div className="preloadder bg-neutral-900 p-10 rounded-xl h-max my-2"></div>);
   
  return (
    <div className="p-5 bg-neutral-900 rounded-lg h-max">
      {error && (<AlertNotification message={error} type="error"/>)}
      <div className="pb-4 flex justify-between items-center">
        <h4 className="text-neutral-600">Daily sales analytics</h4>
      </div>
        <div className="pb-4 max-h-[40vh] overflow-hidden overflow-y-visible">
          <ResponsiveContainer width="100%" height={255}>
            <BarChart data={analytics} className="text-sm">
              <XAxis dataKey="day" className="text-gray-600" />
              <YAxis className="text-gray-600" />
              <Tooltip
                contentStyle={{ backgroundColor: "#f9fafb", borderRadius: "8px" }}
              />
              <Legend wrapperStyle={{ color: "#4b5563" }} />
              <Bar
                dataKey="previous"
                fill="oklch(0.508 0.118 165.612)"
                name="Previous week"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="current"
                fill="oklch(0.47 0.157 37.304)"
                name="Current week"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
    </div>
  );
};

export default Analytics;
