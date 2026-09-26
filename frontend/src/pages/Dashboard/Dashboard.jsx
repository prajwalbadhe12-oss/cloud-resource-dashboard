import { useEffect, useState } from "react";

import {
  Server,
  Activity,
  HardDrive,
  RefreshCw,
  Clock,
  BarChart3,
  ArrowRight,
  CheckCircle,
  Database,
  Monitor,
  Zap,
  Upload,
  Trash2,
  Plus,
  Power,
  FileText,
  DollarSign,
  Bell,
  AlertTriangle,
  Mail,
  XCircle
} from "lucide-react";

import "./Dashboard.css";

const API_BASE_URL = "http://127.0.0.1:5000/api";

function Dashboard({
  dashboardData,
  loading,
  refreshing,
  error,
  lastUpdated,
  loadDashboardData
}) {
  // =========================================
  // REAL ACTIVITY LOGS
  // =========================================

  const [activityLogs, setActivityLogs] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);

  // =========================================
  // AWS COST
  // =========================================

  const [costData, setCostData] = useState({
    cost: 0,
    currency: "USD",
    period: null
  });

  const [costLoading, setCostLoading] = useState(true);
  const [costError, setCostError] = useState("");

  // =========================================
  // CLOUDWATCH / SNS ALERTS
  // =========================================

  const [alerts, setAlerts] = useState([]);

  const [alertSummary, setAlertSummary] = useState({
    total: 0,
    alarm: 0,
    ok: 0,
    insufficient_data: 0,
    sns_enabled: 0
  });

  const [alertsLoading, setAlertsLoading] = useState(true);
  const [alertsError, setAlertsError] = useState("");

  // =========================================
  // LAST UPDATED
  // =========================================

  const getLastUpdatedText = () => {
    if (!lastUpdated) {
      return "Not updated yet";
    }

    return lastUpdated.toLocaleTimeString();
  };

  // =========================================
  // SAFE DASHBOARD DATA
  // =========================================

  const data = dashboardData || {
    totalEC2: 0,
    runningEC2: 0,
    stoppedEC2: 0,
    s3Buckets: 0
  };

  // =========================================
  // LOAD AWS COST
  // =========================================

  const loadCostData = async () => {
    try {
      setCostLoading(true);
      setCostError("");

      const response = await fetch(`${API_BASE_URL}/cost`);

      if (!response.ok) {
        throw new Error("Unable to load AWS cost");
      }

      const result = await response.json();

      if (result.status === "success") {
        setCostData({
          cost: Number(result.cost || 0),
          currency: result.currency || "USD",
          period: result.period || null
        });
      } else {
        throw new Error(
          result.message || "Unable to load AWS cost"
        );
      }
    } catch (err) {
      console.error("AWS Cost Error:", err);
      setCostError("Cost unavailable");
    } finally {
      setCostLoading(false);
    }
  };

  // =========================================
  // LOAD COST ON PAGE LOAD
  // =========================================

  useEffect(() => {
    loadCostData();
  }, []);

  // =========================================
  // COST AUTO REFRESH
  // =========================================

  useEffect(() => {
    const interval = setInterval(() => {
      loadCostData();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // =========================================
  // FORMAT COST PERIOD
  // =========================================

  const getCostPeriodText = () => {
    if (!costData.period) {
      return "Current billing period";
    }

    try {
      const start = new Date(
        `${costData.period.start}T00:00:00`
      );

      return start.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric"
      });
    } catch {
      return "Current billing period";
    }
  };

  // =========================================
  // FORMAT COST
  // =========================================

  const getFormattedCost = () => {
    if (costLoading) {
      return "Loading...";
    }

    if (costError) {
      return "N/A";
    }

    return `$${Number(costData.cost || 0).toFixed(2)}`;
  };

  // =========================================
  // LOAD CLOUDWATCH / SNS ALERTS
  // =========================================

  const loadAlerts = async () => {
    try {
      setAlertsLoading(true);
      setAlertsError("");

      const response = await fetch(`${API_BASE_URL}/alerts`);

      if (!response.ok) {
        throw new Error(
          "Unable to load CloudWatch alerts"
        );
      }

      const result = await response.json();

      if (result.status === "success") {
        setAlerts(
          Array.isArray(result.alarms)
            ? result.alarms
            : []
        );

        setAlertSummary(
          result.summary || {
            total: 0,
            alarm: 0,
            ok: 0,
            insufficient_data: 0,
            sns_enabled: 0
          }
        );
      } else {
        throw new Error(
          result.message ||
            "Unable to load CloudWatch alerts"
        );
      }
    } catch (err) {
      console.error(
        "CloudWatch Alerts Error:",
        err
      );

      setAlertsError("Alerts unavailable");
    } finally {
      setAlertsLoading(false);
    }
  };

  // =========================================
  // LOAD ALERTS ON PAGE LOAD
  // =========================================

  useEffect(() => {
    loadAlerts();
  }, []);

  // =========================================
  // ALERT AUTO REFRESH
  // =========================================

  useEffect(() => {
    const interval = setInterval(() => {
      loadAlerts();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // =========================================
  // ALERT STATE CLASS
  // =========================================

  const getAlertStateClass = (state) => {
    if (state === "ALARM") {
      return "alert-state alarm";
    }

    if (state === "OK") {
      return "alert-state ok";
    }

    if (state === "INSUFFICIENT_DATA") {
      return "alert-state insufficient";
    }

    return "alert-state unknown";
  };

  // =========================================
  // ALERT ICON
  // =========================================

  const getAlertIcon = (state) => {
    if (state === "ALARM") {
      return <AlertTriangle size={22} />;
    }

    if (state === "OK") {
      return <CheckCircle size={22} />;
    }

    return <Bell size={22} />;
  };

  // =========================================
  // ALERT STATE TEXT
  // =========================================

  const getAlertStateText = (state) => {
    if (state === "ALARM") {
      return "ALARM";
    }

    if (state === "OK") {
      return "OK";
    }

    if (state === "INSUFFICIENT_DATA") {
      return "INSUFFICIENT DATA";
    }

    return state || "UNKNOWN";
  };

  // =========================================
  // ALERT STATE DESCRIPTION
  // =========================================

  const getAlertStateDescription = (state) => {
    if (state === "ALARM") {
      return "The alarm threshold has been breached.";
    }

    if (state === "OK") {
      return "The monitored metric is currently within the configured threshold.";
    }

    if (state === "INSUFFICIENT_DATA") {
      return "CloudWatch is waiting for a usable datapoint before evaluating this alarm.";
    }

    return "CloudWatch has not provided a recognized alarm state.";
  };

  // =========================================
  // COMPARISON TEXT
  // =========================================

  const getComparisonText = (operator) => {
    if (
      operator ===
      "GreaterThanOrEqualToThreshold"
    ) {
      return "≥";
    }

    if (
      operator ===
      "GreaterThanThreshold"
    ) {
      return ">";
    }

    if (
      operator ===
      "LessThanOrEqualToThreshold"
    ) {
      return "≤";
    }

    if (
      operator ===
      "LessThanThreshold"
    ) {
      return "<";
    }

    return "";
  };

  // =========================================
  // FORMAT ALERT UPDATED TIME
  // =========================================

  const getAlertUpdatedTime = (timestamp) => {
    if (!timestamp) {
      return "Not available";
    }

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return "Not available";
    }

    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  // =========================================
  // LOAD ACTIVITY LOGS
  // =========================================

  const loadActivityLogs = async () => {
    try {
      setActivityLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/activity-logs`
      );

      if (!response.ok) {
        throw new Error(
          "Unable to load activity logs"
        );
      }

      const result = await response.json();

      if (result.status === "success") {
        const logs = Array.isArray(result.logs)
          ? result.logs
          : [];

        logs.sort(
          (a, b) =>
            new Date(b.timestamp) -
            new Date(a.timestamp)
        );

        setActivityLogs(logs.slice(0, 5));
      }
    } catch (err) {
      console.error(
        "Activity Logs Error:",
        err
      );
    } finally {
      setActivityLoading(false);
    }
  };

  // =========================================
  // ACTIVITY LOG AUTO REFRESH
  // =========================================

  useEffect(() => {
    loadActivityLogs();

    const interval = setInterval(() => {
      loadActivityLogs();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // =========================================
  // QUICK NAVIGATION
  // =========================================

  const goToEC2 = () => {
    window.location.href = "/ec2";
  };

  const goToS3 = () => {
    window.location.href = "/s3";
  };

  const goToMonitoring = () => {
    window.location.href = "/monitoring";
  };

  // =========================================
  // ACTIVITY ICON
  // =========================================

  const getActivityIcon = (log) => {
    const action = String(
      log.action || ""
    ).toUpperCase();

    const operation = String(
      log.operation || ""
    ).toUpperCase();

    if (log.status === "failure") {
      return <XCircle size={17} />;
    }

    if (action === "START") {
      return <Power size={17} />;
    }

    if (action === "STOP") {
      return <Power size={17} />;
    }

    if (action === "UPLOAD") {
      return <Upload size={17} />;
    }

    if (
      action === "DELETE_OBJECT" ||
      action === "DELETE_BUCKET"
    ) {
      return <Trash2 size={17} />;
    }

    if (action === "CREATE_BUCKET") {
      return <Plus size={17} />;
    }

    if (operation === "EC2") {
      return <Server size={17} />;
    }

    if (operation === "S3") {
      return <HardDrive size={17} />;
    }

    return <Activity size={17} />;
  };

  // =========================================
  // ACTIVITY CSS CLASS
  // =========================================

  const getActivityClass = (log) => {
    if (log.status === "failure") {
      return "failure-activity";
    }

    const action = String(
      log.action || ""
    ).toUpperCase();

    if (
      action === "DELETE_OBJECT" ||
      action === "DELETE_BUCKET"
    ) {
      return "delete-activity";
    }

    if (
      action === "UPLOAD" ||
      action === "CREATE_BUCKET"
    ) {
      return "storage-activity";
    }

    if (
      action === "START" ||
      action === "STOP"
    ) {
      return "ec2-activity";
    }

    return "success-activity";
  };

  // =========================================
  // ACTIVITY TITLE
  // =========================================

  const getActivityTitle = (log) => {
    const operation = String(
      log.operation || ""
    ).toUpperCase();

    const action = String(
      log.action || ""
    ).toUpperCase();

    if (operation && action) {
      return `${operation} ${action}`;
    }

    return "AWS Activity";
  };

  // =========================================
  // ACTIVITY TIME
  // =========================================

  const getActivityTime = (timestamp) => {
    if (!timestamp) {
      return "Unknown";
    }

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return "Unknown";
    }

    return date.toLocaleTimeString();
  };

  // =========================================
  // ACTIVITY MESSAGE
  // =========================================

  const getActivityMessage = (log) => {
    return (
      log.message ||
      `${log.operation || "AWS"} ${
        log.action || "operation"
      } completed`
    );
  };

  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="dashboard-page">

      {/* =====================================
          WELCOME CARD
      ====================================== */}

      <div className="welcome-card">

        <div className="welcome-content">

          <span className="welcome-label">
            CLOUD RESOURCE MANAGEMENT
          </span>

          <h2>
            Welcome to your AWS Dashboard
          </h2>

          <p>
            Manage and monitor your AWS resources
            from one centralized dashboard.
          </p>

        </div>

        <div className="welcome-region">

          <span>
            Current Region
          </span>

          <strong>
            ap-south-1
          </strong>

          <small>
            Mumbai
          </small>

        </div>

      </div>


      {/* =====================================
          LIVE TOOLBAR
      ====================================== */}

      <div className="dashboard-toolbar">

        <div className="live-status">

          <span className="live-dot"></span>

          <strong>
            LIVE
          </strong>

          <span>
            AWS monitoring active
          </span>

          <span className="auto-refresh-text">
            • Auto-refresh every 30 seconds
          </span>

        </div>


        <div className="refresh-area">

          <div className="last-updated">

            <Clock size={15} />

            <span>
              Last updated:
            </span>

            <strong>
              {getLastUpdatedText()}
            </strong>

          </div>


          <button
            className="refresh-button"
            onClick={() =>
              loadDashboardData(true)
            }
            disabled={refreshing}
          >

            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "refresh-spin"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}

          </button>

        </div>

      </div>


      {/* =====================================
          LOADING
      ====================================== */}

      {loading && (

        <div className="dashboard-message">

          <RefreshCw
            className="refresh-spin"
            size={22}
          />

          <span>
            Loading AWS resources...
          </span>

        </div>

      )}


      {/* =====================================
          ERROR
      ====================================== */}

      {!loading && error && (

        <div className="dashboard-error">

          <strong>
            AWS Connection Error
          </strong>

          <p>
            {error}
          </p>

          <button
            className="retry-button"
            onClick={() =>
              loadDashboardData(true)
            }
          >

            Try Again

          </button>

        </div>

      )}


      {/* =====================================
          MAIN DASHBOARD
      ====================================== */}

      {!loading && !error && (

        <>

          {/* =================================
              OVERVIEW CARDS
          ================================= */}

          <div className="overview-grid">

            {/* TOTAL EC2 */}

            <div className="overview-card">

              <div className="overview-card-top">

                <div className="overview-icon ec2-icon">
                  <Server size={22} />
                </div>

                <span className="card-status active">
                  AWS
                </span>

              </div>

              <span>
                Total EC2 Instances
              </span>

              <strong>
                {data.totalEC2}
              </strong>

              <small>
                All EC2 instances
              </small>

            </div>


            {/* RUNNING EC2 */}

            <div className="overview-card">

              <div className="overview-card-top">

                <div className="overview-icon running-icon">
                  <Activity size={22} />
                </div>

                <span className="card-status running">
                  LIVE
                </span>

              </div>

              <span>
                Running Instances
              </span>

              <strong>
                {data.runningEC2}
              </strong>

              <small>
                Currently running
              </small>

            </div>


            {/* STOPPED EC2 */}

            <div className="overview-card">

              <div className="overview-card-top">

                <div className="overview-icon stopped-icon">
                  <Server size={22} />
                </div>

                <span className="card-status stopped">
                  STOPPED
                </span>

              </div>

              <span>
                Stopped Instances
              </span>

              <strong>
                {data.stoppedEC2}
              </strong>

              <small>
                Currently stopped
              </small>

            </div>


            {/* S3 */}

            <div className="overview-card">

              <div className="overview-card-top">

                <div className="overview-icon s3-icon">
                  <HardDrive size={22} />
                </div>

                <span className="card-status storage">
                  S3
                </span>

              </div>

              <span>
                S3 Buckets
              </span>

              <strong>
                {data.s3Buckets}
              </strong>

              <small>
                Available buckets
              </small>

            </div>


            {/* AWS COST */}

            <div className="overview-card">

              <div className="overview-card-top">

                <div className="overview-icon cost-icon">
                  <DollarSign size={22} />
                </div>

                <span className="card-status cost-status">
                  COST
                </span>

              </div>
                    <span>
                        AWS Cost — Month to Date
                    </span>
              <strong>
                {getFormattedCost()}
              </strong>

              <small>
                {costError
                  ? "Cost data unavailable"
                  : getCostPeriodText()
                }
              </small>

            </div>

          </div>


          {/* =================================
              LOWER DASHBOARD GRID
          ================================= */}

          <div className="dashboard-lower-grid">

            {/* AWS RESOURCE SUMMARY */}

            <div className="dashboard-panel">

              <div className="panel-header">

                <div>

                  <span className="panel-label">
                    AWS RESOURCES
                  </span>

                  <h3>
                    Resource Summary
                  </h3>

                </div>

                <div className="panel-header-icon">
                  <Database size={20} />
                </div>

              </div>


              <div className="resource-list">

                <div className="resource-row">

                  <div className="resource-left">

                    <div className="resource-icon ec2-small">
                      <Server size={18} />
                    </div>

                    <div>

                      <strong>
                        EC2
                      </strong>

                      <span>
                        Compute instances
                      </span>

                    </div>

                  </div>

                  <strong className="resource-value">
                    {data.totalEC2}
                  </strong>

                </div>


                <div className="resource-row">

                  <div className="resource-left">

                    <div className="resource-icon running-small">
                      <Activity size={18} />
                    </div>

                    <div>

                      <strong>
                        Running
                      </strong>

                      <span>
                        Active instances
                      </span>

                    </div>

                  </div>

                  <strong className="resource-value running-value">
                    {data.runningEC2}
                  </strong>

                </div>


                <div className="resource-row">

                  <div className="resource-left">

                    <div className="resource-icon stopped-small">
                      <Server size={18} />
                    </div>

                    <div>

                      <strong>
                        Stopped
                      </strong>

                      <span>
                        Inactive instances
                      </span>

                    </div>

                  </div>

                  <strong className="resource-value stopped-value">
                    {data.stoppedEC2}
                  </strong>

                </div>


                <div className="resource-row">

                  <div className="resource-left">

                    <div className="resource-icon s3-small">
                      <HardDrive size={18} />
                    </div>

                    <div>

                      <strong>
                        S3
                      </strong>

                      <span>
                        Storage buckets
                      </span>

                    </div>

                  </div>

                  <strong className="resource-value">
                    {data.s3Buckets}
                  </strong>

                </div>

              </div>

            </div>


            {/* MONITORING STATUS */}

            <div className="dashboard-panel monitoring-panel">

              <div className="panel-header">

                <div>

                  <span className="panel-label">
                    CLOUDWATCH
                  </span>

                  <h3>
                    Monitoring Status
                  </h3>

                </div>

                <div className="panel-header-icon">
                  <BarChart3 size={20} />
                </div>

              </div>


              <div className="monitoring-status-card">

                <div className="monitoring-status-icon">
                  <CheckCircle size={25} />
                </div>

                <div>

                  <strong>
                    Monitoring Active
                  </strong>

                  <span>
                    CloudWatch metrics are available
                    for your EC2 resources.
                  </span>

                </div>

              </div>


              <div className="monitoring-details">

                <div className="monitoring-detail">

                  <Monitor size={17} />

                  <span>
                    EC2 Monitoring
                  </span>

                  <strong>
                    Active
                  </strong>

                </div>


                <div className="monitoring-detail">

                  <Zap size={17} />

                  <span>
                    Auto Refresh
                  </span>

                  <strong>
                    30 sec
                  </strong>

                </div>


                <div className="monitoring-detail">

                  <Activity size={17} />

                  <span>
                    Region
                  </span>

                  <strong>
                    ap-south-1
                  </strong>

                </div>

              </div>

            </div>

          </div>


          {/* =================================
              CLOUDWATCH / SNS ALERTS
          ================================= */}

          <div className="alerts-panel">

            <div className="panel-header">

              <div>

                <span className="panel-label">
                  CLOUDWATCH + SNS
                </span>

                <h3>
                  Alerts & Notifications
                </h3>

                <p className="alerts-subtitle">
                  Monitor CloudWatch alarms and SNS
                  notification delivery in real time.
                </p>

              </div>

              <div className="panel-header-icon alert-header-icon">
                <Bell size={20} />
              </div>

            </div>


            {/* ALERT SUMMARY */}

            <div className="alert-summary-grid">

              <div className="alert-summary-card">

                <div className="alert-summary-icon total-alerts">
                  <Bell size={19} />
                </div>

                <div>

                  <span>
                    Total Alarms
                  </span>

                  <strong>
                    {alertsLoading
                      ? "..."
                      : alertSummary.total}
                  </strong>

                </div>

              </div>


              <div className="alert-summary-card">

                <div className="alert-summary-icon alarm-alerts">
                  <AlertTriangle size={19} />
                </div>

                <div>

                  <span>
                    In Alarm
                  </span>

                  <strong>
                    {alertsLoading
                      ? "..."
                      : alertSummary.alarm}
                  </strong>

                </div>

              </div>


              <div className="alert-summary-card">

                <div className="alert-summary-icon ok-alerts">
                  <CheckCircle size={19} />
                </div>

                <div>

                  <span>
                    OK
                  </span>

                  <strong>
                    {alertsLoading
                      ? "..."
                      : alertSummary.ok}
                  </strong>

                </div>

              </div>


              <div className="alert-summary-card">

                <div className="alert-summary-icon sns-alerts">
                  <Mail size={19} />
                </div>

                <div>

                  <span>
                    SNS Enabled
                  </span>

                  <strong>
                    {alertsLoading
                      ? "..."
                      : alertSummary.sns_enabled}
                  </strong>

                </div>

              </div>

            </div>


            {/* ALERT ERROR */}

            {alertsError && (

              <div className="alerts-error">

                <AlertTriangle size={18} />

                <span>
                  {alertsError}
                </span>

              </div>

            )}


            {/* ALERT LOADING */}

            {alertsLoading && (

              <div className="alerts-empty">

                <RefreshCw
                  size={21}
                  className="refresh-spin"
                />

                <span>
                  Loading CloudWatch alarms...
                </span>

              </div>

            )}


            {/* NO ALERTS */}

            {!alertsLoading &&
              !alertsError &&
              alerts.length === 0 && (

                <div className="alerts-empty">

                  <Bell size={22} />

                  <span>
                    No CloudWatch alarms configured.
                  </span>

                </div>

              )}


            {/* ALERT LIST */}

            {!alertsLoading &&
              alerts.length > 0 && (

                <div className="alerts-list">

                  {alerts.map(
                    (alert, index) => (

                      <div
                        className="alert-card"
                        key={`${alert.name}-${index}`}
                      >

                        {/* ALERT ICON */}

                        <div
                          className={`alert-main-icon ${
                            alert.state === "ALARM"
                              ? "alarm-icon"
                              : alert.state === "OK"
                                ? "ok-icon"
                                : "insufficient-icon"
                          }`}
                        >

                          {getAlertIcon(
                            alert.state
                          )}

                        </div>


                        <div className="alert-main-content">

                          {/* =================================
                              ALERT TITLE
                          ================================= */}

                          <div className="alert-title-row">

                            <div>

                              <span className="alert-label">
                                CLOUDWATCH ALARM
                              </span>

                              <h4>
                                {alert.name}
                              </h4>

                              <p className="alert-description">
                                {alert.namespace ===
                                "AWS/EC2"
                                  ? "EC2 CPU utilization monitoring"
                                  : "AWS resource monitoring alarm"}
                              </p>

                            </div>


                            <span
                              className={getAlertStateClass(
                                alert.state
                              )}
                            >

                              {getAlertStateText(
                                alert.state
                              )}

                            </span>

                          </div>


                          {/* =================================
                              LAST UPDATED - REAL CLOCK
                          ================================= */}

                          <div className="alert-last-updated-row">

                            <div className="alert-last-updated-left">

                              <Clock size={15} />

                              <span>
                                Last Updated
                              </span>

                            </div>

                            <strong>
                              {getAlertUpdatedTime(
                                alert.state_updated
                              )}
                            </strong>

                          </div>


                          {/* =================================
                              ALERT STATE DESCRIPTION
                          ================================= */}

                          <div
                            className={`alert-state-banner ${
                              alert.state === "ALARM"
                                ? "state-banner-alarm"
                                : alert.state === "OK"
                                  ? "state-banner-ok"
                                  : "state-banner-insufficient"
                            }`}
                          >

                            {alert.state === "ALARM" ? (
                              <AlertTriangle size={17} />
                            ) : alert.state === "OK" ? (
                              <CheckCircle size={17} />
                            ) : (
                              <Bell size={17} />
                            )}

                            <span>
                              {getAlertStateDescription(
                                alert.state
                              )}
                            </span>

                          </div>


                          {/* =================================
                              ALERT DETAILS
                          ================================= */}

                          <div className="alert-details-grid">

                            <div className="alert-detail">

                              <span>
                                Metric:
                              </span>

                              <strong>
                                {alert.metric_name}
                              </strong>

                            </div>


                            <div className="alert-detail">

                              <span>
                                Threshold:
                              </span>

                              <strong>
                                {getComparisonText(
                                  alert.comparison_operator
                                )}{" "}
                                {alert.threshold}%
                              </strong>

                            </div>


                            <div className="alert-detail">

                              <span>
                                Evaluation:
                              </span>

                              <strong>
                                {alert.evaluation_periods} ×{" "}
                                {Math.round(
                                  Number(
                                    alert.period || 0
                                  ) / 60
                                )}{" "}
                                min
                              </strong>

                            </div>


                            <div className="alert-detail">

                              <span>
                                Notification:
                              </span>

                              <strong
                                className={
                                  alert.sns_enabled
                                    ? "sns-active"
                                    : "sns-inactive"
                                }
                              >

                                {alert.sns_enabled
                                  ? "SNS Enabled"
                                  : "SNS Disabled"}

                              </strong>

                            </div>

                          </div>


                          {/* =================================
                              SNS CONNECTION
                          ================================= */}

                          {alert.sns_enabled && (

                            <div className="sns-notification">

                              <div className="sns-notification-icon">

                                <Mail size={18} />

                              </div>


                              <div className="sns-notification-content">

                                <strong>
                                  Notifications Connected
                                </strong>

                                <span>
                                  CloudWatch alarm actions
                                  are connected to Amazon SNS.
                                </span>

                                <small>
                                  SNS Topic:{" "}
                                  <b>
                                    cloudops-alerts
                                  </b>
                                </small>

                              </div>


                              <div className="sns-connection-badge">

                                <span className="sns-live-dot"></span>

                                Connected

                              </div>

                            </div>

                          )}


                          {/* =================================
                              SNS DISCONNECTED
                          ================================= */}

                          {!alert.sns_enabled && (

                            <div className="sns-notification sns-disabled">

                              <div className="sns-notification-icon">

                                <Mail size={18} />

                              </div>


                              <div className="sns-notification-content">

                                <strong>
                                  Notifications Disabled
                                </strong>

                                <span>
                                  No SNS notification action
                                  is currently configured.
                                </span>

                              </div>

                            </div>

                          )}


                          {/* =================================
                              STATE REASON
                          ================================= */}

                          {alert.state_reason && (

                            <div className="alert-reason">

                              <div className="alert-reason-header">

                                <AlertTriangle size={17} />

                                <strong>
                                  State Reason
                                </strong>

                              </div>


                              <p>
                                {alert.state ===
                                "INSUFFICIENT_DATA"
                                  ? "CloudWatch is currently waiting for a usable datapoint. The alarm cannot be evaluated until sufficient metric data is available."
                                  : alert.state_reason}
                              </p>

                            </div>

                          )}

                        </div>

                      </div>

                    )
                  )}

                </div>

              )}

          </div>


          {/* =================================
              QUICK ACTIONS
          ================================= */}

          <div className="quick-actions-section">

            <div className="section-heading">

              <div>

                <span>
                  MANAGEMENT
                </span>

                <h3>
                  Quick Actions
                </h3>

              </div>

              <p>
                Access your AWS management tools
              </p>

            </div>


            <div className="quick-actions-grid">

              {/* EC2 */}

              <button
                className="quick-action-card"
                onClick={goToEC2}
              >

                <div className="quick-action-icon ec2-action">
                  <Server size={22} />
                </div>

                <div className="quick-action-content">

                  <strong>
                    EC2 Management
                  </strong>

                  <span>
                    View and manage EC2 instances
                  </span>

                </div>

                <ArrowRight
                  size={19}
                  className="quick-action-arrow"
                />

              </button>


              {/* S3 */}

              <button
                className="quick-action-card"
                onClick={goToS3}
              >

                <div className="quick-action-icon s3-action">
                  <HardDrive size={22} />
                </div>

                <div className="quick-action-content">

                  <strong>
                    S3 Management
                  </strong>

                  <span>
                    Manage buckets and objects
                  </span>

                </div>

                <ArrowRight
                  size={19}
                  className="quick-action-arrow"
                />

              </button>


              {/* MONITORING */}

              <button
                className="quick-action-card"
                onClick={goToMonitoring}
              >

                <div className="quick-action-icon monitoring-action">
                  <BarChart3 size={22} />
                </div>

                <div className="quick-action-content">

                  <strong>
                    CloudWatch Monitoring
                  </strong>

                  <span>
                    View EC2 CPU utilization
                  </span>

                </div>

                <ArrowRight
                  size={19}
                  className="quick-action-arrow"
                />

              </button>

            </div>

          </div>


          {/* =================================
              REAL RECENT ACTIVITY
          ================================= */}

          <div className="activity-panel">

            <div className="panel-header">

              <div>

                <span className="panel-label">
                  SYSTEM
                </span>

                <h3>
                  Recent Activity
                </h3>

              </div>

              <div className="panel-header-icon">
                <Clock size={20} />
              </div>

            </div>


            <div className="activity-list">

              {activityLoading && (

                <div className="activity-empty">

                  <RefreshCw
                    size={20}
                    className="refresh-spin"
                  />

                  <span>
                    Loading recent activity...
                  </span>

                </div>

              )}


              {!activityLoading &&
                activityLogs.length === 0 && (

                  <div className="activity-empty">

                    <FileText size={22} />

                    <span>
                      No AWS activity recorded yet.
                    </span>

                  </div>

                )}


              {!activityLoading &&
                activityLogs.map(
                  (log, index) => (

                    <div
                      className="activity-item"
                      key={`${log.timestamp}-${index}`}
                    >

                      <div
                        className={`activity-icon ${
                          getActivityClass(log)
                        }`}
                      >

                        {getActivityIcon(log)}

                      </div>


                      <div className="activity-content">

                        <strong>
                          {getActivityTitle(log)}
                        </strong>

                        <span>
                          {getActivityMessage(log)}
                        </span>

                      </div>


                      <span className="activity-time">

                        {getActivityTime(
                          log.timestamp
                        )}

                      </span>

                    </div>

                  )
                )}

            </div>

          </div>

        </>

      )}

    </div>
  );
}

export default Dashboard;