import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../styles/DocumentAnalysis.css';

const DocumentAnalysis = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  
  // Document types
  const documentTypes = [
    { value: 'contract', label: 'Contract' },
    { value: 'will', label: 'Will' },
    { value: 'lease', label: 'Lease Agreement' },
    { value: 'affidavit', label: 'Affidavit' },
    { value: 'other', label: 'Other Legal Document' }
  ];
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
        setUploadError('Only PDF files are supported.');
        setFile(null);
        return;
      }
      
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setUploadError('File size cannot exceed 10MB.');
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setUploadError('');
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setUploadError('Please select a file to upload.');
      return;
    }
    
    if (!documentType) {
      setUploadError('Please select a document type.');
      return;
    }
    
    // Ensure user is authenticated
    if (!currentUser) {
      setUploadError('Authentication required. Please login again.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    
    setIsUploading(true);
    setUploadError('');
    
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('document_type', documentType);
      
      // Use the API service to upload the document
      const result = await api.uploadDocument(formData);
      setAnalysisResult(result);
    } catch (error) {
      console.error('Upload error:', error);
      
      if (error.response) {
        // Handle different error status codes
        if (error.response.status === 401) {
          setUploadError('Authentication expired. Please login again.');
          setTimeout(() => navigate('/login'), 2000);
        } else if (error.response.data && error.response.data.detail) {
          setUploadError(error.response.data.detail);
        } else {
          setUploadError(`Error (${error.response.status}): Failed to upload document.`);
        }
      } else if (error.message) {
        setUploadError(error.message);
      } else {
        setUploadError('Failed to upload and analyze document. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };
  
  const resetAnalysis = () => {
    setFile(null);
    setDocumentType('');
    setAnalysisResult(null);
    setUploadError('');
    // Reset file input
    document.getElementById('file-upload').value = '';
  };
  
  return (
    <div className="document-analysis-container">
      <div className="document-analysis-header">
        <h1>Document <span style={{ fontWeight: 400 }}>Analysis</span></h1>
        <p>Upload legal documents for AI-powered analysis and insights.</p>
      </div>
      
      {!analysisResult ? (
        <div className="upload-section">
          <div className="upload-container">
            <form onSubmit={handleSubmit} className="upload-form">
              <div className="file-upload-area">
                <label htmlFor="file-upload" className="file-label">
                  <div className="file-icon">
                    <i className="bi bi-file-earmark-text"></i>
                  </div>
                  <div className="file-text">
                    {file ? file.name : 'Drag and drop your PDF here or click to browse'}
                  </div>
                </label>
                <input 
                  type="file" 
                  id="file-upload" 
                  accept=".pdf" 
                  onChange={handleFileChange} 
                  className="file-input"
                />
              </div>
              
              <div className="document-type-selection">
                <label htmlFor="document-type">Document Type:</label>
                <select 
                  id="document-type" 
                  value={documentType} 
                  onChange={(e) => setDocumentType(e.target.value)}
                  required
                >
                  <option value="">Select document type</option>
                  {documentTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              {uploadError && <div className="error-message">{uploadError}</div>}
              
              <div className="upload-actions">
                <button 
                  type="submit" 
                  className="upload-button" 
                  disabled={isUploading || !file || !documentType}
                >
                  {isUploading ? (
                    <>
                      <i className="bi bi-arrow-repeat spinning"></i> 
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-upload"></i> 
                      Upload & Analyze
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
          
          <div className="features-section">
            <h3>Features</h3>
            <ul className="features-list">
              <li><i className="bi bi-check-circle-fill"></i> Document summarization</li>
              <li><i className="bi bi-check-circle-fill"></i> Key points extraction</li>
              <li><i className="bi bi-check-circle-fill"></i> Legal suggestions</li>
              <li><i className="bi bi-check-circle-fill"></i> Secure document processing</li>
            </ul>
            <div className="supported-docs">
              <h4>Supported Document Types</h4>
              <div className="doc-types">
                {documentTypes.map(type => (
                  <span key={type.value} className="doc-type">{type.label}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="analysis-results">
          <div className="document-info">
            <div className="document-name">
              <i className="bi bi-file-earmark-text"></i>
              <h3>{analysisResult.document_name}</h3>
            </div>
            
            <button className="new-analysis-btn" onClick={resetAnalysis}>
              <i className="bi bi-arrow-counterclockwise"></i> New Analysis
            </button>
          </div>
          
          <div className="results-grid">
            <div className="result-card summary-card">
              <h3><i className="bi bi-journal-text"></i> Document Summary</h3>
              <div className="card-content">
                <p>{analysisResult.summary}</p>
              </div>
            </div>
            
            <div className="result-card key-points-card">
              <h3><i className="bi bi-list-check"></i> Key Points</h3>
              <div className="card-content">
                <ul className="key-points-list">
                  {analysisResult.key_points.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="result-card suggestions-card">
              <h3><i className="bi bi-lightbulb"></i> Legal Suggestions</h3>
              <div className="card-content">
                <ul className="suggestions-list">
                  {analysisResult.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentAnalysis; 