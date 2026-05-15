import React, { useState, useEffect, useRef } from "react";
import "./Style/F-Materials.css";
import {
  FaSearch,
  FaDownload,
  FaFilePdf,
  FaFileAlt,
  FaFilePowerpoint,
  FaFileWord,
  FaChevronDown,
  FaTimes
} from "react-icons/fa";

import { supabase } from "../lib/supabase.js";

const Materials = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  const yearDropdownRef = useRef(null);
  const categoryDropdownRef = useRef(null);

  // ✅ FETCH MATERIALS FROM SUPABASE
  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("materials")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch error:", error.message);
    } else {
      setMaterials(data);
    }

    setLoading(false);
  };

  // Close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target)) {
        setIsYearDropdownOpen(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setIsCategoryDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // UNIQUE FILTER VALUES
  const years = [...new Set(materials.map(m => m.academic_year))];
  const categories = [...new Set(materials.map(m => m.document_type))];

  // FILTER LOGIC
  const filteredMaterials = materials.filter(m => {
    const matchesSearch =
      m.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.file_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesYear = !yearFilter || m.academic_year === yearFilter;
    const matchesCategory = !categoryFilter || m.document_type === categoryFilter;

    return matchesSearch && matchesYear && matchesCategory;
  });

  // DOWNLOAD FILE
  const handleDownload = (material) => {
    window.open(material.file_url, "_blank");
  };

  const getFileIcon = (name) => {
    if (!name) return <FaFileAlt />;
    if (name.endsWith(".pdf")) return <FaFilePdf />;
    if (name.endsWith(".ppt") || name.endsWith(".pptx")) return <FaFilePowerpoint />;
    if (name.endsWith(".doc") || name.endsWith(".docx")) return <FaFileWord />;
    return <FaFileAlt />;
  };

  return (
    <div className="materials-container">
      <div className="materials">
        <div className="materials-header">
          <h2>Course Materials</h2>
        </div>

        <div className="materials-content">
          <div className="materials-card">

            {/* SEARCH */}
            <div className="filters-section">
              <div className="search-wrapper">
                <FaSearch />
                <input
                  type="text"
                  placeholder="Search materials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* LOADING */}
            {loading && <p>Loading materials...</p>}

            {/* TABLE */}
            {!loading && (
              <table className="materials-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>File</th>
                    <th>Type</th>
                    <th>Year</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMaterials.map((m) => (
                    <tr key={m.id}>
                      <td>{m.subject}</td>

                      <td>
                        {getFileIcon(m.file_name)} {m.file_name}
                      </td>

                      <td>{m.document_type}</td>
                      <td>{m.academic_year}</td>

                      <td>
                        <button onClick={() => handleDownload(m)}>
                          <FaDownload /> Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* EMPTY */}
            {!loading && filteredMaterials.length === 0 && (
              <p>No materials found</p>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Materials;