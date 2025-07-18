"use client";
import { useEffect, useState } from "react";
import { VictoryChart, VictoryLine, VictoryTooltip, VictoryTheme, VictoryContainer } from 'victory';
import AlertNotification from "../menu/notify";

interface Analytic {
  day: string;
  previous: number;
  current: number;
}

const Victory = () => {
  const [analytics, setAnalytics] = useState<Analytic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/reports/analytics/weekly_stock");
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
        <h4 className="text-orange-800">Daily Stock report</h4>
      </div>
      <div className="pb-4 max-h-[40vh] overflow-hidden">
  <VictoryChart 
    height={250} // Adjust for better fit
    width={500}  // Adjust width or use a percentage-based wrapper
    theme={VictoryTheme.material}
    domainPadding={{ x: 25 }}
    containerComponent={<VictoryContainer responsive={true} />}
  >
    <VictoryLine
      data={analytics}
      x="day" // Updated to match "weeks" in the dataset
      y="current"
      labelComponent={<VictoryTooltip />}
      style={{
        data: { stroke: 'oklch(0.47 0.157 37.304)', strokeWidth: 3 },
        labels: { fill: 'white', fontSize: 15 },
      }}
    />
    <VictoryLine
      data={analytics}
      x="day"
      y="previous"
      labelComponent={<VictoryTooltip />}
      style={{
        data: { stroke: 'oklch(0.508 0.118 165.612)', strokeWidth: 3 },
        labels: { fill: 'white', fontSize: 15 },
      }}
    />
  </VictoryChart>
</div>

    </div>
  );
}
export default  Victory;