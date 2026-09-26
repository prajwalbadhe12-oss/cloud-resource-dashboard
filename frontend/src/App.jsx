
import { useEffect, useState } from "react";

import {
  LayoutDashboard,
  Server,
  HardDrive,
  Activity,
  FileText,
  Menu,
  X,
} from "lucide-react";

import axios from "axios";

// ==========================================
// PAGE IMPORTS
// ==========================================

import Dashboard from "./pages/Dashboard/Dashboard";
import EC2Management from "./pages/EC2/EC2Management";
import S3Management from "./pages/S3/S3Management";
import Monitoring from "./pages/Monitoring/Monitoring";
import ActivityLogs from "./pages/ActivityLogs/ActivityLogs";

import "./App.css";


function App() {

  // ==========================================
  // ACTIVE PAGE
  // ==========================================

  const [activePage, setActivePage] =
    useState("Dashboard");


  // ==========================================
  // SIDEBAR
  // ==========================================

  const [sidebarOpen, setSidebarOpen] =
    useState(true);


  // ==========================================
  // DASHBOARD DATA
  // ==========================================

  const [dashboardData, setDashboardData] = useState({

    totalEC2: 0,

    runningEC2: 0,

    stoppedEC2: 0,

    s3Buckets: 0,

  });


  // ==========================================
  // DASHBOARD STATUS
  // ==========================================

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [lastUpdated, setLastUpdated] =
    useState(null);


  // ==========================================
  // SIDEBAR MENU
  // ==========================================

  const menuItems = [

    {
      name: "Dashboard",
      icon: LayoutDashboard,
    },

    {
      name: "EC2 Management",
      icon: Server,
    },

    {
      name: "S3 Management",
      icon: HardDrive,
    },

    {
      name: "Monitoring",
      icon: Activity,
    },

    {
      name: "Activity Logs",
      icon: FileText,
    },

  ];


  // ==========================================
  // LOAD DASHBOARD DATA
  // ==========================================

  const loadDashboardData = async (
    isRefresh = false
  ) => {

    try {

      // ----------------------------------------
      // LOADING / REFRESHING STATE
      // ----------------------------------------

      if (isRefresh) {

        setRefreshing(true);

      } else {

        setLoading(true);

      }

      setError("");


      // ----------------------------------------
      // FETCH EC2 + S3 DATA
      // ----------------------------------------

      const [
        ec2Response,
        s3Response
      ] = await Promise.all([

        axios.get(
          "http://127.0.0.1:5000/api/ec2/instances"
        ),

        axios.get(
          "http://127.0.0.1:5000/api/s3/buckets"
        ),

      ]);


      // ----------------------------------------
      // EC2 DATA
      // ----------------------------------------

      const ec2Instances =
        ec2Response.data.instances || [];


      const totalEC2 =
        ec2Instances.length;


      const runningEC2 =
        ec2Instances.filter(
          (instance) =>
            String(instance.state).toLowerCase() ===
            "running"
        ).length;


      const stoppedEC2 =
        ec2Instances.filter(
          (instance) =>
            String(instance.state).toLowerCase() ===
            "stopped"
        ).length;


      // ----------------------------------------
      // S3 DATA
      // ----------------------------------------

      const s3Buckets =
        s3Response.data.count ??
        s3Response.data.buckets?.length ??
        0;


      // ----------------------------------------
      // UPDATE DASHBOARD
      // ----------------------------------------

      setDashboardData({

        totalEC2,

        runningEC2,

        stoppedEC2,

        s3Buckets,

      });


      // ----------------------------------------
      // LAST UPDATED
      // ----------------------------------------

      setLastUpdated(
        new Date()
      );


    } catch (err) {

      console.error(
        "Dashboard API Error:",
        err
      );


      setError(

        err.response?.data?.message ||

        "Unable to load AWS dashboard data. Make sure the Flask backend is running."

      );


    } finally {

      setLoading(false);

      setRefreshing(false);

    }

  };


  // ==========================================
  // INITIAL DASHBOARD LOAD
  // ==========================================

  useEffect(() => {

    loadDashboardData();

  }, []);


  // ==========================================
  // DASHBOARD AUTO REFRESH
  // EVERY 30 SECONDS
  // ==========================================

  useEffect(() => {

    const interval =
      setInterval(() => {

        loadDashboardData(true);

      }, 30000);


    return () => {

      clearInterval(interval);

    };

  }, []);


  // ==========================================
  // RENDER
  // ==========================================

  return (

    <div className="dashboard">


      {/* =====================================
          SIDEBAR
      ====================================== */}

      <aside
        className={`sidebar ${
          sidebarOpen
            ? "open"
            : "closed"
        }`}
      >


        {/* =================================
            SIDEBAR HEADER
        ================================= */}

        <div className="sidebar-header">


          {sidebarOpen && (

            <div className="brand">

              <div className="brand-icon">
                AWS
              </div>


              <div>

                <h2>
                  CloudOps
                </h2>

                <span>
                  Resource Dashboard
                </span>

              </div>

            </div>

          )}


          <button
            className="sidebar-toggle"

            onClick={() =>
              setSidebarOpen(
                !sidebarOpen
              )
            }

            title={
              sidebarOpen
                ? "Collapse Sidebar"
                : "Expand Sidebar"
            }
          >

            {sidebarOpen ? (

              <X size={18} />

            ) : (

              <Menu size={18} />

            )}

          </button>


        </div>


        {/* =================================
            SIDEBAR MENU
        ================================= */}

        <nav className="sidebar-menu">


          {menuItems.map((item) => {

            const Icon =
              item.icon;


            return (

              <button
                key={item.name}

                className={`menu-item ${
                  activePage === item.name
                    ? "active"
                    : ""
                }`}

                onClick={() =>
                  setActivePage(
                    item.name
                  )
                }

                title={item.name}
              >

                <Icon size={18} />


                {sidebarOpen && (

                  <span>
                    {item.name}
                  </span>

                )}


              </button>

            );

          })}


        </nav>


        {/* =================================
            SIDEBAR FOOTER
        ================================= */}

        {sidebarOpen && (

          <div className="sidebar-footer">

            <span>
              AWS REGION
            </span>

            <strong>
              ap-south-1
            </strong>

            <small>
              Mumbai
            </small>

          </div>

        )}


      </aside>



      {/* =====================================
          MAIN CONTENT
      ====================================== */}

      <main className="main-content">


        {/* =================================
            TOP HEADER
        ================================= */}

        <header className="top-header">


          <div>

            <h1>
              {activePage}
            </h1>

            <p>
              Cloud Resource Management &
              Monitoring Dashboard
            </p>

          </div>


          <div className="header-right">


            {/* =============================
                AWS CONNECTION
            ============================== */}

            <div className="connection-status">

              <span className="status-dot"></span>

              AWS Connected

            </div>


            {/* =============================
                USER PROFILE
            ============================== */}

            <div className="user-profile">

              <div className="user-avatar">
                PB
              </div>


              <div className="user-info">

                <strong>
                  Prajwal Badhe
                </strong>

                <span>
                 AWS Cloud Administrator
                </span>

              </div>

            </div>


          </div>


        </header>



        {/* =====================================
            PAGE CONTENT
        ====================================== */}

        <section className="page-content">


          {/* =================================
              DASHBOARD
          ================================= */}

          {activePage === "Dashboard" && (

            <Dashboard

              dashboardData={
                dashboardData
              }

              loading={
                loading
              }

              refreshing={
                refreshing
              }

              error={
                error
              }

              lastUpdated={
                lastUpdated
              }

              loadDashboardData={
                loadDashboardData
              }

            />

          )}



          {/* =================================
              EC2 MANAGEMENT
          ================================= */}

          {activePage === "EC2 Management" && (

            <EC2Management />

          )}



          {/* =================================
              S3 MANAGEMENT
          ================================= */}

          {activePage === "S3 Management" && (

            <S3Management />

          )}



          {/* =================================
              MONITORING
          ================================= */}

          {activePage === "Monitoring" && (

            <Monitoring />

          )}



          {/* =================================
              ACTIVITY LOGS
          ================================= */}

          {activePage === "Activity Logs" && (

            <ActivityLogs />

          )}


        </section>


      </main>


    </div>

  );

}


export default App;

