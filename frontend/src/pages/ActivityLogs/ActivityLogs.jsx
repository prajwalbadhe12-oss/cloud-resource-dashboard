import { useEffect, useMemo, useState } from "react";

import {
  Activity,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Server,
  Database,
  Upload,
  Trash2,
  Power,
  Search,
  Filter,
  X
} from "lucide-react";

import "./ActivityLogs.css";

const API_BASE_URL = "http://127.0.0.1:5000/api";

function ActivityLogs() {
  const [logs, setLogs] = useState([]);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  // ==========================================
  // FILTER STATES
  // ==========================================

  const [search, setSearch] = useState("");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // ==========================================
  // LOAD ACTIVITY LOGS
  // ==========================================

  const loadLogs = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch(
        `${API_BASE_URL}/activity-logs`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch activity logs."
        );
      }

      const data = await response.json();

      if (data.status === "success") {
        setLogs(data.logs || []);
        setLastUpdated(new Date());
      } else {
        setError(
          data.message ||
            "Failed to load activity logs."
        );
      }
    } catch (err) {
      console.error(
        "Activity Logs Error:",
        err
      );

      setError(
        "Unable to connect to Flask backend."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    loadLogs();
  }, []);

  // ==========================================
  // AUTO REFRESH
  // ==========================================

  useEffect(() => {
    const interval = setInterval(() => {
      loadLogs(true);
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // ==========================================
  // FILTERED LOGS
  // ==========================================

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const operation = String(
        log.operation || ""
      ).toLowerCase();

      const resource = String(
        log.resource || ""
      ).toLowerCase();

      const action = String(
        log.action || ""
      ).toLowerCase();

      const status = String(
        log.status || ""
      ).toLowerCase();

      const message = String(
        log.message || ""
      ).toLowerCase();

      const searchText =
        search.trim().toLowerCase();

      // -------------------------------
      // SEARCH
      // -------------------------------

      const matchesSearch =
        !searchText ||
        operation.includes(searchText) ||
        resource.includes(searchText) ||
        action.includes(searchText) ||
        message.includes(searchText);

      // -------------------------------
      // RESOURCE FILTER
      // -------------------------------

      const matchesResource =
        resourceFilter === "all" ||
        operation === resourceFilter;

      // -------------------------------
      // ACTION FILTER
      // -------------------------------

      const matchesAction =
        actionFilter === "all" ||
        action === actionFilter;

      // -------------------------------
      // STATUS FILTER
      // -------------------------------

      const matchesStatus =
        statusFilter === "all" ||
        status === statusFilter;

      return (
        matchesSearch &&
        matchesResource &&
        matchesAction &&
        matchesStatus
      );
    });
  }, [
    logs,
    search,
    resourceFilter,
    actionFilter,
    statusFilter
  ]);

  // ==========================================
  // DASHBOARD STATISTICS
  // ==========================================

  const statistics = useMemo(() => {
    const total = logs.length;

    const successful = logs.filter(
      (log) =>
        String(log.status).toLowerCase() ===
        "success"
    ).length;

    const failed = logs.filter(
      (log) =>
        String(log.status).toLowerCase() !==
        "success"
    ).length;

    const successPercentage =
      total > 0
        ? Math.round(
            (successful / total) * 100
          )
        : 0;

    const failedPercentage =
      total > 0
        ? Math.round(
            (failed / total) * 100
          )
        : 0;

    return {
      total,
      successful,
      failed,
      successPercentage,
      failedPercentage
    };
  }, [logs]);

  // ==========================================
  // OPERATION TYPE COUNTS
  // ==========================================

  const operationStats = useMemo(() => {
    const ec2 = logs.filter((log) =>
      String(log.operation || "")
        .toLowerCase()
        .includes("ec2")
    ).length;

    const s3 = logs.filter((log) =>
      String(log.operation || "")
        .toLowerCase()
        .includes("s3")
    ).length;

    const startStop = logs.filter((log) => {
      const action = String(
        log.action || ""
      ).toLowerCase();

      return (
        action.includes("start") ||
        action.includes("stop")
      );
    }).length;

    const uploadDelete = logs.filter((log) => {
      const action = String(
        log.action || ""
      ).toLowerCase();

      return (
        action.includes("upload") ||
        action.includes("delete")
      );
    }).length;

    return {
      ec2,
      s3,
      startStop,
      uploadDelete
    };
  }, [logs]);

  // ==========================================
  // CLEAR FILTERS
  // ==========================================

  const clearFilters = () => {
    setSearch("");
    setResourceFilter("all");
    setActionFilter("all");
    setStatusFilter("all");
  };

  const filtersActive =
    search.trim() !== "" ||
    resourceFilter !== "all" ||
    actionFilter !== "all" ||
    statusFilter !== "all";

  // ==========================================
  // LAST UPDATED
  // ==========================================

  const formattedLastUpdated = lastUpdated
    ? lastUpdated.toLocaleTimeString()
    : "Not updated yet";

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="activity-page">

      {/* ======================================
          HEADER
      ======================================= */}

      <div className="activity-header">

        <div className="activity-header-content">

          <div className="activity-header-icon">
            <Activity size={27} />
          </div>

          <div>

            <span className="activity-label">
              AWS OPERATIONS
            </span>

            <h2>
              Activity Dashboard
            </h2>

            <p>
              Monitor AWS resource operations and
              system activity in real time.
            </p>

          </div>

        </div>

        <div className="activity-header-actions">

          <div className="activity-live-status">

            <span className="activity-live-dot"></span>

            <div>
              <strong>LIVE</strong>

              <span>
                Auto-refresh every 30 seconds
              </span>
            </div>

          </div>

          <div className="activity-last-updated">

            <Clock size={15} />

            <span>
              Last updated:
            </span>

            <strong>
              {formattedLastUpdated}
            </strong>

          </div>

          <button
            className="activity-refresh-btn"
            onClick={() =>
              loadLogs(true)
            }
            disabled={
              loading || refreshing
            }
          >

            <RefreshCw
              size={16}
              className={
                loading || refreshing
                  ? "activity-spin"
                  : ""
              }
            />

            {refreshing
              ? "Updating..."
              : "Refresh"}

          </button>

        </div>

      </div>

      {/* ======================================
          SUMMARY CARDS
      ======================================= */}

      {!loading && !error && (

        <div className="activity-summary">

          <div className="activity-summary-card total">

            <div className="activity-summary-icon">
              <Activity size={21} />
            </div>

            <div>
              <span>
                TOTAL ACTIVITIES
              </span>

              <strong>
                {statistics.total}
              </strong>

              <small>
                Recorded operations
              </small>
            </div>

          </div>

          <div className="activity-summary-card success">

            <div className="activity-summary-icon">
              <CheckCircle size={21} />
            </div>

            <div>
              <span>
                SUCCESSFUL
              </span>

              <strong>
                {statistics.successful}
              </strong>

              <small>
                {statistics.successPercentage}%
                success rate
              </small>
            </div>

          </div>

          <div className="activity-summary-card failed">

            <div className="activity-summary-icon">
              <XCircle size={21} />
            </div>

            <div>
              <span>
                FAILED
              </span>

              <strong>
                {statistics.failed}
              </strong>

              <small>
                {statistics.failedPercentage}%
                of activities
              </small>
            </div>

          </div>

          <div className="activity-summary-card monitoring">

            <div className="activity-summary-icon">
              <BarChart3 size={21} />
            </div>

            <div>
              <span>
                MONITORING
              </span>

              <strong>
                LIVE
              </strong>

              <small>
                Activity monitoring active
              </small>
            </div>

          </div>

        </div>

      )}

      {/* ======================================
          ERROR
      ======================================= */}

      {error && (

        <div className="activity-error">

          <XCircle size={20} />

          <div>
            <strong>
              Activity Service Error
            </strong>

            <span>
              {error}
            </span>
          </div>

          <button
            onClick={() =>
              loadLogs(true)
            }
          >
            Try Again
          </button>

        </div>

      )}

      {/* ======================================
          ACTIVITY OVERVIEW
      ======================================= */}

      {!loading &&
        !error && (

          <div className="activity-overview">

            <div className="activity-overview-header">

              <div>

                <span className="activity-section-label">
                  RESOURCE ACTIVITY
                </span>

                <h3>
                  Operation Overview
                </h3>

              </div>

              <div className="activity-connected">

                <CheckCircle size={15} />

                AWS Connected

              </div>

            </div>

            <div className="activity-overview-grid">

              <div className="activity-overview-item">

                <div className="activity-overview-icon ec2">
                  <Server size={19} />
                </div>

                <div className="activity-overview-info">

                  <span>
                    EC2 Operations
                  </span>

                  <strong>
                    {operationStats.ec2}
                  </strong>

                </div>

              </div>

              <div className="activity-overview-item">

                <div className="activity-overview-icon s3">
                  <Database size={19} />
                </div>

                <div className="activity-overview-info">

                  <span>
                    S3 Operations
                  </span>

                  <strong>
                    {operationStats.s3}
                  </strong>

                </div>

              </div>

              <div className="activity-overview-item">

                <div className="activity-overview-icon power">
                  <Power size={19} />
                </div>

                <div className="activity-overview-info">

                  <span>
                    Start / Stop
                  </span>

                  <strong>
                    {operationStats.startStop}
                  </strong>

                </div>

              </div>

              <div className="activity-overview-item">

                <div className="activity-overview-icon upload">
                  <Upload size={19} />
                </div>

                <div className="activity-overview-info">

                  <span>
                    Upload / Delete
                  </span>

                  <strong>
                    {operationStats.uploadDelete}
                  </strong>

                </div>

              </div>

            </div>

            {/* SUCCESS BAR */}

            <div className="activity-health">

              <div className="activity-health-header">

                <span>
                  Operation Success Rate
                </span>

                <strong>
                  {statistics.successPercentage}%
                </strong>

              </div>

              <div className="activity-health-bar">

                <div
                  className="activity-health-fill"
                  style={{
                    width: `${statistics.successPercentage}%`
                  }}
                ></div>

              </div>

            </div>

          </div>

        )}

      {/* ======================================
          LOADING
      ======================================= */}

      {loading && (

        <div className="activity-loading">

          <RefreshCw
            size={23}
            className="activity-spin"
          />

          <span>
            Loading activity logs...
          </span>

        </div>

      )}

      {/* ======================================
          RECENT OPERATIONS
      ======================================= */}

      {!loading &&
        !error && (

          <div className="activity-table-card">

            <div className="activity-table-header">

              <div>

                <span className="activity-section-label">
                  AWS RESOURCE HISTORY
                </span>

                <h3>
                  Recent Operations
                </h3>

                <p>
                  AWS resource operation history
                </p>

              </div>

              <div className="activity-live">

                <span></span>

                LIVE

              </div>

            </div>

            {/* ==================================
                FILTER BAR
            ================================== */}

            <div className="activity-filter-bar">

              <div className="activity-search-box">

                <Search size={17} />

                <input
                  type="text"
                  placeholder="Search instance, bucket, action..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                />

                {search && (

                  <button
                    className="activity-clear-search"
                    onClick={() =>
                      setSearch("")
                    }
                    title="Clear search"
                  >
                    <X size={15} />
                  </button>

                )}

              </div>

              <div className="activity-filter-group">

                <Filter size={16} />

                <select
                  value={resourceFilter}
                  onChange={(e) =>
                    setResourceFilter(
                      e.target.value
                    )
                  }
                >

                  <option value="all">
                    All Resources
                  </option>

                  <option value="ec2">
                    EC2
                  </option>

                  <option value="s3">
                    S3
                  </option>

                </select>

              </div>

              <div className="activity-filter-group">

                <select
                  value={actionFilter}
                  onChange={(e) =>
                    setActionFilter(
                      e.target.value
                    )
                  }
                >

                  <option value="all">
                    All Actions
                  </option>

                  <option value="start">
                    START
                  </option>

                  <option value="stop">
                    STOP
                  </option>

                  <option value="upload">
                    UPLOAD
                  </option>

                  <option value="delete_object">
                    DELETE_OBJECT
                  </option>

                  <option value="create_bucket">
                    CREATE_BUCKET
                  </option>

                  <option value="delete_bucket">
                    DELETE_BUCKET
                  </option>

                </select>

              </div>

              <div className="activity-filter-group">

                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value
                    )
                  }
                >

                  <option value="all">
                    All Status
                  </option>

                  <option value="success">
                    SUCCESS
                  </option>

                  <option value="failure">
                    FAILED
                  </option>

                </select>

              </div>

              {filtersActive && (

                <button
                  className="activity-clear-filters"
                  onClick={clearFilters}
                >

                  <X size={15} />

                  Clear Filters

                </button>

              )}

            </div>

            {/* FILTER RESULT COUNT */}

            {filtersActive && (

              <div className="activity-filter-result">

                <span>
                  Showing{" "}
                  <strong>
                    {filteredLogs.length}
                  </strong>{" "}
                  of{" "}
                  <strong>
                    {logs.length}
                  </strong>{" "}
                  activities
                </span>

              </div>

            )}

            {logs.length === 0 ? (

              <div className="activity-empty">

                <Clock size={38} />

                <h3>
                  No activity logs
                </h3>

                <p>
                  AWS operations will appear here
                  when you perform resource actions.
                </p>

              </div>

            ) : filteredLogs.length === 0 ? (

              <div className="activity-empty">

                <Search size={38} />

                <h3>
                  No matching activities
                </h3>

                <p>
                  Try changing your search or
                  filter selections.
                </p>

                <button
                  className="activity-clear-filters"
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>

              </div>

            ) : (

              <div className="activity-table-wrapper">

                <table className="activity-table">

                  <thead>

                    <tr>

                      <th>
                        Operation
                      </th>

                      <th>
                        Resource
                      </th>

                      <th>
                        Action
                      </th>

                      <th>
                        Timestamp
                      </th>

                      <th>
                        Status
                      </th>

                      <th>
                        Message
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {filteredLogs
                      .slice()
                      .reverse()
                      .map(
                        (log, index) => {

                          const isSuccess =
                            String(
                              log.status
                            ).toLowerCase() ===
                            "success";

                          return (

                            <tr key={index}>

                              <td>

                                <strong className="operation-name">
                                  {log.operation ||
                                    "—"}
                                </strong>

                              </td>

                              <td>

                                <span className="resource-name">

                                  {log.resource ||
                                    "—"}

                                </span>

                              </td>

                              <td>

                                <span className="action-badge">

                                  {log.action ||
                                    "—"}

                                </span>

                              </td>

                              <td>

                                <span className="timestamp">

                                  {log.timestamp
                                    ? new Date(
                                        log.timestamp
                                      ).toLocaleString()
                                    : "—"}

                                </span>

                              </td>

                              <td>

                                {isSuccess ? (

                                  <span className="log-status success">

                                    <CheckCircle
                                      size={14}
                                    />

                                    SUCCESS

                                  </span>

                                ) : (

                                  <span className="log-status failed">

                                    <XCircle
                                      size={14}
                                    />

                                    FAILED

                                  </span>

                                )}

                              </td>

                              <td>

                                <span className="log-message">

                                  {log.message ||
                                    "—"}

                                </span>

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

        )}

    </div>
  );
}

export default ActivityLogs;