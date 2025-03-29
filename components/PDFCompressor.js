import { useState, useCallback, useRef } from 'react';
import { jsPDF } from 'jspdf';

const PDFCompressor = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [compressedPdf, setCompressedPdf] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionLevel, setCompressionLevel] = useState(0.7); // Medium compression by default
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setOriginalSize(file.size);
      setCompressedPdf(null);
      setProgress(0);
    } else {
      alert("Please select a valid PDF file");
      fileInputRef.current.value = "";
    }
  };

  const compressPDF = useCallback(async () => {
    if (!pdfFile) return;

    try {
      setIsCompressing(true);
      setProgress(0);

      // Read the selected PDF file
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        setProgress(20);
        const pdfData = new Uint8Array(event.target.result);
        
        // Create a document proxy
        const pdfDoc = await window.pdfjsLib.getDocument({ data: pdfData }).promise;
        setProgress(30);
        
        const totalPages = pdfDoc.numPages;
        
        // Create new PDF document
        const newPdf = new jsPDF();
        
        for (let i = 1; i <= totalPages; i++) {
          // Update progress based on page processing
          setProgress(30 + Math.floor((i / totalPages) * 50));
          
          const page = await pdfDoc.getPage(i);
          const viewport = page.getViewport({ scale: compressionLevel });
          
          // Create a canvas to render the page
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          // Render the page content on the canvas
          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise;
          
          // Convert the canvas to an image
          const imgData = canvas.toDataURL('image/jpeg', compressionLevel);
          
          // Add a new page for each page (except the first)
          if (i > 1) {
            newPdf.addPage();
          }
          
          // Add the compressed image to the PDF
          newPdf.addImage(
            imgData, 
            'JPEG', 
            0, 0, 
            newPdf.internal.pageSize.getWidth(), 
            newPdf.internal.pageSize.getHeight()
          );
        }
        
        setProgress(90);
        
        // Generate the compressed PDF
        const compressedPdfBlob = new Blob([newPdf.output('arraybuffer')], { type: 'application/pdf' });
        setCompressedPdf(URL.createObjectURL(compressedPdfBlob));
        setCompressedSize(compressedPdfBlob.size);
        setProgress(100);
      };
      
      reader.readAsArrayBuffer(pdfFile);
      
    } catch (error) {
      console.error("Error compressing PDF:", error);
      alert("An error occurred while compressing the PDF");
    } finally {
      setIsCompressing(false);
    }
  }, [pdfFile, compressionLevel]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        setPdfFile(file);
        setOriginalSize(file.size);
        setCompressedPdf(null);
        setProgress(0);
      } else {
        alert("Please select a valid PDF file");
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const calculateSavings = () => {
    if (originalSize === 0 || compressedSize === 0) return 0;
    const savings = ((originalSize - compressedSize) / originalSize) * 100;
    return savings.toFixed(1);
  };

  return (
    <div className="card">
      <h2>Compress PDF</h2>
      <p>Reduce PDF file size while maintaining reasonable quality</p>
      
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
          style={{ display: 'none' }}
        />
        
        {!pdfFile ? (
          <div>
            <p>Drop your PDF here or click to browse</p>
            <p className="small">Max file size: 10MB</p>
          </div>
        ) : (
          <div className="file-info">
            <p><strong>File:</strong> {pdfFile.name}</p>
            <p><strong>Size:</strong> {formatFileSize(pdfFile.size)}</p>
            <button 
              className="btn btn-secondary"
              onClick={(e) => {
                e.stopPropagation();
                setPdfFile(null);
                setCompressedPdf(null);
                fileInputRef.current.value = "";
              }}
            >
              Remove File
            </button>
          </div>
        )}
      </div>
      
      {pdfFile && !isCompressing && !compressedPdf && (
        <div className="form-group">
          <label className="form-label" htmlFor="compression-level">
            Compression Level: {Math.round((1 - compressionLevel) * 100)}%
          </label>
          <input
            id="compression-level"
            type="range"
            min="0.3"
            max="0.9"
            step="0.1"
            value={compressionLevel}
            onChange={(e) => setCompressionLevel(parseFloat(e.target.value))}
            className="form-control"
          />
          <div className="range-labels">
            <span>High Compression</span>
            <span>High Quality</span>
          </div>
        </div>
      )}
      
      {pdfFile && !compressedPdf && (
        <button 
          className="btn"
          onClick={compressPDF}
          disabled={isCompressing}
        >
          {isCompressing ? 'Compressing...' : 'Compress PDF'}
        </button>
      )}
      
      {isCompressing && (
        <div className="progress-container">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <p>Processing: {progress}%</p>
        </div>
      )}
      
      {compressedPdf && (
        <div className="result-container">
          <h3>Compression Complete!</h3>
          
          <div className="compression-stats">
            <div className="stat">
              <span>Original Size</span>
              <strong>{formatFileSize(originalSize)}</strong>
            </div>
            <div className="stat">
              <span>Compressed Size</span>
              <strong>{formatFileSize(compressedSize)}</strong>
            </div>
            <div className="stat">
              <span>Reduction</span>
              <strong>{calculateSavings()}%</strong>
            </div>
          </div>
          
          <div className="action-buttons">
            <a 
              href={compressedPdf} 
              download={`compressed_${pdfFile.name}`}
              className="btn"
            >
              Download Compressed PDF
            </a>
            <button 
              className="btn btn-secondary"
              onClick={() => {
                setPdfFile(null);
                setCompressedPdf(null);
                fileInputRef.current.value = "";
              }}
            >
              Compress Another PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFCompressor; 