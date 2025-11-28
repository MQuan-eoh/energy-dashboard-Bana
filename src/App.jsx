import { useState, useEffect, useRef } from "react";
import "./App.css";
import EnergyChart from "./components/EnergyChart";
import Bar3DChart from "./components/Bar3DChart";

function App() {
  const [showFullTHD, setShowFullTHD] = useState(false);
  const configIdsRef = useRef([]);

  // Initial Data State
  const [data, setData] = useState({
    summary: {
      uTotal: 0,
      iTotal: 0,
      pMax: 0,
      pMin: 0,
    },
    voltage: {
      u1: 0,
      u2: 0,
      u3: 0,
      unit: "V",
    },
    current: {
      i1: 0,
      i2: 0,
      i3: 0,
      unit: "A",
    },
    power: {
      p1: 0,
      p2: 0,
      p3: 0,
      total: 0,
      unit: "kW",
    },
    maxValues: { pMax: 0, iMax: 0 },
    thd: {
      main: 0,
      details: {
        thdI1: 0,
        thdI2: 0,
        thdI3: 0,
        thdU1N: 0,
        thdU2N: 0,
        thdU3N: 0,
      },
    },
  });

  // History State for Charts
  const [voltageHistory, setVoltageHistory] = useState([]);
  const [currentHistory, setCurrentHistory] = useState([]);
  const [powerHistory, setPowerHistory] = useState([]);
  const [thdHistory, setThdHistory] = useState([]);

  useEffect(() => {
    const initEraWidget = () => {
      if (typeof window.EraWidget !== "function") {
        console.warn("EraWidget library not loaded yet. Retrying...");
        setTimeout(initEraWidget, 500);
        return;
      }

      const eraWidget = new window.EraWidget();
      eraWidget.init({
        needRealtimeConfigs: true,
        needHistoryConfigs: true,
        needActions: true,
        maxRealtimeConfigsCount: 20,
        maxHistoryConfigsCount: 1,
        maxActionsCount: 2,
        minRealtimeConfigsCount: 0,
        minHistoryConfigsCount: 0,
        minActionsCount: 0,
        onConfiguration: (configuration) => {
          // Store the IDs in order: U1, U2, U3, I1, I2, I3, P1, P2, P3, ...
          configIdsRef.current = configuration.realtime_configs.map(
            (c) => c.id
          );
          console.log("E-RA Configuration Loaded:", configIdsRef.current);
        },
        onValues: (values) => {
          const ids = configIdsRef.current;
          if (ids.length === 0) return;

          const getValue = (index) =>
            ids[index] && values[ids[index]] ? values[ids[index]].value : 0;

          // Mapping based on user instruction: U1(0), U2(1), U3(2), ...
          const u1 = getValue(0);
          const u2 = getValue(1);
          const u3 = getValue(2);

          const i1 = getValue(3);
          const i2 = getValue(4);
          const i3 = getValue(5);

          const p1 = getValue(6);
          const p2 = getValue(7);
          const p3 = getValue(8);

          // Assuming subsequent values follow a logical order or are calculated
          const pTotal = getValue(9) || p1 + p2 + p3;

          const pMax = getValue(10);
          const pMin = getValue(11);

          // THD values
          const thdI1 = getValue(12);
          const thdI2 = getValue(13);
          const thdI3 = getValue(14);
          const thdU1N = getValue(15);
          const thdU2N = getValue(16);
          const thdU3N = getValue(17);

          const thdMain = Math.max(thdI1, thdI2, thdI3);

          // Update Data State
          setData({
            summary: {
              uTotal: (u1 + u2 + u3) / 3,
              iTotal: i1 + i2 + i3,
              pMax: pMax,
              pMin: pMin,
            },
            voltage: { u1, u2, u3, unit: "V" },
            current: { i1, i2, i3, unit: "A" },
            power: { p1, p2, p3, total: pTotal, unit: "kW" },
            maxValues: { pMax, iMax: 0 },
            thd: {
              main: thdMain,
              details: { thdI1, thdI2, thdI3, thdU1N, thdU2N, thdU3N },
            },
          });

          // Update History
          const time = new Date().toLocaleTimeString([], { hour12: false });

          const updateChartData = (prev, v1, v2, v3) => {
            const newData = [
              ...prev,
              { time, value1: v1, value2: v2, value3: v3 },
            ];
            return newData.slice(-20); // Keep last 20 points
          };

          setVoltageHistory((prev) => updateChartData(prev, u1, u2, u3));
          setCurrentHistory((prev) => updateChartData(prev, i1, i2, i3));
          setPowerHistory((prev) => updateChartData(prev, p1, p2, p3));
          setThdHistory((prev) => updateChartData(prev, thdI1, thdI2, thdI3));
        },
      });
    };

    initEraWidget();
  }, []);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-item">
          <span className="header-label">U TOTAL</span>
          <span className="header-value">
            {data.summary.uTotal.toFixed(1)} V
          </span>
        </div>
        <div className="header-item">
          <span className="header-label">I TOTAL</span>
          <span className="header-value">
            {data.summary.iTotal.toFixed(1)} A
          </span>
        </div>
        <div className="header-item">
          <span className="header-label">P MAX</span>
          <span className="header-value">
            {data.summary.pMax.toFixed(1)} kW
          </span>
        </div>
        <div className="header-item">
          <span className="header-label">P MIN</span>
          <span className="header-value">
            {data.summary.pMin.toFixed(1)} kW
          </span>
        </div>
      </div>

      {/* Main Data Grid */}
      <div className="grid-container">
        {/* Voltage */}
        <div className="glass-panel">
          <div className="panel-header">
            <span className="panel-title">Điện áp (Voltage)</span>
            <span className="icon">⚡</span>
          </div>
          <div className="phase-grid">
            <div className="phase-item">
              <span className="phase-label">U1</span>
              <span className="phase-value">
                {data.voltage.u1.toFixed(1)} {data.voltage.unit}
              </span>
            </div>
            <div className="phase-item">
              <span className="phase-label">U2</span>
              <span className="phase-value">
                {data.voltage.u2.toFixed(1)} {data.voltage.unit}
              </span>
            </div>
            <div className="phase-item">
              <span className="phase-label">U3</span>
              <span className="phase-value">
                {data.voltage.u3.toFixed(1)} {data.voltage.unit}
              </span>
            </div>
          </div>
          <EnergyChart
            id="voltageChart"
            data={voltageHistory}
            lines={[
              { key: "value1", color: "#FFD700", name: "U1" },
              { key: "value2", color: "#FF9100", name: "U2" },
              { key: "value3", color: "#FFFF00", name: "U3" },
            ]}
            unit="V"
            height="150px"
          />
        </div>

        {/* Current */}
        <div className="glass-panel">
          <div className="panel-header">
            <span className="panel-title">Dòng điện (Current)</span>
            <span className="icon">🔌</span>
          </div>
          <div className="phase-grid">
            <div className="phase-item">
              <span className="phase-label">I1</span>
              <span className="phase-value">
                {data.current.i1.toFixed(1)} {data.current.unit}
              </span>
            </div>
            <div className="phase-item">
              <span className="phase-label">I2</span>
              <span className="phase-value">
                {data.current.i2.toFixed(1)} {data.current.unit}
              </span>
            </div>
            <div className="phase-item">
              <span className="phase-label">I3</span>
              <span className="phase-value">
                {data.current.i3.toFixed(1)} {data.current.unit}
              </span>
            </div>
          </div>
          <EnergyChart
            id="currentChart"
            data={currentHistory}
            lines={[
              { key: "value1", color: "#00E676", name: "I1" },
              { key: "value2", color: "#00B8D4", name: "I2" },
              { key: "value3", color: "#64DD17", name: "I3" },
            ]}
            unit="A"
            height="150px"
          />
        </div>

        {/* Power */}
        <div className="glass-panel">
          <div className="panel-header">
            <span className="panel-title">Công suất (Power)</span>
            <span className="icon">💡</span>
          </div>
          <div className="phase-grid">
            <div className="phase-item">
              <span className="phase-label">P1</span>
              <span className="phase-value">
                {data.power.p1.toFixed(1)} {data.power.unit}
              </span>
            </div>
            <div className="phase-item">
              <span className="phase-label">P2</span>
              <span className="phase-value">
                {data.power.p2.toFixed(1)} {data.power.unit}
              </span>
            </div>
            <div className="phase-item">
              <span className="phase-label">P3</span>
              <span className="phase-value">
                {data.power.p3.toFixed(1)} {data.power.unit}
              </span>
            </div>
            <div className="phase-item total-power">
              <span className="phase-label">Total</span>
              <span className="phase-value">
                {data.power.total.toFixed(1)} {data.power.unit}
              </span>
            </div>
          </div>
          <EnergyChart
            id="powerChart"
            data={powerHistory}
            lines={[
              { key: "value1", color: "#FF3D00", name: "P1" },
              { key: "value2", color: "#FF9100", name: "P2" },
              { key: "value3", color: "#FFEA00", name: "P3" },
            ]}
            unit="kW"
            height="150px"
          />
        </div>

        {/* Pmin / Pmax */}
        <div className="glass-panel">
          <div className="panel-header">
            <span className="panel-title">Pmin / Pmax</span>
            <span className="icon">📈</span>
          </div>

          <div style={{ width: "100%", height: "180px" }}>
            <Bar3DChart
              data={[
                { name: "Pmin", value: data.summary.pMin, fill: "#00e676" },
                { name: "Pmax", value: data.summary.pMax, fill: "#ff3d00" },
              ]}
            />
          </div>

          <div className="sub-value">
            <span>Pmin:</span>
            <span>{data.summary.pMin.toFixed(1)} kW</span>
          </div>
          <div className="sub-value">
            <span>Pmax:</span>
            <span>{data.summary.pMax.toFixed(1)} kW</span>
          </div>
        </div>

        {/* THD */}
        <div className="glass-panel" style={{ gridColumn: "span 1" }}>
          <div className="panel-header">
            <span className="panel-title">THD (Total Harmonic Distortion)</span>
            <span className="icon">📊</span>
          </div>
          <div>
            <span className="panel-value">{data.thd.main.toFixed(1)}</span>
            <span className="panel-unit">%</span>
          </div>

          <EnergyChart
            id="thdChart"
            data={thdHistory}
            lines={[
              { key: "value1", color: "#2962FF", name: "THD1" },
              { key: "value2", color: "#00B0FF", name: "THD2" },
              { key: "value3", color: "#00E5FF", name: "THD3" },
            ]}
            unit="%"
            height="150px"
          />

          <button
            className="collapse-btn"
            onClick={() => setShowFullTHD(!showFullTHD)}
          >
            {showFullTHD ? "Hide Details" : "Show More Details"}
          </button>

          {showFullTHD && (
            <div className="thd-grid">
              <div className="thd-item">
                <span>THD I1</span>
                <span>{data.thd.details.thdI1.toFixed(1)}%</span>
              </div>
              <div className="thd-item">
                <span>THD I2</span>
                <span>{data.thd.details.thdI2.toFixed(1)}%</span>
              </div>
              <div className="thd-item">
                <span>THD I3</span>
                <span>{data.thd.details.thdI3.toFixed(1)}%</span>
              </div>
              <div className="thd-item">
                <span>THD U1-N</span>
                <span>{data.thd.details.thdU1N.toFixed(1)}%</span>
              </div>
              <div className="thd-item">
                <span>THD U2-N</span>
                <span>{data.thd.details.thdU2N.toFixed(1)}%</span>
              </div>
              <div className="thd-item">
                <span>THD U3-N</span>
                <span>{data.thd.details.thdU3N.toFixed(1)}%</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
