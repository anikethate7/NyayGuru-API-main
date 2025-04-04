import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/LegalDictionary.css';

const LegalDictionary = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredTerms, setFilteredTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Sample legal terms - in a real implementation, these would come from an API
  const legalTerms = [
    {
      id: 1,
      term: 'Affidavit',
      definition: 'A written statement confirmed by oath or affirmation, for use as evidence in court.',
      category: 'general',
      jurisdiction: 'All India',
    },
    {
      id: 2,
      term: 'Bail',
      definition: 'Security given for the release of a criminal defendant or witness from legal custody to secure their appearance on the day and time appointed.',
      category: 'criminal',
      jurisdiction: 'All India',
    },
    {
      id: 3,
      term: 'Caveat',
      definition: 'A notice given by a person, informing the court that another person might file a lawsuit or application against them and that the court should give the person filing the caveat a fair hearing before deciding the matter.',
      category: 'civil',
      jurisdiction: 'All India',
    },
    {
      id: 4,
      term: 'Decree',
      definition: 'The formal expression of an adjudication which conclusively determines the rights of the parties with regard to all or any of the matters in controversy in the suit.',
      category: 'civil',
      jurisdiction: 'All India',
    },
    {
      id: 5,
      term: 'Ex Parte',
      definition: 'A legal proceeding brought by one person in the absence of another, without representation or notification of the other parties.',
      category: 'general',
      jurisdiction: 'All India',
    },
    {
      id: 6,
      term: 'FIR',
      definition: 'First Information Report. A document prepared by police when they receive information about the commission of a cognizable offence.',
      category: 'criminal',
      jurisdiction: 'All India',
    },
    {
      id: 7,
      term: 'Habeas Corpus',
      definition: 'A writ requiring a person under arrest to be brought before a judge or into court, especially to secure their release unless lawful grounds are shown for their detention.',
      category: 'constitutional',
      jurisdiction: 'All India',
    },
    {
      id: 8,
      term: 'Injunction',
      definition: 'A judicial order restraining a person from beginning or continuing an action threatening or invading the legal right of another.',
      category: 'civil',
      jurisdiction: 'All India',
    },
    {
      id: 9,
      term: 'Jurisdiction',
      definition: 'The official power to make legal decisions and judgments; the territory or sphere of activity over which the legal authority of a court or other institution extends.',
      category: 'general',
      jurisdiction: 'All India',
    },
    {
      id: 10,
      term: 'Lok Adalat',
      definition: 'A system of alternative dispute resolution developed in India. These are tribunals that settle disputes through conciliation and compromise.',
      category: 'alternative',
      jurisdiction: 'All India',
    },
  ];

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'general', name: 'General Legal Terms' },
    { id: 'criminal', name: 'Criminal Law' },
    { id: 'civil', name: 'Civil Law' },
    { id: 'constitutional', name: 'Constitutional Law' },
    { id: 'alternative', name: 'Alternative Dispute Resolution' },
    { id: 'property', name: 'Property Law' },
    { id: 'family', name: 'Family Law' },
  ];

  useEffect(() => {
    // Simulate API fetch delay
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    // Filter terms based on search and category
    let filtered = [...legalTerms];
    
    if (searchTerm) {
      filtered = filtered.filter(
        term => term.term.toLowerCase().includes(searchTerm.toLowerCase()) || 
                term.definition.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(term => term.category === selectedCategory);
    }
    
    setFilteredTerms(filtered);
  }, [searchTerm, selectedCategory]);

  const handleSearch = (e) => {
    e.preventDefault();
    // Filter terms based on search
    let filtered = [...legalTerms];
    if (searchTerm) {
      filtered = filtered.filter(
        term => term.term.toLowerCase().includes(searchTerm.toLowerCase()) || 
                term.definition.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(term => term.category === selectedCategory);
    }
    setFilteredTerms(filtered);
  };

  return (
    <div className="legal-dictionary-container">
      <div className="legal-dictionary-header">
        <h1>Legal <span style={{ fontWeight: 400 }}>Dictionary</span> & Glossary</h1>
        <p>Explore legal terms and definitions in Indian law</p>
        
        <form onSubmit={handleSearch} className="search-box">
          <input
            type="text"
            placeholder="Search legal terms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit">
            <i className="bi bi-search"></i> Search
          </button>
        </form>
      </div>
      
      <div className="legal-terms-container">
        <h2>Browse Legal Terms</h2>
        
        {loading ? (
          <div className="loading-spinner">
            <i className="bi bi-arrow-repeat spinning"></i>
            <p>Loading legal terms...</p>
          </div>
        ) : filteredTerms.length > 0 ? (
          <div className="terms-grid">
            {filteredTerms.map(term => (
              <div key={term.id} className="term-card">
                <h3>{term.term}</h3>
                <p>{term.definition}</p>
                <div className="term-footer">
                  <span className="term-category">{term.category}</span>
                  <span className="term-jurisdiction">{term.jurisdiction}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-results">
            <i className="bi bi-file-earmark-x"></i>
            <p>No legal terms found matching your criteria.</p>
            <button onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
            }}>
              Reset Filters
            </button>
          </div>
        )}
      </div>
      
      <div className="category-section">
        <h3>Filter by Category</h3>
        <div className="category-filter">
          {categories.map(category => (
            <button
              key={category.id}
              className={selectedCategory === category.id ? 'active' : ''}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
      
      <div className="dictionary-footer">
        <p>Note: This dictionary provides general information and is not legal advice.</p>
        <Link to="/chat" className="ask-question-btn">
          Ask a specific legal question <i className="bi bi-arrow-right"></i>
        </Link>
      </div>
    </div>
  );
};

export default LegalDictionary; 