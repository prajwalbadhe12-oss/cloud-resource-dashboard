import { useEffect, useState } from "react";

import {
  Activity,
  RefreshCw,
  Server,
  Cpu,
  CheckCircle,
  AlertCircle,
  Clock,
  Bell,
  Mail,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import "./Monitoring.css";

const API_BASE_URL = "http://127.0.0.1:5000/api";

function Monitoring() {
  const [instances, setInstances] = useState([]);
  const [cpuData, setCpuData] = useState({});
  const [alerts, setAlerts] = useState([]);

  const [alertSummary, setAlertSummary] = useState({
    total: 0,
    alarm: 0,
    ok: 0,
    insufficient_data: 0,
    sns_enabled: 0,
  });

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [alertsError, setAlertsError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  // ============================================================
  // LOAD MONITORING DATA
  // ============================================================

  const loadMonitoringData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      setAlertsError("");

      // ========================================================
      // 1. GET EC2 INSTANCES
      // ========================================================

      const response = await fetch(
        `${API_BASE_URL}/ec2/instances`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch EC2 instances."
        );
      }

      const data = await response.json();

      if (data.status !== "success") {
        throw new Error(
          data.message ||
            "Failed to load EC2 data."
        );
      }

      const instanceList = data.instances || [];

      setInstances(instanceList);

      // ========================================================
      // 2. GET CLOUDWATCH CPU DATA
      // ========================================================

      const cpuResults = {};

      await Promise.all(
        instanceList.map(async (instance) => {
          try {
            const cpuResponse = await fetch(
              `${API_BASE_URL}/cloudwatch/ec2/${instance.instance_id}/cpu`
            );

            if (!cpuResponse.ok) {
              console.error(
                `CloudWatch request failed for ${instance.instance_id}`
              );

              cpuResults[
                instance.instance_id
              ] = [];

              return;
            }

            const cpuResult =
              await cpuResponse.json();

            if (
              cpuResult.status ===
              "success"
            ) {
              cpuResults[
                instance.instance_id
              ] =
                cpuResult.datapoints || [];
            } else {
              cpuResults[
                instance.instance_id
              ] = [];
            }
          } catch (cpuError) {
            console.error(
              `CPU monitoring error for ${instance.instance_id}:`,
              cpuError
            );

            cpuResults[
              instance.instance_id
            ] = [];
          }
        })
      );

      setCpuData(cpuResults);

      // ========================================================
      // 3. GET CLOUDWATCH ALARMS + SNS
      // ========================================================

      try {
        const alertsResponse = await fetch(
          `${API_BASE_URL}/alerts`
        );

        if (!alertsResponse.ok) {
          throw new Error(
            "Failed to fetch CloudWatch alarms."
          );
        }

        const alertsData =
          await alertsResponse.json();

        if (
          alertsData.status ===
          "success"
        ) {
          setAlerts(
            alertsData.alarms || []
          );

          setAlertSummary(
            alertsData.summary || {
              total: 0,
              alarm: 0,
              ok: 0,
              insufficient_data: 0,
              sns_enabled: 0,
            }
          );
        } else {
          throw new Error(
            alertsData.message ||
              "Failed to load CloudWatch alarms."
          );
        }
      } catch (alertError) {
        console.error(
          "CloudWatch alerts error:",
          alertError
        );

        setAlertsError(
          alertError.message ||
            "Unable to load CloudWatch alarms."
        );

        setAlerts([]);
      }

      // ========================================================
      // 4. UPDATE TIMESTAMP
      // ========================================================

      setLastUpdated(new Date());
    } catch (err) {
      console.error(
        "Monitoring Error:",
        err
      );

      setError(
        err.message ||
          "Unable to connect to Flask backend."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadMonitoringData();
  }, []);

  // ============================================================
  // AUTO REFRESH EVERY 30 SECONDS
  // ============================================================

  useEffect(() => {
    const interval = setInterval(() => {
      loadMonitoringData(true);
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // ============================================================
  // GET LATEST CPU
  // ============================================================

  const getLatestCPU = (instanceId) => {
    const points =
      cpuData[instanceId] || [];

    if (points.length === 0) {
      return null;
    }

    const sortedPoints = points
      .slice()
      .sort(
        (a, b) =>
          new Date(b.timestamp) -
          new Date(a.timestamp)
      );

    return (
      sortedPoints[0]?.average ??
      null
    );
  };

  // ============================================================
  // PREPARE CHART DATA
  // ============================================================

  const getChartData = (instanceId) => {
    const points =
      cpuData[instanceId] || [];

    return points
      .slice()
      .sort(
        (a, b) =>
          new Date(a.timestamp) -
          new Date(b.timestamp)
      )
      .map((point) => ({
        time: new Date(
          point.timestamp
        ).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),

        cpu: Number(
          point.average || 0
        ),
      }));
  };

  // ============================================================
  // SUMMARY COUNTS
  // ============================================================

  const runningCount =
    instances.filter(
      (instance) =>
        instance.state === "running"
    ).length;

  const stoppedCount =
    instances.filter(
      (instance) =>
        instance.state === "stopped"
    ).length;

  // ============================================================
  // LATEST UPDATED TIME
  // ============================================================

  const getLastUpdatedText = () => {
    if (!lastUpdated) {
      return "Not updated yet";
    }

    return lastUpdated.toLocaleTimeString();
  };

  // ============================================================
  // ALARM STATE
  // ============================================================

  const getAlertStateClass = (state) => {
    const normalizedState =
      String(state || "")
        .toUpperCase()
        .replace(/\s+/g, "_");

    if (
      normalizedState === "ALARM" ||
      normalizedState === "IN_ALARM"
    ) {
      return "monitoring-alert-state alarm";
    }

    if (normalizedState === "OK") {
      return "monitoring-alert-state ok";
    }

    if (
      normalizedState ===
        "INSUFFICIENT_DATA" ||
      normalizedState ===
        "INSUFFICIENT DATA"
    ) {
      return "monitoring-alert-state insufficient";
    }

    return "monitoring-alert-state unknown";
  };

  const getAlertStateLabel = (state) => {
    const normalizedState =
      String(state || "")
        .toUpperCase()
        .replace(/\s+/g, "_");

    if (
      normalizedState === "ALARM" ||
      normalizedState === "IN_ALARM"
    ) {
      return "IN ALARM";
    }

    if (normalizedState === "OK") {
      return "OK";
    }

    if (
      normalizedState ===
        "INSUFFICIENT_DATA" ||
      normalizedState ===
        "INSUFFICIENT DATA"
    ) {
      return "INSUFFICIENT DATA";
    }

    return state || "UNKNOWN";
  };

  // ============================================================
  // ALERT ICON
  // ============================================================

  const getAlertIcon = (state) => {
    const normalizedState =
      String(state || "")
        .toUpperCase()
        .replace(/\s+/g, "_");

    if (
      normalizedState === "ALARM" ||
      normalizedState === "IN_ALARM"
    ) {
      return (
        <AlertTriangle size={21} />
      );
    }

    if (normalizedState === "OK") {
      return (
        <CheckCircle size={21} />
      );
    }

    return <Clock size={21} />;
  };

  // ============================================================
  // GET SNS TOPIC NAME
  // ============================================================

  const getSnsTopic = (alert) => {
    const snsActions = Array.isArray(
      alert?.sns_actions
    )
      ? alert.sns_actions
      : [];

    if (snsActions.length === 0) {
      return "Not configured";
    }

    const snsArn = snsActions[0];

    if (!snsArn) {
      return "Not configured";
    }

    // Example:
    // arn:aws:sns:ap-south-1:765578794339:cloudops-alerts
    //
    // This extracts:
    // cloudops-alerts

    const arnParts = String(
      snsArn
    ).split(":");

    return (
      arnParts[arnParts.length - 1] ||
      "Not configured"
    );
  };

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatAlertDate = (value) => {
    if (!value) {
      return "Not available";
    }

    try {
      return new Date(
        value
      ).toLocaleString();
    } catch {
      return "Not available";
    }
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="monitoring-page">

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="monitoring-header">

        <div>
          <span className="monitoring-label">
            AWS CLOUDWATCH
          </span>

          <h2>
            Monitoring
          </h2>

          <p>
            Monitor EC2 health, CloudWatch
            CPU utilization, alarms and
            SNS notifications in real time.
          </p>
        </div>

        <div className="monitoring-header-actions">

          <div className="monitoring-live-status">

            <span className="monitoring-live-dot"></span>

            <div>
              <strong>
                LIVE
              </strong>

              <span>
                Auto-refresh every 30 seconds
              </span>
            </div>

          </div>

          <div className="monitoring-last-updated">

            <Clock size={15} />

            <span>
              Last updated:
            </span>

            <strong>
              {getLastUpdatedText()}
            </strong>

          </div>

          <button
            className="monitoring-refresh-btn"
            onClick={() =>
              loadMonitoringData(true)
            }
            disabled={
              loading ||
              refreshing
            }
          >

            <RefreshCw
              size={16}
              className={
                loading ||
                refreshing
                  ? "monitoring-spin"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}

          </button>

        </div>

      </div>

      {/* ======================================================
          SUMMARY CARDS
      ====================================================== */}

      <div className="monitoring-summary">

        {/* TOTAL INSTANCES */}

        <div className="monitoring-card">

          <div className="monitoring-card-icon instances">
            <Server size={21} />
          </div>

          <div>
            <span>
              Total Instances
            </span>

            <strong>
              {instances.length}
            </strong>

            <small>
              EC2 resources
            </small>
          </div>

        </div>

        {/* RUNNING */}

        <div className="monitoring-card">

          <div className="monitoring-card-icon running">
            <CheckCircle size={21} />
          </div>

          <div>
            <span>
              Running
            </span>

            <strong>
              {runningCount}
            </strong>

            <small>
              Currently active
            </small>
          </div>

        </div>

        {/* STOPPED */}

        <div className="monitoring-card">

          <div className="monitoring-card-icon stopped">
            <AlertCircle size={21} />
          </div>

          <div>
            <span>
              Stopped
            </span>

            <strong>
              {stoppedCount}
            </strong>

            <small>
              Currently stopped
            </small>
          </div>

        </div>

        {/* CLOUDWATCH */}

        <div className="monitoring-card">

          <div className="monitoring-card-icon cloudwatch">
            <Activity size={21} />
          </div>

          <div>
            <span>
              CloudWatch
            </span>

            <strong>
              LIVE
            </strong>

            <small>
              Metrics connected
            </small>
          </div>

        </div>

        {/* ALARMS */}

        <div className="monitoring-card">

          <div className="monitoring-card-icon alarms">
            <Bell size={21} />
          </div>

          <div>
            <span>
              Alarms
            </span>

            <strong>
              {alertSummary.total || 0}
            </strong>

            <small>
              CloudWatch alarms
            </small>
          </div>

        </div>

        {/* SNS */}

        <div className="monitoring-card">

          <div className="monitoring-card-icon sns">
            <Mail size={21} />
          </div>

          <div>
            <span>
              SNS
            </span>

            <strong>
              {alertSummary.sns_enabled || 0}
            </strong>

            <small>
              Notifications enabled
            </small>
          </div>

        </div>

      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="monitoring-error">

          <AlertCircle size={18} />

          <span>
            {error}
          </span>

        </div>
      )}

      {/* ======================================================
          CPU CHART SECTION
      ====================================================== */}

      {instances.length > 0 && (

        <div className="monitoring-chart-panel">

          <div className="monitoring-chart-header">

            <div>

              <span className="monitoring-section-label">
                CLOUDWATCH METRICS
              </span>

              <h3>
                CPU Utilization
              </h3>

              <p>
                CloudWatch CPU metrics for
                EC2 instances
              </p>

            </div>

            <div className="chart-metric-badge">

              <Cpu size={14} />

              CPUUtilization

            </div>

          </div>

          <div className="monitoring-charts">

            {instances.map(
              (instance) => {

                const chartData =
                  getChartData(
                    instance.instance_id
                  );

                const latestCPU =
                  getLatestCPU(
                    instance.instance_id
                  );

                return (

                  <div
                    className="instance-chart-card"
                    key={
                      instance.instance_id
                    }
                  >

                    {/* CHART HEADER */}

                    <div className="instance-chart-top">

                      <div className="instance-chart-name">

                        <span
                          className={
                            instance.state ===
                            "running"
                              ? "chart-instance-dot running"
                              : "chart-instance-dot stopped"
                          }
                        ></span>

                        <div>

                          <strong>
                            {instance.name ||
                              "Unnamed Instance"}
                          </strong>

                          <span>
                            {
                              instance.instance_id
                            }
                          </span>

                        </div>

                      </div>

                      <div className="latest-cpu">

                        <span>
                          Latest CPU
                        </span>

                        <strong>
                          {latestCPU !==
                          null
                            ? `${Number(
                                latestCPU
                              ).toFixed(
                                2
                              )}%`
                            : "No data"}
                        </strong>

                      </div>

                    </div>

                    {/* CHART */}

                    {chartData.length >
                    0 ? (

                      <div className="cpu-chart">

                        <ResponsiveContainer
                          width="100%"
                          height={230}
                        >

                          <LineChart
                            data={
                              chartData
                            }
                            margin={{
                              top: 10,
                              right: 15,
                              left: 0,
                              bottom: 5,
                            }}
                          >

                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                            />

                            <XAxis
                              dataKey="time"
                              tick={{
                                fontSize: 10,
                              }}
                              tickLine={
                                false
                              }
                              axisLine={
                                false
                              }
                            />

                            <YAxis
                              domain={[
                                0,
                                100,
                              ]}
                              tick={{
                                fontSize: 10,
                              }}
                              tickLine={
                                false
                              }
                              axisLine={
                                false
                              }
                              tickFormatter={(
                                value
                              ) =>
                                `${value}%`
                              }
                            />

                            <Tooltip
                              formatter={(
                                value
                              ) => [
                                `${Number(
                                  value
                                ).toFixed(
                                  2
                                )}%`,
                                "CPU",
                              ]}
                              labelFormatter={(
                                label
                              ) =>
                                `Time: ${label}`
                              }
                            />

                            <Line
                              type="monotone"
                              dataKey="cpu"
                              stroke="#f59e0b"
                              strokeWidth={
                                2.5
                              }
                              dot={false}
                              activeDot={{
                                r: 5,
                              }}
                            />

                          </LineChart>

                        </ResponsiveContainer>

                      </div>

                    ) : (

                      <div className="chart-no-data">

                        <Activity
                          size={24}
                        />

                        <span>
                          No CloudWatch CPU
                          datapoints available
                        </span>

                      </div>

                    )}

                  </div>

                );
              }
            )}

          </div>

        </div>
      )}

      {/* ======================================================
          EC2 INSTANCE MONITORING
      ====================================================== */}

      <div className="monitoring-panel">

        <div className="monitoring-panel-header">

          <div>

            <span className="monitoring-section-label">
              EC2 HEALTH
            </span>

            <h3>
              EC2 Instance Monitoring
            </h3>

            <p>
              CPU utilization and instance health
            </p>

          </div>

          <div className="monitoring-live">

            <span></span>

            LIVE

          </div>

        </div>

        {loading &&
        instances.length === 0 ? (

          <div className="monitoring-loading">

            <RefreshCw
              size={24}
              className="monitoring-spin"
            />

            <p>
              Loading CloudWatch metrics...
            </p>

          </div>

        ) : instances.length ===
          0 ? (

          <div className="monitoring-empty">

            <Server size={38} />

            <h3>
              No EC2 instances found
            </h3>

            <p>
              No EC2 resources are currently
              available in the selected AWS
              region.
            </p>

          </div>

        ) : (

          <div className="monitoring-table-wrapper">

            <table className="monitoring-table">

              <thead>

                <tr>

                  <th>
                    Instance
                  </th>

                  <th>
                    Instance ID
                  </th>

                  <th>
                    State
                  </th>

                  <th>
                    Type
                  </th>

                  <th>
                    CPU Utilization
                  </th>

                  <th>
                    Health
                  </th>

                </tr>

              </thead>

              <tbody>

                {instances.map(
                  (instance) => {

                    const cpu =
                      getLatestCPU(
                        instance.instance_id
                      );

                    const isRunning =
                      instance.state ===
                      "running";

                    return (

                      <tr
                        key={
                          instance.instance_id
                        }
                      >

                        {/* INSTANCE */}

                        <td>

                          <div className="monitoring-instance">

                            <span
                              className={
                                isRunning
                                  ? "instance-dot running"
                                  : "instance-dot stopped"
                              }
                            ></span>

                            <strong>
                              {instance.name ||
                                "Unnamed"}
                            </strong>

                          </div>

                        </td>

                        {/* INSTANCE ID */}

                        <td>

                          <span className="monitoring-id">

                            {
                              instance.instance_id
                            }

                          </span>

                        </td>

                        {/* STATE */}

                        <td>

                          <span
                            className={
                              isRunning
                                ? "monitoring-state running"
                                : "monitoring-state stopped"
                            }
                          >

                            {isRunning
                              ? "RUNNING"
                              : "STOPPED"}

                          </span>

                        </td>

                        {/* TYPE */}

                        <td>

                          <span className="monitoring-type">

                            {
                              instance.instance_type
                            }

                          </span>

                        </td>

                        {/* CPU */}

                        <td>

                          <div className="cpu-cell">

                            <div className="cpu-value">

                              {cpu !==
                              null
                                ? `${Number(
                                    cpu
                                  ).toFixed(
                                    2
                                  )}%`
                                : "No data"}

                            </div>

                            {cpu !==
                              null && (

                              <div className="cpu-bar">

                                <div
                                  className="cpu-progress"
                                  style={{
                                    width: `${Math.min(
                                      Math.max(
                                        Number(
                                          cpu
                                        ),
                                        0
                                      ),
                                      100
                                    )}%`,
                                  }}
                                ></div>

                              </div>

                            )}

                          </div>

                        </td>

                        {/* HEALTH */}

                        <td>

                          {isRunning ? (

                            <span className="health-status healthy">

                              <CheckCircle
                                size={14}
                              />

                              Healthy

                            </span>

                          ) : (

                            <span className="health-status inactive">

                              <AlertCircle
                                size={14}
                              />

                              Inactive

                            </span>

                          )}

                        </td>

                      </tr>

                    );
                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* ======================================================
          CLOUDWATCH + SNS ALERTS
      ====================================================== */}

      <div className="monitoring-alerts-panel">

        <div className="monitoring-alerts-header">

          <div>

            <span className="monitoring-section-label">
              CLOUDWATCH + SNS
            </span>

            <h3>
              Alerts & Notifications
            </h3>

            <p>
              Monitor CloudWatch alarms and
              SNS notification configuration.
            </p>

          </div>

          <div className="monitoring-alerts-header-icon">
            <Bell size={21} />
          </div>

        </div>

        {/* ALERT SUMMARY */}

        <div className="monitoring-alert-summary">

          <div className="monitoring-alert-summary-card">

            <span>
              Total Alarms
            </span>

            <strong>
              {alertSummary.total || 0}
            </strong>

            <small>
              CloudWatch alarms
            </small>

          </div>

          <div className="monitoring-alert-summary-card alarm">

            <span>
              In Alarm
            </span>

            <strong>
              {alertSummary.alarm || 0}
            </strong>

            <small>
              Triggered alarms
            </small>

          </div>

          <div className="monitoring-alert-summary-card ok">

            <span>
              OK
            </span>

            <strong>
              {alertSummary.ok || 0}
            </strong>

            <small>
              Normal state
            </small>

          </div>

          <div className="monitoring-alert-summary-card insufficient">

            <span>
              Insufficient Data
            </span>

            <strong>
              {alertSummary.insufficient_data || 0}
            </strong>

            <small>
              Waiting for metrics
            </small>

          </div>

          <div className="monitoring-alert-summary-card sns">

            <span>
              SNS Enabled
            </span>

            <strong>
              {alertSummary.sns_enabled || 0}
            </strong>

            <small>
              Notifications connected
            </small>

          </div>

        </div>

        {/* ALERT ERROR */}

        {alertsError && (

          <div className="monitoring-alert-error">

            <AlertCircle size={17} />

            <span>
              {alertsError}
            </span>

          </div>

        )}

        {/* NO ALARMS */}

        {!alertsError &&
          alerts.length === 0 && (

            <div className="monitoring-alert-empty">

              <Bell size={35} />

              <h4>
                No CloudWatch alarms found
              </h4>

              <p>
                Create a CloudWatch alarm to
                monitor your AWS resources.
              </p>

            </div>

          )}

        {/* ALERT LIST */}

        {alerts.length > 0 && (

          <div className="monitoring-alert-list">

            {alerts.map(
              (alert) => {

                const stateClass =
                  getAlertStateClass(
                    alert.state
                  );

                const stateLabel =
                  getAlertStateLabel(
                    alert.state
                  );

                const snsTopic =
                  getSnsTopic(alert);

                return (

                  <div
                    className="monitoring-alert-card"
                    key={
                      alert.name
                    }
                  >

                    {/* ALERT TOP */}

                    <div className="monitoring-alert-top">

                      <div className="monitoring-alert-icon">

                        {getAlertIcon(
                          alert.state
                        )}

                      </div>

                      <div className="monitoring-alert-title">

                        <div className="monitoring-alert-name-row">

                          <h4>
                            {alert.name}
                          </h4>

                          <span
                            className={
                              stateClass
                            }
                          >
                            {stateLabel}
                          </span>

                        </div>

                        <p>
                          EC2 CloudWatch
                          monitoring alarm
                        </p>

                      </div>

                    </div>

                    {/* ALERT DETAILS */}

                    <div className="monitoring-alert-details">

                      <div className="monitoring-alert-detail">

                        <span>
                          Metric
                        </span>

                        <strong>
                          {alert.metric_name ||
                            "CPUUtilization"}
                        </strong>

                      </div>

                      <div className="monitoring-alert-detail">

                        <span>
                          Threshold
                        </span>

                        <strong>
                          ≥{" "}
                          {alert.threshold ??
                            80}
                          %
                        </strong>

                      </div>

                      <div className="monitoring-alert-detail">

                        <span>
                          Evaluation
                        </span>

                        <strong>
                          {alert.evaluation_periods ||
                            1}{" "}
                          ×{" "}
                          {Math.round(
                            (alert.period ||
                              300) /
                              60
                          )}{" "}
                          min
                        </strong>

                      </div>

                      <div className="monitoring-alert-detail">

                        <span>
                          Statistic
                        </span>

                        <strong>
                          {alert.statistic ||
                            "Average"}
                        </strong>

                      </div>

                    </div>

                    {/* SNS CONNECTION */}

                    <div className="monitoring-sns-box">

                      <div className="monitoring-sns-icon">
                        <Mail size={18} />
                      </div>

                      <div className="monitoring-sns-content">

                        <strong>
                          SNS Notifications
                        </strong>

                        <span>

                          {alert.sns_enabled
                            ? "Notifications connected"
                            : "Notifications not connected"}

                        </span>

                        <small>
                          Topic:{" "}
                          {snsTopic}
                        </small>

                      </div>

                      <div
                        className={
                          alert.sns_enabled
                            ? "monitoring-sns-status enabled"
                            : "monitoring-sns-status disabled"
                        }
                      >

                        <span></span>

                        {alert.sns_enabled
                          ? "Enabled"
                          : "Disabled"}

                      </div>

                    </div>

                    {/* STATE REASON */}

                    <div className="monitoring-alert-reason">

                      <div className="monitoring-alert-reason-header">

                        <AlertTriangle
                          size={16}
                        />

                        <strong>
                          State Reason
                        </strong>

                      </div>

                      <p>
                        {alert.state_reason ||
                          "No state reason available."}
                      </p>

                    </div>

                    {/* LAST UPDATED */}

                    <div className="monitoring-alert-footer">

                      <Clock size={14} />

                      <span>
                        Last updated:{" "}
                        {formatAlertDate(
                          alert.state_updated
                        )}
                      </span>

                      {alert.sns_enabled && (

                        <span className="monitoring-sns-connected">

                          <ShieldCheck
                            size={14}
                          />

                          SNS connected

                        </span>

                      )}

                    </div>

                  </div>

                );
              }
            )}

          </div>

        )}

      </div>

      {/* ======================================================
          INFORMATION CARD
      ====================================================== */}

      <div className="monitoring-info">

        <Cpu size={19} />

        <div>

          <strong>
            CloudWatch CPU Monitoring
          </strong>

          <p>
            CPU utilization is retrieved from
            Amazon CloudWatch using the
            AWS/EC2 CPUUtilization metric.
            The dashboard displays available
            CloudWatch datapoints for each
            EC2 instance and monitors configured
            CloudWatch alarms with SNS
            notification status. Monitoring data
            is refreshed automatically every
            30 seconds.
          </p>

        </div>

      </div>

    </div>
  );
}

export default Monitoring;