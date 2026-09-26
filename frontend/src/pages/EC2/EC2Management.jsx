
import { useEffect, useMemo, useState } from "react";

import {
  Server,
  RefreshCw,
  Search,
  Play,
  Square,
  MapPin,
  Cpu,
  Clock,
  Activity,
  CheckCircle,
  AlertCircle,
  Power,
  BarChart3,
  Eye,
  X,
  Network,
  HardDrive,
  Shield,
  KeyRound,
  Monitor,
} from "lucide-react";

import axios from "axios";

import "./EC2Management.css";

const API_BASE_URL = "http://127.0.0.1:5000/api";

function EC2Management() {
  // ==========================================
  // EC2 DATA
  // ==========================================

  const [instances, setInstances] = useState([]);

  // ==========================================
  // SEARCH & FILTER
  // ==========================================

  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");

  // ==========================================
  // LOADING STATES
  // ==========================================

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState("");

  // ==========================================
  // ERROR / SUCCESS MESSAGE
  // ==========================================

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // ==========================================
  // LAST UPDATED
  // ==========================================

  const [lastUpdated, setLastUpdated] = useState(null);

  // ==========================================
  // EC2 DETAILS MODAL
  // ==========================================

  const [selectedInstance, setSelectedInstance] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  // ==========================================
  // LOAD EC2 INSTANCES
  // ==========================================

  const loadInstances = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await axios.get(
        `${API_BASE_URL}/ec2/instances`,
        {
          params: {
            search: search,
            state: stateFilter,
          },
        }
      );

      if (response.data.status === "success") {
        setInstances(response.data.instances || []);
        setLastUpdated(new Date());
      } else {
        setError(
          response.data.message ||
            "Failed to load EC2 instances."
        );
      }
    } catch (err) {
      console.error("EC2 API Error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load EC2 instances. Make sure the Flask backend is running."
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
    loadInstances();
  }, [search, stateFilter]);

  // ==========================================
  // AUTO REFRESH
  // EVERY 30 SECONDS
  // ==========================================

  useEffect(() => {
    const interval = setInterval(() => {
      loadInstances(true);
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [search, stateFilter]);

  // ==========================================
  // LOAD EC2 INSTANCE DETAILS
  // ==========================================

  const loadInstanceDetails = async (instanceId) => {
    try {
      setDetailsLoading(true);
      setDetailsError("");

      const response = await axios.get(
        `${API_BASE_URL}/ec2/${instanceId}/details`
      );

      if (response.data.status === "success") {
        setSelectedInstance(response.data.instance);
      } else {
        setDetailsError(
          response.data.message ||
            "Unable to load instance details."
        );
      }
    } catch (err) {
      console.error(
        "EC2 Details Error:",
        err
      );

      setDetailsError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load EC2 instance details."
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  // ==========================================
  // OPEN DETAILS MODAL
  // ==========================================

  const openDetails = (instanceId) => {
    setSelectedInstance(null);
    setDetailsError("");
    setDetailsLoading(true);

    loadInstanceDetails(instanceId);
  };

  // ==========================================
  // CLOSE DETAILS MODAL
  // ==========================================

  const closeDetails = () => {
    setSelectedInstance(null);
    setDetailsError("");
    setDetailsLoading(false);
  };

  // ==========================================
  // DASHBOARD COUNTS
  // ==========================================

  const dashboardStats = useMemo(() => {
    const total = instances.length;

    const running = instances.filter(
      (instance) =>
        String(instance.state).toLowerCase() ===
        "running"
    ).length;

    const stopped = instances.filter(
      (instance) =>
        String(instance.state).toLowerCase() ===
        "stopped"
    ).length;

    const other = total - running - stopped;

    return {
      total,
      running,
      stopped,
      other,
    };
  }, [instances]);

  // ==========================================
  // START EC2 INSTANCE
  // ==========================================

  const startInstance = async (instanceId) => {
    const confirmed = window.confirm(
      `Are you sure you want to START instance ${instanceId}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(instanceId);
      setError("");
      setSuccessMessage("");

      const response = await axios.post(
        `${API_BASE_URL}/ec2/${instanceId}/start`
      );

      if (
        response.data?.status &&
        response.data.status !== "success"
      ) {
        throw new Error(
          response.data.message ||
            `Unable to start instance ${instanceId}.`
        );
      }

      setSuccessMessage(
        `Start request sent successfully for ${instanceId}. The instance may take a few moments to become RUNNING.`
      );

      await loadInstances(true);

      // Refresh modal if the same instance is open
      if (
        selectedInstance?.instance_id ===
        instanceId
      ) {
        await loadInstanceDetails(instanceId);
      }
    } catch (err) {
      console.error(
        "EC2 Start Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          `Unable to start instance ${instanceId}.`
      );
    } finally {
      setActionLoading("");
    }
  };

  // ==========================================
  // STOP EC2 INSTANCE
  // ==========================================

  const stopInstance = async (instanceId) => {
    const confirmed = window.confirm(
      `Are you sure you want to STOP instance ${instanceId}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(instanceId);
      setError("");
      setSuccessMessage("");

      const response = await axios.post(
        `${API_BASE_URL}/ec2/${instanceId}/stop`
      );

      if (
        response.data?.status &&
        response.data.status !== "success"
      ) {
        throw new Error(
          response.data.message ||
            `Unable to stop instance ${instanceId}.`
        );
      }

      setSuccessMessage(
        `Stop request sent successfully for ${instanceId}. The instance may take a few moments to become STOPPED.`
      );

      await loadInstances(true);

      // Refresh modal if the same instance is open
      if (
        selectedInstance?.instance_id ===
        instanceId
      ) {
        await loadInstanceDetails(instanceId);
      }
    } catch (err) {
      console.error(
        "EC2 Stop Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          `Unable to stop instance ${instanceId}.`
      );
    } finally {
      setActionLoading("");
    }
  };

  // ==========================================
  // FORMAT LAST UPDATED
  // ==========================================

  const formattedLastUpdated = lastUpdated
    ? lastUpdated.toLocaleTimeString()
    : "Not updated yet";

  // ==========================================
  // FORMAT LAUNCH TIME
  // ==========================================

  const formatLaunchTime = (launchTime) => {
    if (!launchTime) {
      return "N/A";
    }

    try {
      return new Date(launchTime).toLocaleString();
    } catch {
      return launchTime;
    }
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="ec2-page">

      {/* ======================================
          HEADER
      ======================================= */}

      <div className="ec2-management-header">

        <div className="ec2-header-content">

          <div className="ec2-header-icon">
            <Server size={28} />
          </div>

          <div>
            <span className="ec2-header-label">
              AWS COMPUTE
            </span>

            <h2>EC2 Dashboard</h2>

            <p>
              Monitor, search and control your
              Amazon EC2 instances.
            </p>
          </div>

        </div>

        <div className="ec2-header-actions">

          <div className="ec2-live-status">

            <span className="ec2-live-dot"></span>

            <div>
              <strong>LIVE</strong>

              <span>
                Auto-refresh every 30 seconds
              </span>
            </div>

          </div>

          <div className="ec2-last-updated">

            <Clock size={15} />

            <span>
              Last updated:
            </span>

            <strong>
              {formattedLastUpdated}
            </strong>

          </div>

          <button
            className="ec2-refresh-button"
            onClick={() =>
              loadInstances(true)
            }
            disabled={
              refreshing ||
              actionLoading !== ""
            }
          >
            <RefreshCw
              size={17}
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

      {/* ======================================
          SUCCESS MESSAGE
      ======================================= */}

      {successMessage && (
        <div className="ec2-success">

          <div className="ec2-success-icon">
            <CheckCircle size={20} />
          </div>

          <div className="ec2-success-content">

            <strong>
              EC2 Action Successful
            </strong>

            <p>
              {successMessage}
            </p>

          </div>

        </div>
      )}

      {/* ======================================
          DASHBOARD SUMMARY
      ======================================= */}

      {!loading && !error && (
        <div className="ec2-summary-grid">

          <div className="ec2-summary-card total">

            <div className="ec2-summary-top">

              <div className="ec2-summary-icon">
                <Server size={21} />
              </div>

              <span className="ec2-summary-label">
                TOTAL INSTANCES
              </span>

            </div>

            <div className="ec2-summary-value">
              {dashboardStats.total}
            </div>

            <div className="ec2-summary-description">
              EC2 resources detected
            </div>

          </div>

          <div className="ec2-summary-card running">

            <div className="ec2-summary-top">

              <div className="ec2-summary-icon">
                <Activity size={21} />
              </div>

              <span className="ec2-summary-label">
                RUNNING
              </span>

            </div>

            <div className="ec2-summary-value">
              {dashboardStats.running}
            </div>

            <div className="ec2-summary-description">
              Instances currently running
            </div>

          </div>

          <div className="ec2-summary-card stopped">

            <div className="ec2-summary-top">

              <div className="ec2-summary-icon">
                <Power size={21} />
              </div>

              <span className="ec2-summary-label">
                STOPPED
              </span>

            </div>

            <div className="ec2-summary-value">
              {dashboardStats.stopped}
            </div>

            <div className="ec2-summary-description">
              Instances currently stopped
            </div>

          </div>

          <div className="ec2-summary-card other">

            <div className="ec2-summary-top">

              <div className="ec2-summary-icon">
                <BarChart3 size={21} />
              </div>

              <span className="ec2-summary-label">
                OTHER STATES
              </span>

            </div>

            <div className="ec2-summary-value">
              {dashboardStats.other}
            </div>

            <div className="ec2-summary-description">
              Pending or transitional states
            </div>

          </div>

        </div>
      )}

      {/* ======================================
          STATUS OVERVIEW
      ======================================= */}

      {!loading && !error && (
        <div className="ec2-overview-panel">

          <div className="ec2-overview-heading">

            <div>

              <span className="ec2-section-label">
                EC2 RESOURCE OVERVIEW
              </span>

              <h3>
                Instance Status
              </h3>

            </div>

            <div className="ec2-overview-live">

              <CheckCircle size={15} />

              AWS Connected

            </div>

          </div>

          <div className="ec2-status-bars">

            <div className="ec2-status-row">

              <div className="ec2-status-info">

                <span className="ec2-status-name">
                  Running
                </span>

                <strong>
                  {dashboardStats.running}
                </strong>

              </div>

              <div className="ec2-progress">

                <div
                  className="ec2-progress-running"
                  style={{
                    width:
                      dashboardStats.total > 0
                        ? `${
                            (dashboardStats.running /
                              dashboardStats.total) *
                            100
                          }%`
                        : "0%",
                  }}
                ></div>

              </div>

            </div>

            <div className="ec2-status-row">

              <div className="ec2-status-info">

                <span className="ec2-status-name">
                  Stopped
                </span>

                <strong>
                  {dashboardStats.stopped}
                </strong>

              </div>

              <div className="ec2-progress">

                <div
                  className="ec2-progress-stopped"
                  style={{
                    width:
                      dashboardStats.total > 0
                        ? `${
                            (dashboardStats.stopped /
                              dashboardStats.total) *
                            100
                          }%`
                        : "0%",
                  }}
                ></div>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* ======================================
          FILTER PANEL
      ======================================= */}

      <div className="ec2-filter-panel">

        <div className="ec2-search-box">

          <Search size={18} />

          <input
            type="text"
            placeholder="Search by instance ID or name..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

        </div>

        <div className="ec2-state-filter">

          <select
            value={stateFilter}
            onChange={(event) =>
              setStateFilter(event.target.value)
            }
          >

            <option value="">
              All States
            </option>

            <option value="running">
              Running
            </option>

            <option value="stopped">
              Stopped
            </option>

          </select>

        </div>

        <div className="ec2-result-count">

          <strong>
            {instances.length}
          </strong>

          <span>
            Instances
          </span>

        </div>

      </div>

      {/* ======================================
          ERROR
      ======================================= */}

      {error && (
        <div className="ec2-error">

          <div className="ec2-error-icon">
            <AlertCircle size={20} />
          </div>

          <div className="ec2-error-content">

            <strong>
              AWS Connection Error
            </strong>

            <p>
              {error}
            </p>

          </div>

          <button
            onClick={() =>
              loadInstances(true)
            }
          >
            Try Again
          </button>

        </div>
      )}

      {/* ======================================
          LOADING
      ======================================= */}

      {loading && (
        <div className="ec2-message">

          <RefreshCw
            size={22}
            className="refresh-spin"
          />

          <span>
            Loading EC2 instances...
          </span>

        </div>
      )}

      {/* ======================================
          EC2 TABLE
      ======================================= */}

      {!loading && !error && (
        <div className="ec2-table-section">

          <div className="ec2-table-header">

            <div>

              <span className="ec2-section-label">
                EC2 RESOURCES
              </span>

              <h3>
                Instance Management
              </h3>

            </div>

            <div className="ec2-table-count">

              {instances.length}{" "}

              {instances.length === 1
                ? "instance"
                : "instances"}

            </div>

          </div>

          <div className="ec2-table-container">

            <table className="ec2-table">

              <thead>

                <tr>

                  <th>Name</th>

                  <th>Instance ID</th>

                  <th>State</th>

                  <th>Type</th>

                  <th>
                    Availability Zone
                  </th>

                  <th>
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {instances.length === 0 ? (

                  <tr>

                    <td
                      colSpan="6"
                      className="ec2-empty"
                    >

                      <Server size={34} />

                      <strong>
                        No EC2 instances found
                      </strong>

                      <span>
                        Try changing your
                        search or state
                        filter.
                      </span>

                    </td>

                  </tr>

                ) : (

                  instances.map(
                    (instance) => {

                      const currentState =
                        String(
                          instance.state
                        ).toLowerCase();

                      const isActionLoading =
                        actionLoading ===
                        instance.instance_id;

                      return (
                        <tr
                          key={
                            instance.instance_id
                          }
                        >

                          <td>

                            <div className="ec2-name">

                              <span
                                className={`instance-dot ${currentState}`}
                              ></span>

                              <strong>
                                {instance.name ||
                                  "Unnamed"}
                              </strong>

                            </div>

                          </td>

                          <td>

                            <code className="instance-id">
                              {
                                instance.instance_id
                              }
                            </code>

                          </td>

                          <td>

                            <span
                              className={`instance-state ${currentState}`}
                            >

                              <span className="state-dot"></span>

                              {currentState.toUpperCase()}

                            </span>

                          </td>

                          <td>

                            <div className="instance-type">

                              <Cpu size={15} />

                              {instance.instance_type ||
                                "N/A"}

                            </div>

                          </td>

                          <td>

                            <div className="availability-zone">

                              <MapPin size={15} />

                              {instance.availability_zone ||
                                "N/A"}

                            </div>

                          </td>

                          {/* ACTIONS */}

                          <td>

                            <div className="ec2-action-group">

                              {/* VIEW DETAILS */}

                              <button
                                className="ec2-action-button details"
                                onClick={() =>
                                  openDetails(
                                    instance.instance_id
                                  )
                                }
                                disabled={
                                  actionLoading !== ""
                                }
                                title="View EC2 details"
                              >

                                <Eye size={15} />

                                Details

                              </button>

                              {/* START */}

                              {currentState ===
                              "stopped" ? (

                                <button
                                  className="ec2-action-button start"
                                  onClick={() =>
                                    startInstance(
                                      instance.instance_id
                                    )
                                  }
                                  disabled={
                                    isActionLoading ||
                                    actionLoading !== ""
                                  }
                                >

                                  <Play size={15} />

                                  {isActionLoading
                                    ? "Starting..."
                                    : "Start"}

                                </button>

                              ) : currentState ===
                                "running" ? (

                                <button
                                  className="ec2-action-button stop"
                                  onClick={() =>
                                    stopInstance(
                                      instance.instance_id
                                    )
                                  }
                                  disabled={
                                    isActionLoading ||
                                    actionLoading !== ""
                                  }
                                >

                                  <Square size={15} />

                                  {isActionLoading
                                    ? "Stopping..."
                                    : "Stop"}

                                </button>

                              ) : (

                                <span className="ec2-action-disabled">

                                  <RefreshCw
                                    size={14}
                                  />

                                  {currentState}

                                </span>

                              )}

                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )
                )}

              </tbody>

            </table>

          </div>

        </div>
      )}

      {/* ======================================
          INFORMATION CARD
      ======================================= */}

      {!loading && (
        <div className="ec2-info-card">

          <Server size={19} />

          <div>

            <strong>
              EC2 Instance Management
            </strong>

            <p>
              Start and stop EC2 instances
              directly through this dashboard.
              AWS state changes may take a few
              moments to complete, so instances
              can temporarily appear in a
              transitional state.
            </p>

          </div>

        </div>
      )}

      {/* ======================================
          EC2 DETAILS MODAL
      ======================================= */}

      {selectedInstance !== null || detailsLoading ? (

        <div
          className="ec2-modal-overlay"
          onClick={closeDetails}
        >

          <div
            className="ec2-details-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="ec2-details-header">

              <div className="ec2-details-title">

                <div className="ec2-details-icon">
                  <Server size={22} />
                </div>

                <div>

                  <span>
                    EC2 RESOURCE DETAILS
                  </span>

                  <h3>
                    {selectedInstance?.name ||
                      "Loading instance..."}
                  </h3>

                </div>

              </div>

              <button
                className="ec2-details-close"
                onClick={closeDetails}
                aria-label="Close details"
              >
                <X size={20} />
              </button>

            </div>

            {/* MODAL BODY */}

            {detailsLoading ? (

              <div className="ec2-details-loading">

                <RefreshCw
                  size={28}
                  className="refresh-spin"
                />

                <strong>
                  Loading EC2 details...
                </strong>

                <span>
                  Fetching resource information
                  from AWS.
                </span>

              </div>

            ) : detailsError ? (

              <div className="ec2-details-error">

                <AlertCircle size={28} />

                <strong>
                  Unable to load details
                </strong>

                <p>
                  {detailsError}
                </p>

                <button
                  className="ec2-details-retry"
                  onClick={() =>
                    selectedInstance?.instance_id &&
                    loadInstanceDetails(
                      selectedInstance.instance_id
                    )
                  }
                >
                  <RefreshCw size={15} />
                  Try Again
                </button>

              </div>

            ) : selectedInstance ? (

              <>

                {/* STATUS */}

                <div className="ec2-details-status-card">

                  <div>

                    <span className="ec2-details-small-label">
                      INSTANCE STATUS
                    </span>

                    <div className="ec2-details-instance-name">

                      <span
                        className={`instance-dot ${String(
                          selectedInstance.state
                        ).toLowerCase()}`}
                      ></span>

                      <strong>
                        {selectedInstance.name ||
                          "Unnamed"}
                      </strong>

                    </div>

                  </div>

                  <span
                    className={`instance-state ${String(
                      selectedInstance.state
                    ).toLowerCase()}`}
                  >

                    <span className="state-dot"></span>

                    {String(
                      selectedInstance.state
                    ).toUpperCase()}

                  </span>

                </div>

                {/* BASIC INFORMATION */}

                <div className="ec2-details-section">

                  <div className="ec2-details-section-title">

                    <Cpu size={17} />

                    <h4>
                      Instance Information
                    </h4>

                  </div>

                  <div className="ec2-details-grid">

                    <div className="ec2-detail-item">

                      <span>
                        Instance ID
                      </span>

                      <code>
                        {selectedInstance.instance_id}
                      </code>

                    </div>

                    <div className="ec2-detail-item">

                      <span>
                        Instance Type
                      </span>

                      <strong>
                        {selectedInstance.instance_type ||
                          "N/A"}
                      </strong>

                    </div>

                    <div className="ec2-detail-item">

                      <span>
                        Region
                      </span>

                      <strong>
                        {selectedInstance.region ||
                          "N/A"}
                      </strong>

                    </div>

                    <div className="ec2-detail-item">

                      <span>
                        Availability Zone
                      </span>

                      <strong>
                        {selectedInstance.availability_zone ||
                          "N/A"}
                      </strong>

                    </div>

                    <div className="ec2-detail-item">

                      <span>
                        Architecture
                      </span>

                      <strong>
                        {selectedInstance.architecture ||
                          "N/A"}
                      </strong>

                    </div>

                    <div className="ec2-detail-item">

                      <span>
                        Platform
                      </span>

                      <strong>
                        {selectedInstance.platform ||
                          "N/A"}
                      </strong>

                    </div>

                    <div className="ec2-detail-item">

                      <span>
                        Launch Time
                      </span>

                      <strong>
                        {formatLaunchTime(
                          selectedInstance.launch_time
                        )}
                      </strong>

                    </div>

                    <div className="ec2-detail-item">

                      <span>
                        Monitoring
                      </span>

                      <strong>
                        {selectedInstance.monitoring ||
                          "N/A"}
                      </strong>

                    </div>

                  </div>

                </div>

                {/* NETWORK INFORMATION */}

                <div className="ec2-details-section">

                  <div className="ec2-details-section-title">

                    <Network size={17} />

                    <h4>
                      Network Information
                    </h4>

                  </div>

                  <div className="ec2-details-grid">

                    <div className="ec2-detail-item">

                      <span>
                        Private IP
                      </span>

                      <strong>
                        {selectedInstance.private_ip ||
                          "Not assigned"}
                      </strong>

                    </div>

                    <div className="ec2-detail-item">

                      <span>
                        Public IP
                      </span>

                      <strong>
                        {selectedInstance.public_ip ||
                          "Not assigned"}
                      </strong>

                    </div>

                    <div className="ec2-detail-item">

                      <span>
                        VPC ID
                      </span>

                      <code>
                        {selectedInstance.vpc_id ||
                          "N/A"}
                      </code>

                    </div>

                    <div className="ec2-detail-item">

                      <span>
                        Subnet ID
                      </span>

                      <code>
                        {selectedInstance.subnet_id ||
                          "N/A"}
                      </code>

                    </div>

                  </div>

                </div>

                {/* SECURITY */}

                <div className="ec2-details-section">

                  <div className="ec2-details-section-title">

                    <Shield size={17} />

                    <h4>
                      Security Groups
                    </h4>

                  </div>

                  {selectedInstance.security_groups
                    ?.length > 0 ? (

                    <div className="ec2-security-list">

                      {selectedInstance.security_groups.map(
                        (group) => (

                          <div
                            className="ec2-security-item"
                            key={group.group_id}
                          >

                            <Shield size={16} />

                            <div>

                              <strong>
                                {group.group_name ||
                                  "Unnamed"}
                              </strong>

                              <code>
                                {group.group_id}
                              </code>

                            </div>

                          </div>

                        )
                      )}

                    </div>

                  ) : (

                    <div className="ec2-no-data">
                      No security groups found.
                    </div>

                  )}

                </div>

                {/* STORAGE */}

                <div className="ec2-details-section">

                  <div className="ec2-details-section-title">

                    <HardDrive size={17} />

                    <h4>
                      EBS Volumes
                    </h4>

                  </div>

                  {selectedInstance.volumes
                    ?.length > 0 ? (

                    <div className="ec2-volume-list">

                      {selectedInstance.volumes.map(
                        (volume) => (

                          <div
                            className="ec2-volume-item"
                            key={
                              volume.volume_id ||
                              volume.device_name
                            }
                          >

                            <div className="ec2-volume-icon">
                              <HardDrive size={16} />
                            </div>

                            <div className="ec2-volume-info">

                              <strong>
                                {volume.volume_id ||
                                  "Unknown volume"}
                              </strong>

                              <span>
                                Device:{" "}
                                {volume.device_name ||
                                  "N/A"}
                              </span>

                            </div>

                            <span className="ec2-volume-badge">

                              {volume.delete_on_termination
                                ? "Delete on termination"
                                : "Retained"}

                            </span>

                          </div>

                        )
                      )}

                    </div>

                  ) : (

                    <div className="ec2-no-data">
                      No EBS volumes found.
                    </div>

                  )}

                </div>

                {/* KEY PAIR / IAM */}

                <div className="ec2-details-section">

                  <div className="ec2-details-section-title">

                    <KeyRound size={17} />

                    <h4>
                      Access Configuration
                    </h4>

                  </div>

                  <div className="ec2-details-grid">

                    <div className="ec2-detail-item">

                      <span>
                        Key Pair
                      </span>

                      <strong>
                        {selectedInstance.key_name ||
                          "None"}
                      </strong>

                    </div>

                    <div className="ec2-detail-item">

                      <span>
                        IAM Instance Profile
                      </span>

                      <strong>
                        {selectedInstance.iam_instance_profile ||
                          "None"}
                      </strong>

                    </div>

                  </div>

                </div>

              </>

            ) : null}

            {/* MODAL FOOTER */}

            {selectedInstance && !detailsLoading && (

              <div className="ec2-details-footer">

                <div className="ec2-details-footer-info">

                  <Monitor size={15} />

                  <span>
                    Live data from AWS EC2
                  </span>

                </div>

                <div className="ec2-details-footer-actions">

                  <button
                    className="ec2-modal-refresh"
                    onClick={() =>
                      loadInstanceDetails(
                        selectedInstance.instance_id
                      )
                    }
                    disabled={detailsLoading}
                  >

                    <RefreshCw size={15} />

                    Refresh Details

                  </button>

                  <button
                    className="ec2-modal-close"
                    onClick={closeDetails}
                  >
                    Close
                  </button>

                </div>

              </div>

            )}

          </div>

        </div>

      ) : null}

    </div>
  );
}

export default EC2Management;

