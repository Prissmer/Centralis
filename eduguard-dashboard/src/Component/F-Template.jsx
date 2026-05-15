import React, { useState } from "react";
import "./Style/F-Templates.css";
import {
  FaFileAlt,
  FaListAlt,
  FaTasks,
  FaClipboardCheck,
  FaBook,
  FaReceipt,
  FaDownload,
  FaSearch,
  FaTimes,
  FaFilePdf,
  FaFileWord,
  FaStar,
  FaRegStar
} from "react-icons/fa";

const Templates = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [favorites, setFavorites] = useState([]);

  const templates = [
    {
      id: 1,
      title: "Course Syllabus",
      description: "Standard template for course syllabus documentation",
      category: "syllabus",
      icon: <FaFileAlt />,
      iconGradient: "gradient-primary",
      fileType: "docx",
      fileSize: "245 KB",
      downloads: 1245,
      rating: 4.8,
      tags: ["syllabus", "course outline", "academic"],
      previewImage: "/previews/syllabus-preview.jpg"
    },
    {
      id: 2,
      title: "Course Outline",
      description: "Detailed course outline structure template",
      category: "outline",
      icon: <FaListAlt />,
      iconGradient: "gradient-secondary",
      fileType: "docx",
      fileSize: "189 KB",
      downloads: 892,
      rating: 4.6,
      tags: ["outline", "course structure", "planning"],
      previewImage: "/previews/outline-preview.jpg"
    },
    {
      id: 3,
      title: "OBTLP Template",
      description: "Outcome-Based Teaching Learning Plan format",
      category: "obtlp",
      icon: <FaTasks />,
      iconGradient: "gradient-primary",
      fileType: "docx",
      fileSize: "312 KB",
      downloads: 1567,
      rating: 4.9,
      tags: ["obtlp", "outcome based", "teaching plan"],
      previewImage: "/previews/obtlp-preview.jpg"
    },
    {
      id: 4,
      title: "Exam Template",
      description: "Standard examination paper format",
      category: "exam",
      icon: <FaClipboardCheck />,
      iconGradient: "gradient-orange",
      fileType: "pdf",
      fileSize: "178 KB",
      downloads: 2341,
      rating: 4.7,
      tags: ["exam", "assessment", "test"],
      previewImage: "/previews/exam-preview.jpg"
    },
    {
      id: 5,
      title: "Module Template",
      description: "Teaching module documentation template",
      category: "module",
      icon: <FaBook />,
      iconGradient: "gradient-blue",
      fileType: "docx",
      fileSize: "423 KB",
      downloads: 987,
      rating: 4.5,
      tags: ["module", "teaching material", "lesson"],
      previewImage: "/previews/module-preview.jpg"
    },
    {
      id: 6,
      title: "Acknowledgment Receipt",
      description: "Download receipt format template",
      category: "receipt",
      icon: <FaReceipt />,
      iconGradient: "gradient-green",
      fileType: "pdf",
      fileSize: "134 KB",
      downloads: 567,
      rating: 4.4,
      tags: ["receipt", "acknowledgment", "download proof"],
      previewImage: "/previews/receipt-preview.jpg"
    },
    {
      id: 7,
      title: "Lesson Plan Template",
      description: "Daily lesson plan format for instructors",
      category: "lesson",
      icon: <FaFileAlt />,
      iconGradient: "gradient-primary",
      fileType: "docx",
      fileSize: "267 KB",
      downloads: 734,
      rating: 4.6,
      tags: ["lesson plan", "daily plan", "teaching"],
      previewImage: "/previews/lesson-preview.jpg"
    },
    {
      id: 8,
      title: "Grading Rubric",
      description: "Assessment and grading rubric template",
      category: "rubric",
      icon: <FaTasks />,
      iconGradient: "gradient-secondary",
      fileType: "xlsx",
      fileSize: "156 KB",
      downloads: 445,
      rating: 4.3,
      tags: ["rubric", "grading", "assessment"],
      previewImage: "/previews/rubric-preview.jpg"
    },
    {
      id: 9,
      title: "Research Paper Template",
      description: "Academic research paper formatting template",
      category: "research",
      icon: <FaBook />,
      iconGradient: "gradient-purple",
      fileType: "docx",
      fileSize: "534 KB",
      downloads: 678,
      rating: 4.7,
      tags: ["research", "academic paper", "thesis"],
      previewImage: "/previews/research-preview.jpg"
    }
  ];

  const categories = [
    { id: "all", name: "All Templates", count: templates.length },
    { id: "syllabus", name: "Syllabus", count: templates.filter(t => t.category === "syllabus").length },
    { id: "outline", name: "Outline", count: templates.filter(t => t.category === "outline").length },
    { id: "obtlp", name: "OBTLP", count: templates.filter(t => t.category === "obtlp").length },
    { id: "exam", name: "Exam", count: templates.filter(t => t.category === "exam").length },
    { id: "module", name: "Module", count: templates.filter(t => t.category === "module").length },
    { id: "receipt", name: "Receipt", count: templates.filter(t => t.category === "receipt").length }
  ];

  const toggleFavorite = (templateId) => {
    if (favorites.includes(templateId)) {
      setFavorites(favorites.filter(id => id !== templateId));
    } else {
      setFavorites([...favorites, templateId]);
    }
  };

  const handleDownload = (template) => {
    alert(`Downloading template: ${template.title}\n\nFile Type: ${template.fileType.toUpperCase()}\nFile Size: ${template.fileSize}\n\nThis would download the template in a real application.`);
  };

  const handlePreview = (template) => {
    alert(`Previewing: ${template.title}\n\nThis would show a preview of the template in a real application.`);
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === "all" || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getGradientClass = (gradient) => {
    switch(gradient) {
      case 'gradient-primary':
        return 'gradient-primary';
      case 'gradient-secondary':
        return 'gradient-secondary';
      case 'gradient-orange':
        return 'gradient-orange';
      case 'gradient-blue':
        return 'gradient-blue';
      case 'gradient-green':
        return 'gradient-green';
      case 'gradient-purple':
        return 'gradient-purple';
      default:
        return 'gradient-primary';
    }
  };

  const getFileTypeIcon = (fileType) => {
    switch(fileType) {
      case 'pdf':
        return <FaFilePdf />;
      case 'docx':
        return <FaFileWord />;
      default:
        return <FaFileAlt />;
    }
  };

  return (
    <div className="templates-container">
      <div className="templates">
        {/* Header */}
        <div className="templates-header">
          <div>
            <h2>Templates Library</h2>
            <p>Download ready-to-use academic templates</p>
          </div>
        </div>

        {/* Content */}
        <div className="templates-content">
          {/* Search and Filter Bar */}
          <div className="search-filter-section">
            <div className="search-wrapper">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search templates by name, description, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button className="clear-search" onClick={() => setSearchTerm("")}>
                  <FaTimes />
                </button>
              )}
            </div>

            <div className="category-filter">
              {categories.map(category => (
                <button
                  key={category.id}
                  className={`category-btn ${categoryFilter === category.id ? 'active' : ''}`}
                  onClick={() => setCategoryFilter(category.id)}
                >
                  {category.name}
                  <span className="category-count">{category.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Results Info */}
          <div className="results-info">
            <span className="results-count">
              Found {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Templates Grid */}
          <div className="templates-grid">
            {filteredTemplates.map((template) => (
              <div key={template.id} className="template-card">
                <div className="template-card-inner">
                  {/* Favorite Button */}
                  <button 
                    className="favorite-btn"
                    onClick={() => toggleFavorite(template.id)}
                  >
                    {favorites.includes(template.id) ? <FaStar /> : <FaRegStar />}
                  </button>

                  {/* Icon */}
                  <div className={`template-icon ${getGradientClass(template.iconGradient)}`}>
                    {template.icon}
                  </div>

                  {/* Content */}
                  <h3 className="template-title">{template.title}</h3>
                  <p className="template-description">{template.description}</p>

                  {/* Tags */}
                  <div className="template-tags">
                    {template.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="tag">{tag}</span>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="template-stats">
                    <div className="stat">
                      <span className="stat-label">Downloads</span>
                      <span className="stat-value">{template.downloads.toLocaleString()}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Rating</span>
                      <span className="stat-value">⭐ {template.rating}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Size</span>
                      <span className="stat-value">{template.fileSize}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="template-actions">
                    <button 
                      className="action-btn preview-btn"
                      onClick={() => handlePreview(template)}
                    >
                      Preview
                    </button>
                    <button 
                      className="action-btn download-template-btn"
                      onClick={() => handleDownload(template)}
                    >
                      {getFileTypeIcon(template.fileType)}
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredTemplates.length === 0 && (
            <div className="empty-state">
              <FaFileAlt className="empty-icon" />
              <h3>No templates found</h3>
              <p>Try adjusting your search or filter criteria</p>
            </div>
          )}

          {/* Featured Section */}
          <div className="featured-section">
            <div className="featured-header">
              <h3>Most Popular Templates</h3>
              <p>Highly recommended by faculty members</p>
            </div>
            <div className="featured-grid">
              {templates.slice(0, 3).map((template) => (
                <div key={`featured-${template.id}`} className="featured-card">
                  <div className="featured-card-content">
                    <div className={`featured-icon ${getGradientClass(template.iconGradient)}`}>
                      {template.icon}
                    </div>
                    <div className="featured-info">
                      <h4>{template.title}</h4>
                      <p>{template.description}</p>
                      <div className="featured-stats">
                        <span>⭐ {template.rating}</span>
                        <span>📥 {template.downloads.toLocaleString()}</span>
                      </div>
                    </div>
                    <button 
                      className="featured-download-btn"
                      onClick={() => handleDownload(template)}
                    >
                      <FaDownload />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Templates;