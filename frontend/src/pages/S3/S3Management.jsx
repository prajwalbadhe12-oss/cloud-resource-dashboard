import { useEffect, useMemo, useState } from "react";

import {
  HardDrive,
  RefreshCw,
  Upload,
  Trash2,
  Plus,
  FolderOpen,
  File,
  X,
  AlertCircle,
  Clock,
  Eye,
  CheckCircle,
  Database,
  Globe,
  Calendar,
  Package,
  HardDriveDownload,
  Search
} from "lucide-react";

import "./S3Management.css";

const API_BASE_URL = "http://127.0.0.1:5000/api";

function S3Management() {
  const [buckets, setBuckets] = useState([]);
  const [selectedBucket, setSelectedBucket] = useState("");
  const [objects, setObjects] = useState([]);

  const [loading, setLoading] = useState(false);
  const [objectsLoading, setObjectsLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showCreateBucket, setShowCreateBucket] = useState(false);
  const [bucketName, setBucketName] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  // =========================================
  // LAST UPDATED
  // =========================================

  const [lastUpdated, setLastUpdated] = useState(null);

  // =========================================
  // SEARCH
  // =========================================

  const [bucketSearch, setBucketSearch] = useState("");
  const [objectSearch, setObjectSearch] = useState("");

  // =========================================
  // S3 DETAILS MODAL
  // =========================================

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsBucket, setDetailsBucket] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  // =========================================
  // LOAD BUCKETS
  // =========================================

  const loadBuckets = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch(
        `${API_BASE_URL}/s3/buckets`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch S3 buckets."
        );
      }

      const data = await response.json();

      if (data.status !== "success") {
        throw new Error(
          data.message ||
            "Failed to load S3 buckets."
        );
      }

      const bucketList = data.buckets || [];

      setBuckets(bucketList);
      setLastUpdated(new Date());

      setSelectedBucket(
        (currentSelectedBucket) => {
          const bucketNames = bucketList.map(
            (bucket) =>
              typeof bucket === "string"
                ? bucket
                : bucket.name ||
                  bucket.bucket_name
          );

          if (
            currentSelectedBucket &&
            bucketNames.includes(
              currentSelectedBucket
            )
          ) {
            return currentSelectedBucket;
          }

          if (bucketNames.length > 0) {
            return bucketNames[0];
          }

          return "";
        }
      );
    } catch (err) {
      console.error(
        "S3 Bucket API Error:",
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

  // =========================================
  // LOAD OBJECTS
  // =========================================

  const loadObjects = async (
    bucketName,
    isRefresh = false
  ) => {
    if (!bucketName) {
      setObjects([]);
      return;
    }

    try {
      if (!isRefresh) {
        setObjectsLoading(true);
      }

      setError("");

      const response = await fetch(
        `${API_BASE_URL}/s3/buckets/${encodeURIComponent(
          bucketName
        )}/objects`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch S3 objects."
        );
      }

      const data = await response.json();

      if (data.status !== "success") {
        throw new Error(
          data.message ||
            "Failed to load S3 objects."
        );
      }

      setObjects(data.objects || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(
        "S3 Objects API Error:",
        err
      );

      setError(
        err.message ||
          "Unable to load bucket objects."
      );
    } finally {
      setObjectsLoading(false);
    }
  };

  // =========================================
  // LOAD S3 BUCKET DETAILS
  // =========================================

  const loadBucketDetails = async (
    bucketName,
    showModal = true
  ) => {
    if (!bucketName) {
      return;
    }

    try {
      setDetailsLoading(true);
      setDetailsError("");

      if (showModal) {
        setShowDetailsModal(true);
      }

      const response = await fetch(
        `${API_BASE_URL}/s3/buckets/${encodeURIComponent(
          bucketName
        )}/details`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch S3 bucket details."
        );
      }

      const data = await response.json();

      if (data.status !== "success") {
        throw new Error(
          data.message ||
            "Failed to load S3 bucket details."
        );
      }

      setDetailsBucket(
        data.bucket || null
      );
    } catch (err) {
      console.error(
        "S3 Details API Error:",
        err
      );

      setDetailsError(
        err.message ||
          "Unable to load S3 bucket details."
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  // =========================================
  // OPEN DETAILS MODAL
  // =========================================

  const openBucketDetails = (
    event,
    bucketName
  ) => {
    event.stopPropagation();

    setDetailsBucket(null);
    setDetailsError("");
    setShowDetailsModal(true);

    loadBucketDetails(
      bucketName,
      false
    );
  };

  // =========================================
  // CLOSE DETAILS MODAL
  // =========================================

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setDetailsBucket(null);
    setDetailsError("");
  };

  // =========================================
  // REFRESH DETAILS
  // =========================================

  const refreshDetails = async () => {
    if (!detailsBucket?.name) {
      return;
    }

    await loadBucketDetails(
      detailsBucket.name,
      false
    );
  };

  // =========================================
  // FILTER BUCKETS
  // =========================================

  const filteredBuckets = useMemo(() => {
    const search = bucketSearch
      .trim()
      .toLowerCase();

    if (!search) {
      return buckets;
    }

    return buckets.filter((bucket) => {
      const name =
        typeof bucket === "string"
          ? bucket
          : bucket.name ||
            bucket.bucket_name ||
            "";

      return name
        .toLowerCase()
        .includes(search);
    });
  }, [buckets, bucketSearch]);

  // =========================================
  // FILTER OBJECTS
  // =========================================

  const filteredObjects = useMemo(() => {
    const search = objectSearch
      .trim()
      .toLowerCase();

    if (!search) {
      return objects;
    }

    return objects.filter((object) => {
      const key =
        object.key ||
        object.Key ||
        object.name ||
        object.object_key ||
        object;

      return String(key)
        .toLowerCase()
        .includes(search);
    });
  }, [objects, objectSearch]);

  // =========================================
  // INITIAL BUCKET LOAD
  // =========================================

  useEffect(() => {
    loadBuckets();
  }, []);

  // =========================================
  // AUTO REFRESH BUCKETS
  // EVERY 30 SECONDS
  // =========================================

  useEffect(() => {
    const interval = setInterval(() => {
      loadBuckets(true);
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // =========================================
  // LOAD OBJECTS WHEN BUCKET CHANGES
  // =========================================

  useEffect(() => {
    setObjectSearch("");

    if (selectedBucket) {
      loadObjects(selectedBucket);
    } else {
      setObjects([]);
    }
  }, [selectedBucket]);

  // =========================================
  // AUTO REFRESH SELECTED BUCKET OBJECTS
  // EVERY 30 SECONDS
  // =========================================

  useEffect(() => {
    if (!selectedBucket) {
      return;
    }

    const interval = setInterval(() => {
      loadObjects(
        selectedBucket,
        true
      );
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [selectedBucket]);

  // =========================================
  // CREATE BUCKET
  // =========================================

  const createBucket = async () => {
    const name = bucketName.trim();

    if (!name) {
      setError(
        "Please enter a bucket name."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_BASE_URL}/s3/buckets`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            bucket_name: name
          })
        }
      );

      const data = await response.json();

      if (data.status !== "success") {
        throw new Error(
          data.message ||
            "Failed to create bucket."
        );
      }

      setSuccess(
        `Bucket "${name}" created successfully.`
      );

      setBucketName("");
      setShowCreateBucket(false);

      await loadBuckets();
    } catch (err) {
      console.error(
        "Create Bucket Error:",
        err
      );

      setError(
        err.message ||
          "Unable to create S3 bucket."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // SELECT FILE
  // =========================================

  const handleFileSelect = (event) => {
    const file =
      event.target.files?.[0] ||
      null;

    setError("");
    setSuccess("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  // =========================================
  // UPLOAD FILE
  // =========================================

  const uploadFile = async () => {
    if (!selectedBucket) {
      setError(
        "Please select an S3 bucket."
      );
      return;
    }

    if (!selectedFile) {
      setError(
        "Please select a file to upload."
      );
      return;
    }

    try {
      setUploading(true);
      setError("");
      setSuccess("");

      const formData = new FormData();

      formData.append(
        "file",
        selectedFile
      );

      const response = await fetch(
        `${API_BASE_URL}/s3/buckets/${encodeURIComponent(
          selectedBucket
        )}/upload`,
        {
          method: "POST",
          body: formData
        }
      );

      const data = await response.json();

      if (data.status !== "success") {
        throw new Error(
          data.message ||
            "File upload failed."
        );
      }

      setSuccess(
        `"${selectedFile.name}" uploaded successfully.`
      );

      setSelectedFile(null);

      const fileInput =
        document.getElementById(
          "s3-file-input"
        );

      if (fileInput) {
        fileInput.value = "";
      }

      await loadObjects(
        selectedBucket
      );
    } catch (err) {
      console.error(
        "Upload Error:",
        err
      );

      setError(
        err.message ||
          "Unable to upload file."
      );
    } finally {
      setUploading(false);
    }
  };

  // =========================================
  // DELETE OBJECT
  // =========================================

  const deleteObject = async (
    objectKey
  ) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${objectKey}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const encodedObjectKey =
        objectKey
          .split("/")
          .map(encodeURIComponent)
          .join("/");

      const response = await fetch(
        `${API_BASE_URL}/s3/buckets/${encodeURIComponent(
          selectedBucket
        )}/objects/${encodedObjectKey}`,
        {
          method: "DELETE"
        }
      );

      const data =
        await response.json();

      if (data.status !== "success") {
        throw new Error(
          data.message ||
            "Failed to delete object."
        );
      }

      setSuccess(
        `"${objectKey}" deleted successfully.`
      );

      await loadObjects(
        selectedBucket
      );
    } catch (err) {
      console.error(
        "Delete Object Error:",
        err
      );

      setError(
        err.message ||
          "Unable to delete object."
      );
    }
  };
  // DELETE BUCKET
const deleteBucket = async (event, bucketName) => {
  event.stopPropagation();

  const confirmed = window.confirm(
    `Are you sure you want to delete bucket "${bucketName}"?\n\nThe bucket must be empty before AWS allows deletion.`
  );

  if (!confirmed) {
    return;
  }

  try {
    setError("");
    setSuccess("");

    const response = await fetch(
      `${API_BASE_URL}/s3/buckets/${encodeURIComponent(bucketName)}`,
      {
        method: "DELETE"
      }
    );

    const data = await response.json();

    if (data.status !== "success") {
      throw new Error(
        data.message || "Failed to delete bucket."
      );
    }

    setSuccess(
      `Bucket "${bucketName}" deleted successfully.`
    );

    // If the deleted bucket was selected, clear it
    if (selectedBucket === bucketName) {
      setSelectedBucket("");
      setObjects([]);
    }

    // Close details modal if it was open
    if (detailsBucket?.name === bucketName) {
      closeDetailsModal();
    }

    // Reload bucket list
    await loadBuckets();
  } catch (err) {
    console.error("Delete Bucket Error:", err);

    setError(
      err.message || "Unable to delete S3 bucket."
    );
  }
};

  // =========================================
  // CLEAR FILE
  // =========================================

  const clearSelectedFile = () => {
    setSelectedFile(null);

    const fileInput =
      document.getElementById(
        "s3-file-input"
      );

    if (fileInput) {
      fileInput.value = "";
    }
  };

  // =========================================
  // CLEAR BUCKET SEARCH
  // =========================================

  const clearBucketSearch = () => {
    setBucketSearch("");
  };

  // =========================================
  // CLEAR OBJECT SEARCH
  // =========================================

  const clearObjectSearch = () => {
    setObjectSearch("");
  };

  // =========================================
  // MANUAL REFRESH
  // =========================================

  const manualRefresh = async () => {
    await loadBuckets(true);

    if (selectedBucket) {
      await loadObjects(
        selectedBucket,
        true
      );
    }
  };

  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="s3-page">

      {/* =====================================
          HEADER
      ====================================== */}

      <div className="s3-header">

        <div className="s3-header-content">

          <div className="s3-header-icon">
            <HardDrive size={27} />
          </div>

          <div>
            <span className="s3-label">
              AWS STORAGE
            </span>

            <h2>
              S3 Management
            </h2>

            <p>
              Manage Amazon S3 buckets and objects
              from your AWS dashboard.
            </p>
          </div>

        </div>

        <div className="s3-header-actions">

          {/* LIVE */}

          <div className="s3-live-status">

            <span className="s3-live-dot"></span>

            <div>
              <strong>
                LIVE
              </strong>

              <span>
                Auto-refresh every 30 seconds
              </span>
            </div>

          </div>

          {/* LAST UPDATED */}

          <div className="s3-last-updated">

            <Clock size={15} />

            <span>
              Last updated:
            </span>

            <strong>
              {lastUpdated
                ? lastUpdated.toLocaleTimeString()
                : "Not updated yet"}
            </strong>

          </div>

          {/* CREATE BUCKET */}

          <button
            className="s3-create-btn"
            onClick={() =>
              setShowCreateBucket(true)
            }
          >
            <Plus size={16} />
            Create Bucket
          </button>

          {/* REFRESH */}

          <button
            className="s3-refresh-btn"
            onClick={manualRefresh}
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
                  ? "s3-spin"
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
          NOTIFICATIONS
      ====================================== */}

      {error && (
        <div className="s3-alert error">

          <AlertCircle size={18} />

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >
            <X size={16} />
          </button>

        </div>
      )}

      {success && (
        <div className="s3-alert success">

          <span>✓</span>

          <span>
            {success}
          </span>

          <button
            type="button"
            onClick={() =>
              setSuccess("")
            }
          >
            <X size={16} />
          </button>

        </div>
      )}

      {/* =====================================
          SUMMARY
      ====================================== */}

      <div className="s3-summary">

        <div className="s3-summary-card">

          <div className="s3-summary-icon">
            <HardDrive size={21} />
          </div>

          <div>
            <span>
              Total Buckets
            </span>

            <strong>
              {buckets.length}
            </strong>

            <small>
              Available S3 buckets
            </small>
          </div>

        </div>

        <div className="s3-summary-card">

          <div className="s3-summary-icon objects">
            <FolderOpen size={21} />
          </div>

          <div>
            <span>
              Selected Bucket
            </span>

            <strong className="s3-selected-name">
              {selectedBucket
                ? "ACTIVE"
                : "NONE"}
            </strong>

            <small>
              Current storage location
            </small>
          </div>

        </div>

        <div className="s3-summary-card">

          <div className="s3-summary-icon files">
            <File size={21} />
          </div>

          <div>
            <span>
              Objects
            </span>

            <strong>
              {objects.length}
            </strong>

            <small>
              Files in selected bucket
            </small>
          </div>

        </div>

      </div>

      {/* =====================================
          MAIN CONTENT
      ====================================== */}

      <div className="s3-layout">

        {/* ===================================
            BUCKETS
        ==================================== */}

        <div className="s3-buckets-panel">

          {/* =================================
              BUCKET SEARCH HEADER
          ================================== */}

          <div className="s3-panel-header">

            <div className="s3-search-box bucket-search">

              <Search
                size={17}
                className="s3-search-icon"
              />

              <input
                type="text"
                value={bucketSearch}
                onChange={(event) =>
                  setBucketSearch(
                    event.target.value
                  )
                }
                placeholder="Search buckets..."
                aria-label="Search S3 buckets"
              />

              {bucketSearch && (
                <button
                  type="button"
                  className="s3-search-clear"
                  onClick={
                    clearBucketSearch
                  }
                  title="Clear bucket search"
                >
                  <X size={15} />
                </button>
              )}

            </div>

            <HardDrive
              size={19}
              className="s3-bucket-header-icon"
            />

          </div>

          {/* =================================
              BUCKET LIST
          ================================== */}

          <div className="s3-bucket-list">

            {loading &&
            buckets.length === 0 ? (
              <div className="s3-loading">

                <RefreshCw
                  size={20}
                  className="s3-spin"
                />

                Loading buckets...

              </div>
            ) : buckets.length === 0 ? (
              <div className="s3-empty">

                <HardDrive size={32} />

                <strong>
                  No buckets found
                </strong>

                <span>
                  Create an S3 bucket to get started.
                </span>

              </div>
            ) : filteredBuckets.length === 0 ? (
              <div className="s3-empty">

                <Search size={32} />

                <strong>
                  No matching buckets
                </strong>

                <span>
                  Try a different bucket name.
                </span>

                <button
                  type="button"
                  className="s3-clear-search-btn"
                  onClick={
                    clearBucketSearch
                  }
                >
                  Clear Search
                </button>

              </div>
            ) : (
              filteredBuckets.map(
                (bucket, index) => {

                  const name =
                    typeof bucket === "string"
                      ? bucket
                      : bucket.name ||
                        bucket.bucket_name;

                  return (
                    <div
                      key={
                        name || index
                      }
                      className={
                        selectedBucket === name
                          ? "s3-bucket active"
                          : "s3-bucket"
                      }
                    >

                      {/* BUCKET SELECT */}

                      <button
                        type="button"
                        className="s3-bucket-select"
                        onClick={() =>
                          setSelectedBucket(
                            name
                          )
                        }
                      >

                        <div className="s3-bucket-icon">
                          <HardDrive size={16} />
                        </div>

                        <div className="s3-bucket-info">

                          <strong>
                            {name}
                          </strong>

                          <span>
                            Amazon S3 Bucket
                          </span>

                        </div>

                        {selectedBucket === name && (
                          <span className="s3-selected-dot"></span>
                        )}

                      </button>

                      {/* DETAILS */}

                     <div className="s3-bucket-actions">
  <button
    type="button"
    className="s3-details-btn"
    title="View bucket details"
    onClick={(event) =>
      openBucketDetails(event, name)
    }
  >
    <Eye size={15} />
    Details
  </button>

  <button
    type="button"
    className="s3-delete-bucket-btn"
    title="Delete bucket"
    onClick={(event) =>
      deleteBucket(event, name)
    }
  >
    <Trash2 size={15} />
    Delete
  </button>
</div>

                    </div>
                  );
                }
              )
            )}

          </div>

        </div>

        {/* ===================================
            OBJECTS
        ==================================== */}

        <div className="s3-objects-panel">

          <div className="s3-panel-header">

            <div>

              <h3>
                {selectedBucket
                  ? selectedBucket
                  : "Bucket Objects"}
              </h3>

              <span>
                {selectedBucket
                  ? "Files stored in this bucket"
                  : "Select a bucket"}
              </span>

            </div>

            <FolderOpen size={19} />

          </div>

          {/* =================================
              UPLOAD AREA
          ================================== */}

          <div className="s3-upload-area">

            <div className="s3-upload-icon">
              <Upload size={22} />
            </div>

            <div className="s3-upload-content">

              <strong>
                Upload File
              </strong>

              <span>
                Choose a file and upload it
                to the selected bucket.
              </span>

            </div>

            <input
              id="s3-file-input"
              type="file"
              className="s3-file-input"
              onChange={handleFileSelect}
            />

            <label
              htmlFor="s3-file-input"
              className="s3-select-file-btn"
            >

              <File size={15} />

              Select File

            </label>

            {selectedFile && (
              <div className="s3-selected-file">

                <File size={15} />

                <span
                  title={selectedFile.name}
                >
                  {selectedFile.name}
                </span>

                <button
                  type="button"
                  onClick={
                    clearSelectedFile
                  }
                  title="Remove selected file"
                >
                  <X size={14} />
                </button>

              </div>
            )}

            <button
              type="button"
              className="s3-upload-btn"
              onClick={uploadFile}
              disabled={
                uploading ||
                !selectedFile ||
                !selectedBucket
              }
            >

              {uploading ? (
                <>
                  <RefreshCw
                    size={15}
                    className="s3-spin"
                  />

                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={15} />

                  Upload File
                </>
              )}

            </button>

          </div>

          {/* =================================
              OBJECT SEARCH
          ================================== */}

          {selectedBucket && (
            <div className="s3-object-search-section">

              <div className="s3-object-search-header">

                <div>

                  <strong>
                    Search Objects
                  </strong>

                  <span>
                    Find files by name or path
                  </span>

                </div>

                <span className="s3-object-count">

                  {objectSearch
                    ? `${filteredObjects.length} of ${objects.length}`
                    : `${objects.length}`}{" "}

                  {objects.length === 1
                    ? "object"
                    : "objects"}

                </span>

              </div>

              <div className="s3-search-box object-search">

                <Search
                  size={17}
                  className="s3-search-icon"
                />

                <input
                  type="text"
                  value={objectSearch}
                  onChange={(event) =>
                    setObjectSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search objects by name or path..."
                  aria-label="Search S3 objects"
                />

                {objectSearch && (
                  <button
                    type="button"
                    className="s3-search-clear"
                    onClick={
                      clearObjectSearch
                    }
                    title="Clear object search"
                  >
                    <X size={15} />
                  </button>
                )}

              </div>

            </div>
          )}

          {/* =================================
              OBJECTS TABLE
          ================================== */}

          {objectsLoading ? (
            <div className="s3-loading large">

              <RefreshCw
                size={23}
                className="s3-spin"
              />

              Loading objects...

            </div>
          ) : objects.length === 0 ? (
            <div className="s3-empty large">

              <FolderOpen size={38} />

              <strong>
                No objects found
              </strong>

              <span>
                Upload a file to this bucket
                to see it here.
              </span>

            </div>
          ) : filteredObjects.length === 0 ? (
            <div className="s3-empty large">

              <Search size={38} />

              <strong>
                No matching objects
              </strong>

              <span>
                No files match "{objectSearch}".
              </span>

              <button
                type="button"
                className="s3-clear-search-btn"
                onClick={
                  clearObjectSearch
                }
              >
                Clear Search
              </button>

            </div>
          ) : (
            <div className="s3-table-wrapper">

              <table className="s3-table">

                <thead>

                  <tr>

                    <th>
                      Object
                    </th>

                    <th>
                      Size
                    </th>

                    <th>
                      Last Modified
                    </th>

                    <th>
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredObjects.map(
                    (object, index) => {

                      const key =
                        object.key ||
                        object.Key ||
                        object.name ||
                        object.object_key ||
                        object;

                      const size =
                        object.size ??
                        object.Size ??
                        0;

                      const lastModified =
                        object.last_modified ||
                        object.LastModified ||
                        object.lastModified;

                      return (
                        <tr
                          key={`${key}-${index}`}
                        >

                          <td>

                            <div className="s3-object-name">

                              <div className="s3-file-icon">
                                <File size={15} />
                              </div>

                              <span
                                title={key}
                              >
                                {key}
                              </span>

                            </div>

                          </td>

                          <td>

                            <span className="s3-size">
                              {formatFileSize(size)}
                            </span>

                          </td>

                          <td>

                            <span className="s3-date">

                              {lastModified
                                ? new Date(
                                    lastModified
                                  ).toLocaleString()
                                : "—"}

                            </span>

                          </td>

                          <td>

                            <button
                              type="button"
                              className="s3-delete-btn"
                              onClick={() =>
                                deleteObject(key)
                              }
                            >

                              <Trash2 size={14} />

                              Delete

                            </button>

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

      </div>

      {/* =====================================
          CREATE BUCKET MODAL
      ====================================== */}

      {showCreateBucket && (
        <div
          className="s3-modal-overlay"
          onClick={() =>
            setShowCreateBucket(false)
          }
        >

          <div
            className="s3-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="s3-modal-header">

              <div>

                <div className="s3-modal-icon">
                  <HardDrive size={19} />
                </div>

                <div>

                  <h3>
                    Create S3 Bucket
                  </h3>

                  <p>
                    Create a new bucket in
                    ap-south-1.
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCreateBucket(false)
                }
              >
                <X size={18} />
              </button>

            </div>

            <div className="s3-modal-body">

              <label>
                Bucket Name
              </label>

              <input
                type="text"
                value={bucketName}
                onChange={(event) =>
                  setBucketName(
                    event.target.value
                  )
                }
                placeholder="my-cloud-resource-bucket"
              />

              <small>
                Bucket names must be globally
                unique and lowercase.
              </small>

            </div>

            <div className="s3-modal-actions">

              <button
                type="button"
                className="s3-cancel-btn"
                onClick={() => {
                  setShowCreateBucket(false);
                  setBucketName("");
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                className="s3-confirm-btn"
                onClick={createBucket}
                disabled={
                  !bucketName.trim()
                }
              >

                <Plus size={15} />

                Create Bucket

              </button>

            </div>

          </div>

        </div>
      )}

      {/* =====================================
          S3 RESOURCE DETAILS MODAL
      ====================================== */}

      {showDetailsModal && (
        <div
          className="s3-details-overlay"
          onClick={closeDetailsModal}
        >

          <div
            className="s3-details-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="s3-details-header">

              <div className="s3-details-heading">

                <div className="s3-details-icon">
                  <Database size={22} />
                </div>

                <div>

                  <span className="s3-details-label">
                    S3 RESOURCE DETAILS
                  </span>

                  <h3>
                    {detailsBucket?.name ||
                      "Bucket Details"}
                  </h3>

                  <p>
                    Amazon S3 bucket information
                  </p>

                </div>

              </div>

              <button
                type="button"
                className="s3-details-close"
                onClick={closeDetailsModal}
                title="Close"
              >
                <X size={19} />
              </button>

            </div>

            {/* LOADING */}

            {detailsLoading && (
              <div className="s3-details-loading">

                <RefreshCw
                  size={25}
                  className="s3-spin"
                />

                <strong>
                  Loading bucket details...
                </strong>

                <span>
                  Fetching live information from Amazon S3.
                </span>

              </div>
            )}

            {/* ERROR */}

            {!detailsLoading &&
              detailsError && (
                <div className="s3-details-error">

                  <AlertCircle size={21} />

                  <div>

                    <strong>
                      Unable to load details
                    </strong>

                    <span>
                      {detailsError}
                    </span>

                  </div>

                  <button
                    type="button"
                    onClick={refreshDetails}
                  >
                    Try Again
                  </button>

                </div>
              )}

            {/* DETAILS */}

            {!detailsLoading &&
              !detailsError &&
              detailsBucket && (
                <>

                  {/* ACCESS STATUS */}

                  <div className="s3-details-status-card">

                    <div className="s3-details-status-icon">
                      <CheckCircle size={20} />
                    </div>

                    <div>

                      <span className="s3-details-small-label">
                        BUCKET ACCESS
                      </span>

                      <strong>
                        {detailsBucket.accessible
                          ? "Accessible"
                          : "Not Accessible"}
                      </strong>

                    </div>

                    <span
                      className={
                        detailsBucket.accessible
                          ? "s3-details-status-badge success"
                          : "s3-details-status-badge error"
                      }
                    >
                      {detailsBucket.accessible
                        ? "ACTIVE"
                        : "UNAVAILABLE"}
                    </span>

                  </div>

                  {/* BUCKET INFORMATION */}

                  <div className="s3-details-section">

                    <div className="s3-details-section-title">

                      <Database size={17} />

                      <span>
                        Bucket Information
                      </span>

                    </div>

                    <div className="s3-details-grid">

                      <div className="s3-detail-item">

                        <Globe size={17} />

                        <div>

                          <span>
                            Region
                          </span>

                          <strong>
                            {detailsBucket.region ||
                              "—"}
                          </strong>

                        </div>

                      </div>

                      <div className="s3-detail-item">

                        <Calendar size={17} />

                        <div>

                          <span>
                            Creation Date
                          </span>

                          <strong>
                            {detailsBucket.creation_date
                              ? new Date(
                                  detailsBucket.creation_date
                                ).toLocaleString()
                              : "—"}
                          </strong>

                        </div>

                      </div>

                      <div className="s3-detail-item">

                        <Package size={17} />

                        <div>

                          <span>
                            Object Count
                          </span>

                          <strong>
                            {detailsBucket.object_count ??
                              0}
                          </strong>

                        </div>

                      </div>

                      <div className="s3-detail-item">

                        <HardDriveDownload size={17} />

                        <div>

                          <span>
                            Total Storage
                          </span>

                          <strong>
                            {formatFileSize(
                              detailsBucket.total_size_bytes ||
                                0
                            )}
                          </strong>

                        </div>

                      </div>

                    </div>

                  </div>

                  {/* LATEST OBJECT */}

                  <div className="s3-details-section">

                    <div className="s3-details-section-title">

                      <Clock size={17} />

                      <span>
                        Latest Object
                      </span>

                    </div>

                    {detailsBucket.latest_object ? (
                      <div className="s3-latest-object">

                        <div className="s3-latest-object-icon">
                          <File size={20} />
                        </div>

                        <div className="s3-latest-object-info">

                          <span>
                            Object Name
                          </span>

                          <strong
                            title={
                              detailsBucket
                                .latest_object
                                .key
                            }
                          >
                            {
                              detailsBucket
                                .latest_object
                                .key
                            }
                          </strong>

                          <div className="s3-latest-object-meta">

                            <span>
                              Size:{" "}
                              {formatFileSize(
                                detailsBucket
                                  .latest_object
                                  .size || 0
                              )}
                            </span>

                            <span>
                              Modified:{" "}
                              {detailsBucket
                                .latest_object
                                .last_modified
                                ? new Date(
                                    detailsBucket
                                      .latest_object
                                      .last_modified
                                  ).toLocaleString()
                                : "—"}
                            </span>

                          </div>

                        </div>

                      </div>
                    ) : (
                      <div className="s3-no-latest-object">

                        <FolderOpen size={20} />

                        <span>
                          No objects found in this bucket.
                        </span>

                      </div>
                    )}

                  </div>

                </>
              )}

            {/* MODAL FOOTER */}

            <div className="s3-details-footer">

              <div className="s3-details-footer-info">

                <Clock size={15} />

                <span>
                  Live S3 resource information
                </span>

              </div>

              <div className="s3-details-footer-actions">

                <button
                  type="button"
                  className="s3-details-refresh-btn"
                  onClick={refreshDetails}
                  disabled={detailsLoading}
                >

                  <RefreshCw
                    size={15}
                    className={
                      detailsLoading
                        ? "s3-spin"
                        : ""
                    }
                  />

                  Refresh Details

                </button>

                <button
                  type="button"
                  className="s3-details-close-btn"
                  onClick={closeDetailsModal}
                >

                  <X size={15} />

                  Close

                </button>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

// =========================================
// FILE SIZE HELPER
// =========================================

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) {
    return "0 B";
  }

  const units = [
    "B",
    "KB",
    "MB",
    "GB",
    "TB"
  ];

  const index = Math.floor(
    Math.log(bytes) /
      Math.log(1024)
  );

  return (
    (
      bytes /
      Math.pow(1024, index)
    ).toFixed(
      index === 0 ? 0 : 1
    ) +
    " " +
    units[index]
  );
}

// =========================================
// DEFAULT EXPORT
// =========================================

export default S3Management;