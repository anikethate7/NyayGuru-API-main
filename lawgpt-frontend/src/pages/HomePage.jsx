import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/HomePage.css";

const HomePage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  // Active indicators
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);

  // Auto-scroll state
  const [autoScrollFeatures, setAutoScrollFeatures] = useState(true);
  const [autoScrollCategories, setAutoScrollCategories] = useState(true);

  // Refs for scrolling
  const featuresRef = useRef(null);
  const categoriesRef = useRef(null);

  // Feature cards configuration
  const featureCards = [
    {
      id: "chat",
      title: "Legal Chat",
      icon: "bi-chat-dots-fill",
      description:
        "Get answers to your legal questions with our advanced AI assistant.",
      buttonText: "Start Chat",
      route: "/chat",
      highlight: true,
    },
    {
      id: "documents",
      title: "Document Analysis",
      icon: "bi-file-text-fill",
      description: "Upload and analyze legal documents to extract insights.",
      buttonText: "Analyze Documents",
      route: "/documents",
    },
    {
      id: "lawyers",
      title: "Lawyer Support",
      icon: "bi-person-badge-fill",
      description:
        "Connect with verified lawyers for professional legal consultation.",
      buttonText: "Coming Soon",
      route: "#",
      comingSoon: true,
    },
    {
      id: "dictionary",
      title: "Legal Dictionary",
      icon: "bi-book-fill",
      description:
        "Access a comprehensive dictionary of legal terms and concepts.",
      buttonText: "Browse Dictionary",
      route: "/dictionary",
    },
  ];

  // Popular legal categories
  const popularCategories = [
    { name: "Criminal Law", path: "/chat", icon: "bi-shield-fill" },
    { name: "Property Law", path: "/chat", icon: "bi-house-fill" },
    { name: "Family Law", path: "/chat", icon: "bi-people-fill" },
    { name: "Cyber Law", path: "/chat", icon: "bi-laptop-fill" },
    { name: "Corporate Law", path: "/chat", icon: "bi-building-fill" },
    { name: "Civil Law", path: "/chat", icon: "bi-bank2" },
    { name: "Tax Law", path: "/chat", icon: "bi-cash-stack" },
    { name: "Labor Law", path: "/chat", icon: "bi-briefcase-fill" },
    { name: "Environmental Law", path: "/chat", icon: "bi-tree-fill" },
    { name: "Immigration Law", path: "/chat", icon: "bi-globe" },
    { name: "Intellectual Property", path: "/chat", icon: "bi-lightbulb-fill" },
    { name: "Constitutional Law", path: "/chat", icon: "bi-journal-text" },
  ];

  // Handle scroll events to update active indicators
  useEffect(() => {
    const handleFeatureScroll = () => {
      if (featuresRef.current) {
        const scrollLeft = featuresRef.current.scrollLeft;
        const cardWidth = 320 + 24; // card width + gap
        const index = Math.round(scrollLeft / cardWidth);
        setActiveFeatureIndex(Math.min(index, featureCards.length - 1));
      }
    };

    const handleCategoryScroll = () => {
      if (categoriesRef.current) {
        const scrollLeft = categoriesRef.current.scrollLeft;
        const cardWidth = 180 + 24; // card width + gap
        const index = Math.round(scrollLeft / cardWidth);
        setActiveCategoryIndex(Math.min(index, popularCategories.length - 1));
      }
    };

    const featuresElement = featuresRef.current;
    const categoriesElement = categoriesRef.current;

    if (featuresElement) {
      featuresElement.addEventListener("scroll", handleFeatureScroll);
    }

    if (categoriesElement) {
      categoriesElement.addEventListener("scroll", handleCategoryScroll);
    }

    return () => {
      if (featuresElement) {
        featuresElement.removeEventListener("scroll", handleFeatureScroll);
      }
      if (categoriesElement) {
        categoriesElement.removeEventListener("scroll", handleCategoryScroll);
      }
    };
  }, [featureCards.length, popularCategories.length]);

  // Auto-scroll functionality
  useEffect(() => {
    let featuresInterval;
    let categoriesInterval;

    if (autoScrollFeatures) {
      featuresInterval = setInterval(() => {
        if (featuresRef.current) {
          const nextIndex = (activeFeatureIndex + 1) % featureCards.length;
          scrollToIndex(featuresRef, nextIndex, "feature");
        }
      }, 4000);
    }

    if (autoScrollCategories) {
      categoriesInterval = setInterval(() => {
        if (categoriesRef.current) {
          const nextIndex =
            (activeCategoryIndex + 1) % popularCategories.length;
          scrollToIndex(categoriesRef, nextIndex, "category");
        }
      }, 3500);
    }

    return () => {
      clearInterval(featuresInterval);
      clearInterval(categoriesInterval);
    };
  }, [
    activeFeatureIndex,
    activeCategoryIndex,
    autoScrollFeatures,
    autoScrollCategories,
    featureCards.length,
    popularCategories.length,
  ]);

  const handleFeatureClick = (card) => {
    if (card.comingSoon) {
      alert(`${card.title} feature is coming soon!`);
    } else {
      navigate(card.route);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/chat?query=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Scroll handlers
  const scroll = (ref, direction) => {
    if (ref.current) {
      const cardWidth = ref === featuresRef ? 344 : 204; // card width + gap
      const scrollAmount = direction === "left" ? -cardWidth : cardWidth;
      ref.current.scrollBy({ left: scrollAmount, behavior: "smooth" });

      // Pause auto-scroll when manually scrolling
      if (ref === featuresRef) {
        setAutoScrollFeatures(false);
        setTimeout(() => setAutoScrollFeatures(true), 8000);
      } else {
        setAutoScrollCategories(false);
        setTimeout(() => setAutoScrollCategories(true), 8000);
      }
    }
  };

  // Scroll to specific index
  const scrollToIndex = (ref, index, itemType) => {
    if (ref.current) {
      const cardWidth = itemType === "feature" ? 344 : 204; // card width + gap
      ref.current.scrollTo({
        left: index * cardWidth,
        behavior: "smooth",
      });
    }
  };

  // Pause auto-scroll on mouse enter
  const handleMouseEnter = (section) => {
    if (section === "features") {
      setAutoScrollFeatures(false);
    } else {
      setAutoScrollCategories(false);
    }
  };

  // Resume auto-scroll on mouse leave
  const handleMouseLeave = (section) => {
    if (section === "features") {
      setAutoScrollFeatures(true);
    } else {
      setAutoScrollCategories(true);
    }
  };

  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="hero-split-container">
          <div className="hero-content-left">
            <h1>Lawzo</h1>
            <h2>Your AI Legal Assistant</h2>
            <p>Get reliable legal guidance powered by advanced AI technology</p>

            <form onSubmit={handleSearch} className="search-form">
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Ask a legal question..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <button type="submit" className="search-button">
                  <i className="bi bi-search"></i>
                </button>
              </div>
            </form>
          </div>
          <div className="hero-content-right">
            <img 
              src="/images/hero-illustration.svg" 
              alt="Legal AI Assistant Illustration" 
              className="legal-hero-image" 
            />
          </div>
        </div>
      </div>

      <div id="services" className="features-section">
        <h3>Our Legal Services</h3>
        <div className="scroll-container">
          <button
            className="scroll-button left"
            onClick={() => scroll(featuresRef, "left")}
            aria-label="Scroll left"
          >
            <i className="bi bi-chevron-left"></i>
          </button>
          <div
            className="feature-cards"
            ref={featuresRef}
            onMouseEnter={() => handleMouseEnter("features")}
            onMouseLeave={() => handleMouseLeave("features")}
          >
            {featureCards.map((card) => (
              <div
                key={card.id}
                className={`feature-card ${
                  card.comingSoon ? "coming-soon" : ""
                } ${card.highlight ? "highlight" : ""}`}
                onClick={() => handleFeatureClick(card)}
              >
                <div className="card-icon">
                  <i className={`bi ${card.icon}`}></i>
                </div>
                <h4>{card.title}</h4>
                <p>{card.description}</p>
                <button
                  className={`card-button ${
                    card.comingSoon ? "disabled" : ""
                  } ${card.highlight ? "highlight-btn" : ""}`}
                >
                  {card.buttonText}
                  {card.comingSoon && <span className="soon-badge">Soon</span>}
                </button>
              </div>
            ))}
          </div>
          <button
            className="scroll-button right"
            onClick={() => scroll(featuresRef, "right")}
            aria-label="Scroll right"
          >
            <i className="bi bi-chevron-right"></i>
          </button>

          <div className="scroll-indicator">
            {featureCards.map((_, index) => (
              <div
                key={index}
                className={`indicator-dot ${
                  index === activeFeatureIndex ? "active" : ""
                }`}
                onClick={() => scrollToIndex(featuresRef, index, "feature")}
              />
            ))}
          </div>
        </div>
      </div>

      <div id="category" className="categories-section">
        <h3>Popular Legal Categories</h3>
        <div className="scroll-container">
          <button
            className="scroll-button left"
            onClick={() => scroll(categoriesRef, "left")}
            aria-label="Scroll left"
          >
            <i className="bi bi-chevron-left"></i>
          </button>
          <div
            className="category-cards"
            ref={categoriesRef}
            onMouseEnter={() => handleMouseEnter("categories")}
            onMouseLeave={() => handleMouseLeave("categories")}
          >
            {popularCategories.map((category, index) => (
              <div
                key={index}
                className="category-card"
                onClick={() => navigate(category.path)}
              >
                <i className={`bi ${category.icon}`}></i>
                <span>{category.name}</span>
              </div>
            ))}
          </div>
          <button
            className="scroll-button right"
            onClick={() => scroll(categoriesRef, "right")}
            aria-label="Scroll right"
          >
            <i className="bi bi-chevron-right"></i>
          </button>

          <div className="scroll-indicator">
            {popularCategories.map((_, index) => (
              <div
                key={index}
                className={`indicator-dot ${
                  index === activeCategoryIndex ? "active" : ""
                }`}
                onClick={() => scrollToIndex(categoriesRef, index, "category")}
              />
            ))}
          </div>
        </div>
      </div>

      <div id="why-us" className="benefits-section">
        <h3>Why Choose Lawzo?</h3>
        <div className="benefits-grid">
          <div className="benefit-item">
            <i className="bi bi-shield-check"></i>
            <h4>Reliable Information</h4>
            <p>Backed by verified legal resources</p>
          </div>
          <div className="benefit-item">
            <i className="bi bi-lightning-charge"></i>
            <h4>Quick Answers</h4>
            <p>Get instant responses to your questions</p>
          </div>
          <div className="benefit-item">
            <i className="bi bi-translate"></i>
            <h4>Multi-language Support</h4>
            <p>Available in English, Hindi, and Marathi</p>
          </div>
          <div className="benefit-item">
            <i className="bi bi-lock"></i>
            <h4>Secure & Confidential</h4>
            <p>Your information is protected and private</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
