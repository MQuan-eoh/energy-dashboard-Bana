import { useState, useEffect, useRef } from "react";
import "./App.css";
import EnergyChart from "./components/EnergyChart";
import Bar3DChart from "./components/Bar3DChart";
import ThemeSettings from "./components/ThemeSettings";
import eraWidget from "@eohjsc/era-widget";

const Header = ({ activePower, activeEnergy, acId }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="dashboard-header">
      <div className="header-item">
        <span className="header-label">Current Time</span>
        <span className="header-value">
          <span className="time-part">
            {currentTime.toLocaleTimeString("vi-VN")}
          </span>
          <span className="date-part">
            {" "}
            {currentTime.toLocaleDateString("vi-VN")}
          </span>
        </span>
      </div>

      <div className="header-item">
        <span className="header-label">Active Power</span>
        <span className="header-value">{activePower.toFixed(2)} kW</span>
      </div>
      <div className="header-item">
        <span className="header-label">Active Energy</span>
        <span className="header-value">{activeEnergy.toFixed(2)} kWh</span>
      </div>
    </div>
  );
};

function App() {
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const configIdsRef = useRef([]);
  const pendingValuesRef = useRef(null);
  const lastChartUpdateRef = useRef(0); // Track last chart update for throttling

  // Initial Data State
  const [data, setData] = useState({
    voltage: {
      u1: 0,
      u2: 0,
      u3: 0,
      uMax1: 0,
      uMax2: 0,
      uMax3: 0,
      unit: "V",
    },
    current: {
      i1: 0,
      i2: 0,
      i3: 0,
      iMax1: 0,
      iMax2: 0,
      iMax3: 0,
      unit: "A",
    },
    power: {
      p1: 0,
      p2: 0,
      p3: 0,
      pMax1: 0,
      pMax2: 0,
      pMax3: 0,
      total: 0,
      unit: "kW",
    },
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
    extra: {
      activePowerTotal: 0,
      activeEnergyDelivered: 0,
      acId: "",
    },
    cosPhi: {
      pf1: 0,
      pf2: 0,
      pf3: 0,
      total: 0,
    },
  });

  // History State for Charts
  const [voltageHistory, setVoltageHistory] = useState([]);
  const [currentHistory, setCurrentHistory] = useState([]);
  const [powerHistory, setPowerHistory] = useState([]);
  const [cosPhiHistory, setCosPhiHistory] = useState([]);
  const [thdHistory, setThdHistory] = useState([]);

  useEffect(() => {
    const processValues = (values) => {
      const ids = configIdsRef.current;
      if (ids.length === 0) return;

      const getValue = (index, defaultValue = 0) =>
        ids[index] && values[ids[index]]
          ? values[ids[index]].value
          : defaultValue;

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
      const pTotal = p1 + p2 + p3;

      // THD values
      const thdI1 = getValue(9);
      const thdI2 = getValue(10);
      const thdI3 = getValue(11);
      const thdU1N = getValue(12);
      const thdU2N = getValue(13);
      const thdU3N = getValue(14);

      const activePowerTotal = getValue(15);
      const activeEnergyDelivered = getValue(16);

      const pf1 = getValue(17);
      const pf2 = getValue(18);
      const pf3 = getValue(19);
      const pfTotal = getValue(20);

      // Max Values
      const uMax1 = getValue(21);
      const uMax2 = getValue(22);
      const uMax3 = getValue(23);

      const iMax1 = getValue(24);
      const iMax2 = getValue(25);
      const iMax3 = getValue(26);

      const pMax1 = getValue(27);
      const pMax2 = getValue(28);
      const pMax3 = getValue(29);

      const thdMain = Math.max(thdI1, thdI2, thdI3);
      const time = new Date().toLocaleTimeString([], { hour12: false });

      // Update Data State
      setData(() => {
        return {
          voltage: { u1, u2, u3, uMax1, uMax2, uMax3, unit: "V" },
          current: { i1, i2, i3, iMax1, iMax2, iMax3, unit: "A" },
          power: { p1, p2, p3, pMax1, pMax2, pMax3, total: pTotal, unit: "kW" },
          thd: {
            main: thdMain,
            details: { thdI1, thdI2, thdI3, thdU1N, thdU2N, thdU3N },
          },
          extra: {
            activePowerTotal,
            activeEnergyDelivered,
          },
          cosPhi: {
            pf1,
            pf2,
            pf3,
            total: pfTotal,
          },
        };
      });

      // Update History - Throttle to every 10 seconds, keep 60 points for 10 minutes
      const now = Date.now();
      const SAMPLE_INTERVAL_MS = 10000; // 10 seconds
      const MAX_DATA_POINTS = 60; // 60 points × 10s = 10 minutes

      if (now - lastChartUpdateRef.current >= SAMPLE_INTERVAL_MS) {
        lastChartUpdateRef.current = now;
        
        const updateChartData = (prev, v1, v2, v3) => {
          const newData = [...prev, { time, value1: v1, value2: v2, value3: v3 }];
          return newData.slice(-MAX_DATA_POINTS);
        };

        setVoltageHistory((prev) => updateChartData(prev, u1, u2, u3));
        setCurrentHistory((prev) => updateChartData(prev, i1, i2, i3));
        setPowerHistory((prev) => updateChartData(prev, p1, p2, p3));
        setCosPhiHistory((prev) => updateChartData(prev, pf1, pf2, pf3));
        setThdHistory((prev) => updateChartData(prev, thdI1, thdI2, thdI3));
      }
    };

    eraWidget.init({
      needRealtimeConfigs: true,
      needHistoryConfigs: true,
      needActions: true,
      maxRealtimeConfigsCount: 30,
      maxHistoryConfigsCount: 1,
      maxActionsCount: 2,
      minRealtimeConfigsCount: 0,
      minHistoryConfigsCount: 0,
      minActionsCount: 0,
      mobileHeight: 1000,
      onConfiguration: (configuration) => {
        // Store the IDs in order: U1, U2, U3, I1, I2, I3, P1, P2, P3, ...
        configIdsRef.current = configuration.realtime_configs.map((c) => c.id);
        console.log("E-RA Configuration Loaded:", configIdsRef.current);

        if (pendingValuesRef.current) {
          console.log("Processing pending values...");
          processValues(pendingValuesRef.current);
          pendingValuesRef.current = null;
        }
      },
      onValues: (values) => {
        if (configIdsRef.current.length === 0) {
          console.log("Config not ready, storing values as pending");
          pendingValuesRef.current = values;
          return;
        }
        processValues(values);
      },
    });
  }, []);

  return (
    <div className="dashboard-container">
      <Header
        activePower={data.extra.activePowerTotal}
        onAddDevice={() => setIsConfigModalOpen(true)}
        activeEnergy={data.extra.activeEnergyDelivered}
      />
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
              <span className="phase-label">U12</span>
              <span className="phase-value">
                {data.voltage.u1.toFixed(2)} {data.voltage.unit}
              </span>
            </div>
            <div className="phase-item">
              <span className="phase-label">U23</span>
              <span className="phase-value">
                {data.voltage.u2.toFixed(2)} {data.voltage.unit}
              </span>
            </div>
            <div className="phase-item">
              <span className="phase-label">U31</span>
              <span className="phase-value">
                {data.voltage.u3.toFixed(2)} {data.voltage.unit}
              </span>
            </div>
          </div>
          <EnergyChart
            id="voltageChart"
            data={voltageHistory}
            lines={[
              { key: "value1", color: "#FF5252", name: "U12" },
              { key: "value2", color: "#4CAF50", name: "U23" },
              { key: "value3", color: "#2196F3", name: "U31" },
            ]}
            unit="V"
            height="150px"
          />
          <div className="max-values-container">
            <div className="max-item">
              <span className="max-label">Max U12</span>
              <span className="max-value">
                {data.voltage.uMax1.toFixed(2)} {data.voltage.unit}
              </span>
            </div>
            <div className="max-item">
              <span className="max-label">Max U23</span>
              <span className="max-value">
                {data.voltage.uMax2.toFixed(2)} {data.voltage.unit}
              </span>
            </div>
            <div className="max-item">
              <span className="max-label">Max U31</span>
              <span className="max-value">
                {data.voltage.uMax3.toFixed(2)} {data.voltage.unit}
              </span>
            </div>
          </div>
        </div>

        {/* Current */}
        <div className="glass-panel">
          <div className="panel-header">
            <span className="panel-title">Dòng điện (Current)</span>
            <span className="icon">🔌</span>
          </div>
          <div className="phase-grid">
            <div className="phase-item">
              <span className="phase-label">I12</span>
              <span className="phase-value">
                {data.current.i1.toFixed(2)} {data.current.unit}
              </span>
            </div>
            <div className="phase-item">
              <span className="phase-label">I23</span>
              <span className="phase-value">
                {data.current.i2.toFixed(2)} {data.current.unit}
              </span>
            </div>
            <div className="phase-item">
              <span className="phase-label">I31</span>
              <span className="phase-value">
                {data.current.i3.toFixed(2)} {data.current.unit}
              </span>
            </div>
          </div>
          <EnergyChart
            id="currentChart"
            data={currentHistory}
            lines={[
              { key: "value1", color: "#00E676", name: "I12" },
              { key: "value2", color: "#00B8D4", name: "I23" },
              { key: "value3", color: "#64DD17", name: "I31" },
            ]}
            unit="A"
            height="150px"
          />
          <div className="max-values-container">
            <div className="max-item">
              <span className="max-label">Max I12</span>
              <span className="max-value">
                {data.current.iMax1.toFixed(2)} {data.current.unit}
              </span>
            </div>
            <div className="max-item">
              <span className="max-label">Max I23</span>
              <span className="max-value">
                {data.current.iMax2.toFixed(2)} {data.current.unit}
              </span>
            </div>
            <div className="max-item">
              <span className="max-label">Max I31</span>
              <span className="max-value">
                {data.current.iMax3.toFixed(2)} {data.current.unit}
              </span>
            </div>
          </div>
        </div>

        {/* Power */}
        <div className="glass-panel">
          <div className="panel-header">
            <span className="panel-title">Công suất (Power)</span>
            <span className="icon">💡</span>
          </div>
          <div className="phase-grid">
            <div className="phase-item">
              <span className="phase-label">P12</span>
              <span className="phase-value">
                {data.power.p1.toFixed(2)} {data.power.unit}
              </span>
            </div>
            <div className="phase-item">
              <span className="phase-label">P23</span>
              <span className="phase-value">
                {data.power.p2.toFixed(2)} {data.power.unit}
              </span>
            </div>
            <div className="phase-item">
              <span className="phase-label">P31</span>
              <span className="phase-value">
                {data.power.p3.toFixed(2)} {data.power.unit}
              </span>
            </div>
          </div>
          <EnergyChart
            id="powerChart"
            data={powerHistory}
            lines={[
              { key: "value1", color: "#FF3D00", name: "P12" },
              { key: "value2", color: "#FF9100", name: "P23" },
              { key: "value3", color: "#FFEA00", name: "P31" },
            ]}
            unit="kW"
            height="150px"
          />
          <div className="max-values-container">
            <div className="max-item">
              <span className="max-label">Max P12</span>
              <span className="max-value">
                {data.power.pMax1.toFixed(2)} {data.power.unit}
              </span>
            </div>
            <div className="max-item">
              <span className="max-label">Max P23</span>
              <span className="max-value">
                {data.power.pMax2.toFixed(2)} {data.power.unit}
              </span>
            </div>
            <div className="max-item">
              <span className="max-label">Max P31</span>
              <span className="max-value">
                {data.power.pMax3.toFixed(2)} {data.power.unit}
              </span>
            </div>
          </div>
        </div>

        {/* Cos Phi */}
        <div className="glass-panel">
          <div className="panel-header">
            <span className="panel-title">Cos Phi (Power Factor)</span>
            <span className="icon">📈</span>
          </div>
          <div className="phase-grid">
            <div className="phase-item">
              <span className="phase-label">PF1</span>
              <span className="phase-value">{data.cosPhi.pf1.toFixed(2)}</span>
            </div>
            <div className="phase-item">
              <span className="phase-label">PF2</span>
              <span className="phase-value">{data.cosPhi.pf2.toFixed(2)}</span>
            </div>
            <div className="phase-item">
              <span className="phase-label">PF3</span>
              <span className="phase-value">{data.cosPhi.pf3.toFixed(2)}</span>
            </div>
          </div>
          <EnergyChart
            id="cosPhiChart"
            data={cosPhiHistory}
            lines={[
              { key: "value1", color: "#E040FB", name: "PF1" },
              { key: "value2", color: "#7C4DFF", name: "PF2" },
              { key: "value3", color: "#FF4081", name: "PF3" },
            ]}
            unit=""
            height="150px"
          />
        </div>

        {/* THD */}
        <div className="glass-panel" style={{ gridColumn: "span 1" }}>
          <div className="panel-header">
            <span className="panel-title">THD (Total Harmonic Distortion)</span>
            <span className="icon">📊</span>
          </div>
          <div>
            <span className="panel-value">{data.thd.main.toFixed(2)}</span>
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

          {/* THD Values - 2 rows: U row and I row, each with 3 phases */}
          <div className="max-values-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '1rem' }}>
            {/* Row 1: THD U (Voltage) - 3 phases */}
            <div className="max-item">
              <span className="max-label">THD U1</span>
              <span className="max-value">{data.thd.details.thdU1N.toFixed(2)}%</span>
            </div>
            <div className="max-item">
              <span className="max-label">THD U2</span>
              <span className="max-value">{data.thd.details.thdU2N.toFixed(2)}%</span>
            </div>
            <div className="max-item">
              <span className="max-label">THD U3</span>
              <span className="max-value">{data.thd.details.thdU3N.toFixed(2)}%</span>
            </div>
            {/* Row 2: THD I (Current) - 3 phases */}
            <div className="max-item">
              <span className="max-label">THD I1</span>
              <span className="max-value">{data.thd.details.thdI1.toFixed(2)}%</span>
            </div>
            <div className="max-item">
              <span className="max-label">THD I2</span>
              <span className="max-value">{data.thd.details.thdI2.toFixed(2)}%</span>
            </div>
            <div className="max-item">
              <span className="max-label">THD I3</span>
              <span className="max-value">{data.thd.details.thdI3.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </div>
      <ThemeSettings />
    </div>
  );
}
export default App;
