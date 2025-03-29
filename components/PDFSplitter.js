import { useState, useRef, useEffect } from 'react';
import { jsPDF } from 'jspdf';

const PDFSplitter = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [splitPdf, setSplitPdf] = useState(null);
  const [isSplitting, setIsSplitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [originalSize, setOriginalSize] = useState(0);
  const [splitSize, setSplitSize] = useState(0);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [pageRange, setPageRange] = useState('');
  const [fileName, setFileName] = useState('split_document');
  const [previewPages, setPreviewPages] = useState([]);
  const fileInputRef = useRef(null);
  const [pdfLibLoaded, setPdfLibLoaded] = useState(false);

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

  const handleFileChange = async (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      
      if (file.type !== 'application/pdf') {
        setError("Please select a valid PDF file");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      // Clean up previous file resources
      if (splitPdf) {
        URL.revokeObjectURL(splitPdf);
      }
      
      setPdfFile(file);
      setOriginalSize(file.size);
      setSplitPdf(null);
      setError(null);
      setPageRange('');
      
      // Create a filename without extension
      const baseName = file.name.toLowerCase().endsWith('.pdf') 
        ? file.name.slice(0, -4) // Remove .pdf extension
        : file.name;
      setFileName(`split_${baseName}`);
      
      // Load the PDF to get total pages and previews
      await loadPdfInfo(file);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Error handling file change:", err);
      setError("An error occurred while processing the file");
    }
  };

  const loadPdfInfo = async (file) => {
    try {
      setProgress(10);
      // Read file as array buffer
      const arrayBuffer = await readFileAsArrayBuffer(file);
      
      // Make sure PDF.js is available
      if (!window.pdfjsLib) {
        throw new Error("PDF.js is not loaded properly");
      }
      
      setProgress(30);
      // Load PDF document
      const pdfDoc = await window.pdfjsLib.getDocument(arrayBuffer).promise;
      const numPages = pdfDoc.numPages;
      setTotalPages(numPages);
      
      // Generate previews for the first few pages
      const previews = [];
      const previewCount = Math.min(3, numPages);
      
      for (let i = 1; i <= previewCount; i++) {
        setProgress(30 + Math.floor((i / previewCount) * 30));
        try {
          const page = await pdfDoc.getPage(i);
          const viewport = page.getViewport({ scale: 0.3 }); // Small scale for preview
          
          // Create canvas for preview
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          // Render page to canvas
          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise;
          
          // Get data URL from canvas
          const imgData = canvas.toDataURL('image/jpeg', 0.7);
          previews.push({
            pageNumber: i,
            image: imgData
          });
        } catch (error) {
          console.error(`Error generating preview for page ${i}:`, error);
        }
      }
      
      setPreviewPages(previews);
      setProgress(0);
    } catch (error) {
      console.error("Error loading PDF info:", error);
      setError("Failed to load PDF information");
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

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const file = e.dataTransfer.files?.[0];
      if (!file) return;
      
      if (file.type !== 'application/pdf') {
        setError("Please drop a valid PDF file");
        return;
      }
      
      // Clean up previous file resources
      if (splitPdf) {
        URL.revokeObjectURL(splitPdf);
      }
      
      setPdfFile(file);
      setOriginalSize(file.size);
      setSplitPdf(null);
      setError(null);
      setPageRange('');
      
      // Create a filename without extension
      const baseName = file.name.toLowerCase().endsWith('.pdf') 
        ? file.name.slice(0, -4) // Remove .pdf extension
        : file.name;
      setFileName(`split_${baseName}`);
      
      await loadPdfInfo(file);
    } catch (err) {
      console.error("Error handling drop:", err);
      setError("An error occurred while processing the dropped file");
    }
  };

  const validatePageRange = () => {
    if (!pageRange.trim()) {
      setError("Please enter a page range");
      return false;
    }
    
    // Split by comma and handle ranges with hyphens
    const parts = pageRange.split(',').map(part => part.trim());
    const selectedPages = [];
    
    for (const part of parts) {
      if (part.includes('-')) {
        // Handle range like "1-5"
        const [start, end] = part.split('-').map(num => parseInt(num));
        
        if (isNaN(start) || isNaN(end)) {
          setError(`Invalid range: ${part}`);
          return false;
        }
        
        if (start < 1 || end > totalPages || start > end) {
          setError(`Invalid range: ${part}. Pages must be between 1 and ${totalPages}`);
          return false;
        }
        
        for (let i = start; i <= end; i++) {
          selectedPages.push(i);
        }
      } else {
        // Handle individual pages like "1,3,5"
        const page = parseInt(part);
        
        if (isNaN(page)) {
          setError(`Invalid page number: ${part}`);
          return false;
        }
        
        if (page < 1 || page > totalPages) {
          setError(`Invalid page number: ${part}. Pages must be between 1 and ${totalPages}`);
          return false;
        }
        
        selectedPages.push(page);
      }
    }
    
    if (selectedPages.length === 0) {
      setError("No valid pages selected");
      return false;
    }
    
    return selectedPages;
  };

  const splitPDFDocument = async () => {
    const selectedPages = validatePageRange();
    if (!selectedPages || !pdfFile || !pdfLibLoaded) {
      if (!pdfLibLoaded) {
        setError("PDF library is still loading. Please try again in a moment.");
      }
      return;
    }
    
    try {
      setIsSplitting(true);
      setError(null);
      setProgress(0);
      
      // Read file as array buffer
      const arrayBuffer = await readFileAsArrayBuffer(pdfFile);
      setProgress(20);
      
      // Use PDF-lib to extract pages with high quality
      const { PDFDocument } = window.PDFLib;
      
      // Load the source PDF document
      const sourcePdfDoc = await PDFDocument.load(arrayBuffer, { 
        ignoreEncryption: true
      });
      setProgress(40);
      
      // Create a new PDF document for the extracted pages
      const targetPdfDoc = await PDFDocument.create();
      
      // Map page indices to zero-based for PDF-lib (PDF.js uses 1-based)
      const zeroBasedIndices = selectedPages.map(pageNum => pageNum - 1);
      
      // Copy selected pages to the new document
      for (let i = 0; i < zeroBasedIndices.length; i++) {
        const pageIndex = zeroBasedIndices[i];
        
        // Update progress
        setProgress(40 + Math.floor((i / zeroBasedIndices.length) * 50));
        
        // Copy page from source to target
        const [copiedPage] = await targetPdfDoc.copyPages(sourcePdfDoc, [pageIndex]);
        targetPdfDoc.addPage(copiedPage);
      }
      
      setProgress(95);
      
      // Save the new PDF with selected pages
      const extractedPdfBytes = await targetPdfDoc.save();
      const splitPdfBlob = new Blob([extractedPdfBytes], { type: 'application/pdf' });
      
      // Create URL for the new PDF
      setSplitPdf(URL.createObjectURL(splitPdfBlob));
      setSplitSize(splitPdfBlob.size);
      setProgress(100);
    } catch (error) {
      console.error("Error splitting PDF:", error);
      setError(error.message || "An error occurred while splitting the PDF");
    } finally {
      setIsSplitting(false);
    }
  };

  const clearPdf = () => {
    if (splitPdf) {
      URL.revokeObjectURL(splitPdf);
    }
    
    setPdfFile(null);
    setSplitPdf(null);
    setProgress(0);
    setOriginalSize(0);
    setSplitSize(0);
    setTotalPages(0);
    setPageRange('');
    setFileName('split_document');
    setPreviewPages([]);
    setError(null);
  };

  const handleChangeFile = () => {
    // Add a null check before trying to access click()
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderPageRangeHelp = () => {
    return (
      <div className="page-range-help">
        <h4>Page Range Format:</h4>
        <ul>
          <li><strong>Individual pages:</strong> 1,3,5,7</li>
          <li><strong>Range of pages:</strong> 1-5</li>
          <li><strong>Combined:</strong> 1-3,5,7-9</li>
        </ul>
      </div>
    );
  };

  // Helper to ensure filename has .pdf extension for download
  const getDownloadFilename = () => {
    const name = fileName.trim();
    if (name.toLowerCase().endsWith('.pdf')) {
      return name;
    }
    return `${name}.pdf`;
  };

  return (
    <div className="card">
      <h2>Split PDF</h2>
      <p>Extract specific pages from a PDF document</p>
      
      {/* File input outside conditional rendering to ensure it's always available */}
      <input 
        type="file" 
        ref={fileInputRef}
        accept="application/pdf" 
        onChange={handleFileChange} 
        style={{ display: 'none' }}
      />
      
      {!pdfFile ? (
        <div 
          className="dropzone"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div>
            <p>Drop your PDF file here or click to browse</p>
            <p className="small">Select a single PDF file to split</p>
          </div>
        </div>
      ) : (
        <div className="pdf-split-container">
          <div className="file-info-container">
            <div className="file-info">
              <h3>File: {pdfFile.name}</h3>
              <p><strong>Size:</strong> {formatFileSize(originalSize)}</p>
              <p><strong>Pages:</strong> {totalPages}</p>
            </div>
            
            <button 
              onClick={handleChangeFile}
              className="btn btn-secondary"
              disabled={isSplitting}
            >
              Change File
            </button>
          </div>
          
          {previewPages.length > 0 && (
            <div className="preview-container">
              <h4>Preview:</h4>
              <div className="page-previews">
                {previewPages.map(preview => (
                  <div key={preview.pageNumber} className="page-preview">
                    <img src={preview.image} alt={`Page ${preview.pageNumber}`} />
                    <span className="page-number">Page {preview.pageNumber}</span>
                  </div>
                ))}
                {totalPages > previewPages.length && (
                  <div className="more-pages">
                    +{totalPages - previewPages.length} more pages
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="form-group">
            <label className="form-label" htmlFor="file-name">Output File Name</label>
            <input
              id="file-name"
              type="text"
              className="form-control"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              disabled={isSplitting}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="page-range">
              Page Range (e.g., 1,3,5-7)
            </label>
            <input
              id="page-range"
              type="text"
              className="form-control"
              value={pageRange}
              onChange={(e) => setPageRange(e.target.value)}
              placeholder={`1-${totalPages} (all pages)`}
              disabled={isSplitting}
            />
            {renderPageRangeHelp()}
          </div>
          
          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}
          
          <button 
            className="btn"
            onClick={splitPDFDocument}
            disabled={isSplitting || !pageRange.trim() || !pdfLibLoaded}
          >
            {isSplitting ? 'Processing...' : 'Extract Pages'}
          </button>
        </div>
      )}
      
      {isSplitting && (
        <div className="progress-container">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <p>Processing: {progress}%</p>
        </div>
      )}
      
      {splitPdf && (
        <div className="result-container">
          <h3>Split Complete!</h3>
          
          <div className="compression-stats">
            <div className="stat">
              <span>Original Size</span>
              <strong>{formatFileSize(originalSize)}</strong>
            </div>
            <div className="stat">
              <span>Output Size</span>
              <strong>{formatFileSize(splitSize)}</strong>
            </div>
            <div className="stat">
              <span>Pages Selected</span>
              <strong>{validatePageRange()?.length || 0}</strong>
            </div>
          </div>
          
          <div className="action-buttons">
            <a 
              href={splitPdf} 
              download={getDownloadFilename()}
              className="btn"
            >
              Download PDF
            </a>
            <button 
              className="btn btn-secondary"
              onClick={clearPdf}
            >
              Split Another PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFSplitter; 