import { useState, useRef, useEffect } from 'react';
import { jsPDF } from 'jspdf';

const PDFMerger = () => {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [mergedPdf, setMergedPdf] = useState(null);
  const [isMerging, setIsMerging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalSize, setTotalSize] = useState(0);
  const [mergedSize, setMergedSize] = useState(0);
  const [error, setError] = useState(null);
  const [pdfLibLoaded, setPdfLibLoaded] = useState(false);
  const fileInputRef = useRef(null);

  // Load pdf-lib dynamically
  useEffect(() => {
    const loadPdfLib = async () => {
      try {
        if (!window.PDFLib) {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js';
          script.async = true;
          script.onload = () => setPdfLibLoaded(true);
          document.body.appendChild(script);
        } else {
          setPdfLibLoaded(true);
        }
      } catch (err) {
        console.error("Error loading pdf-lib:", err);
        setError("Failed to load PDF processing library");
      }
    };
    
    loadPdfLib();
    
    // Cleanup
    return () => {
      const script = document.querySelector('script[src="https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js"]');
      if (script) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleFileChange = (e) => {
    try {
      const files = Array.from(e.target.files || []);
      const validFiles = files.filter(file => file.type === 'application/pdf');
      
      if (validFiles.length > 0) {
        // Create file objects with unique IDs and previews
        const newFiles = validFiles.map(file => ({
          file,
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          size: file.size,
        }));
        
        setPdfFiles(prev => [...prev, ...newFiles]);
        setTotalSize(prev => prev + newFiles.reduce((sum, fileObj) => sum + fileObj.size, 0));
        setMergedPdf(null);
        setError(null);
      } else if (files.length > 0) {
        setError("Please select valid PDF files");
      }
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Error handling file change:", err);
      setError("An error occurred while processing files");
    }
  };

  const removePdf = (id) => {
    try {
      setPdfFiles(prev => {
        const fileToRemove = prev.find(file => file.id === id);
        setTotalSize(prevSize => prevSize - (fileToRemove ? fileToRemove.size : 0));
        return prev.filter(file => file.id !== id);
      });
      setMergedPdf(null);
    } catch (err) {
      console.error("Error removing PDF:", err);
      setError("An error occurred while removing a file");
    }
  };

  const reorderPdfs = (fromIndex, toIndex) => {
    try {
      setPdfFiles(prev => {
        const result = [...prev];
        const [removed] = result.splice(fromIndex, 1);
        result.splice(toIndex, 0, removed);
        return result;
      });
      setMergedPdf(null);
    } catch (err) {
      console.error("Error reordering PDFs:", err);
      setError("An error occurred while reordering files");
    }
  };

  const movePdfUp = (index) => {
    if (index > 0) {
      reorderPdfs(index, index - 1);
    }
  };

  const movePdfDown = (index) => {
    if (index < pdfFiles.length - 1) {
      reorderPdfs(index, index + 1);
    }
  };

  const clearAllPdfs = () => {
    setPdfFiles([]);
    setTotalSize(0);
    setMergedPdf(null);
    setProgress(0);
    setError(null);
  };

  const mergePdfs = async () => {
    if (pdfFiles.length === 0) return;
    
    if (!pdfLibLoaded) {
      setError("PDF processing library not loaded yet. Please try again in a moment.");
      return;
    }
    
    try {
      setIsMerging(true);
      setProgress(0);
      setError(null);
      
      // Create a new PDF document
      const { PDFDocument } = window.PDFLib;
      const mergedPdf = await PDFDocument.create();
      
      // Process each PDF document
      for (let i = 0; i < pdfFiles.length; i++) {
        const fileObj = pdfFiles[i];
        setProgress(Math.floor((i / pdfFiles.length) * 90)); // 90% for processing
        
        try {
          // Read the file as an ArrayBuffer
          const arrayBuffer = await readFileAsArrayBuffer(fileObj.file);
          
          // Load the PDF document
          const pdfDoc = await PDFDocument.load(arrayBuffer, { 
            ignoreEncryption: true
          });
          
          // Get all pages from the document
          const pages = pdfDoc.getPages();
          
          // Copy each page to the merged PDF with original quality
          for (let j = 0; j < pages.length; j++) {
            // Copy the pages to maintain all content and formatting
            const [copiedPage] = await mergedPdf.copyPages(pdfDoc, [j]);
            mergedPdf.addPage(copiedPage);
          }
        } catch (error) {
          console.error(`Error processing PDF: ${fileObj.name}`, error);
          throw new Error(`Error processing ${fileObj.name}: ${error.message}`);
        }
      }
      
      // Save the merged PDF
      setProgress(95);
      const mergedPdfBytes = await mergedPdf.save();
      const mergedPdfBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      setMergedPdf(URL.createObjectURL(mergedPdfBlob));
      setMergedSize(mergedPdfBlob.size);
      setProgress(100);
      
    } catch (error) {
      console.error("Error merging PDFs:", error);
      setError(error.message || "An error occurred while merging PDFs");
    } finally {
      setIsMerging(false);
    }
  };
  
  const readFileAsArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files);
        const validFiles = files.filter(file => file.type === 'application/pdf');
        
        if (validFiles.length > 0) {
          const newFiles = validFiles.map(file => ({
            file,
            id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            size: file.size,
          }));
          
          setPdfFiles(prev => [...prev, ...newFiles]);
          setTotalSize(prev => prev + newFiles.reduce((sum, fileObj) => sum + fileObj.size, 0));
          setMergedPdf(null);
          setError(null);
        } else {
          setError("Please drop valid PDF files");
        }
      }
    } catch (err) {
      console.error("Error handling drop:", err);
      setError("An error occurred while processing dropped files");
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="card">
      <h2>Merge PDFs</h2>
      <p>Combine multiple PDF files into a single document</p>
      
      <div 
        className="dropzone"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          accept="application/pdf" 
          onChange={handleFileChange} 
          multiple
          style={{ display: 'none' }}
        />
        
        <div>
          <p>Drop your PDF files here or click to browse</p>
          <p className="small">You can select multiple PDF files</p>
        </div>
      </div>
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      
      {pdfFiles.length > 0 && (
        <div className="pdf-list">
          <h3>Files to Merge ({pdfFiles.length})</h3>
          
          <ul className="file-list">
            {pdfFiles.map((fileObj, index) => (
              <li key={fileObj.id} className="file-item">
                <div className="file-info">
                  <span className="file-number">{index + 1}</span>
                  <span className="file-name">{fileObj.name}</span>
                  <span className="file-size">{formatFileSize(fileObj.size)}</span>
                </div>
                <div className="file-actions">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      movePdfUp(index);
                    }}
                    disabled={index === 0 || isMerging}
                    className="btn-small"
                    title="Move Up"
                  >
                    ↑
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      movePdfDown(index);
                    }}
                    disabled={index === pdfFiles.length - 1 || isMerging}
                    className="btn-small"
                    title="Move Down"
                  >
                    ↓
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      removePdf(fileObj.id);
                    }}
                    disabled={isMerging}
                    className="btn-small btn-danger"
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
          
          <div className="total-size">
            <p>Total size: {formatFileSize(totalSize)}</p>
          </div>
          
          <div className="actions">
            <button 
              onClick={clearAllPdfs}
              className="btn btn-secondary"
              disabled={isMerging}
            >
              Clear All Files
            </button>
            
            <button 
              onClick={mergePdfs}
              className="btn"
              disabled={pdfFiles.length < 2 || isMerging || !pdfLibLoaded}
            >
              {isMerging ? 'Merging...' : 'Merge PDFs'}
            </button>
          </div>
        </div>
      )}
      
      {isMerging && (
        <div className="progress-container">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <p>Processing: {progress}%</p>
        </div>
      )}
      
      {mergedPdf && (
        <div className="result-container">
          <h3>Merge Complete!</h3>
          
          <div className="compression-stats">
            <div className="stat">
              <span>Total Input Size</span>
              <strong>{formatFileSize(totalSize)}</strong>
            </div>
            <div className="stat">
              <span>Output Size</span>
              <strong>{formatFileSize(mergedSize)}</strong>
            </div>
            <div className="stat">
              <span>Files Merged</span>
              <strong>{pdfFiles.length}</strong>
            </div>
          </div>
          
          <div className="action-buttons">
            <a 
              href={mergedPdf} 
              download="merged_document.pdf"
              className="btn"
            >
              Download Merged PDF
            </a>
            <button 
              className="btn btn-secondary"
              onClick={clearAllPdfs}
            >
              Merge New Files
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFMerger; 