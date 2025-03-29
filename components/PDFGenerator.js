import { useState, useCallback, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const PDFGenerator = ({ images, onGenerateStart, onGenerateEnd }) => {
  const [pdfName, setPdfName] = useState('image-to-pdf');
  const [pageSize, setPageSize] = useState('a4');
  const [orientation, setOrientation] = useState('portrait');
  const [imageQuality, setImageQuality] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [preloadedImages, setPreloadedImages] = useState({});
  const [isPreloading, setIsPreloading] = useState(false);

  // Preload images when the images array changes
  useEffect(() => {
    const preloadImage = async (image) => {
      if (!image || !image.preview) return null;
      
      try {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          
          const timeoutId = setTimeout(() => {
            reject(new Error('Image loading timed out'));
          }, 10000);
          
          img.onload = () => {
            clearTimeout(timeoutId);
            // Create a canvas to capture the image data immediately
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, img.width, img.height);
            
            // Get the image data immediately and store it
            const imageData = canvas.toDataURL('image/jpeg', imageQuality);
            resolve({
              width: img.width,
              height: img.height,
              data: imageData
            });
          };
          
          img.onerror = () => {
            clearTimeout(timeoutId);
            console.error(`Failed to preload image: ${image.name}`);
            reject(new Error(`Failed to preload image: ${image.name}`));
          };
          
          // Set source to trigger loading
          img.src = image.preview;
        });
      } catch (error) {
        console.error(`Error preloading image: ${image.name}`, error);
        return null;
      }
    };
    
    // Preload all images
    const preloadAllImages = async () => {
      if (images.length === 0) {
        setPreloadedImages({});
        return;
      }
      
      setIsPreloading(true);
      
      // Create a map of current images by their IDs
      const currentImageMap = {};
      images.forEach(img => {
        if (img.id) {
          currentImageMap[img.id] = img;
        }
      });
      
      // Check which images we already have preloaded
      const cachedImages = {};
      const imagesToLoad = [];
      
      images.forEach((image, index) => {
        let foundCached = false;
        
        // If the image has an ID, check if we already preloaded it
        if (image.id) {
          // Look through existing preloaded images to find a match by ID
          Object.entries(preloadedImages).forEach(([key, preloadedData]) => {
            if (!foundCached && preloadedData.id === image.id) {
              cachedImages[image.id] = preloadedData;
              foundCached = true;
            }
          });
        }
        
        if (!foundCached) {
          imagesToLoad.push({ image, index });
        }
      });
      
      // Preload new images
      const newlyLoadedImages = {};
      for (const { image, index } of imagesToLoad) {
        try {
          const preloadedData = await preloadImage(image);
          if (preloadedData && image.id) {
            newlyLoadedImages[image.id] = {
              ...preloadedData,
              id: image.id
            };
            
            // Update the preloaded images as we go to show progress
            setPreloadedImages({
              ...cachedImages,
              ...newlyLoadedImages
            });
          }
        } catch (error) {
          console.error(`Failed to preload image ${image.name}:`, error);
        }
      }
      
      // Combine cached and newly loaded images
      const finalPreloadedImages = {
        ...cachedImages,
        ...newlyLoadedImages
      };
      
      setPreloadedImages(finalPreloadedImages);
      setIsPreloading(false);
    };
    
    preloadAllImages();
    
  }, [images, imageQuality]);

  // Define page dimensions based on selected size
  const getPageDimensions = () => {
    const sizes = {
      a4: { width: 210, height: 297 },
      a3: { width: 297, height: 420 },
      letter: { width: 215.9, height: 279.4 },
      legal: { width: 215.9, height: 355.6 }
    };
    
    const dim = sizes[pageSize] || sizes.a4;
    
    return orientation === 'landscape' 
      ? { width: dim.height, height: dim.width } 
      : dim;
  };

  const generatePDF = useCallback(async () => {
    if (images.length === 0) return;
    setError(null);
    
    try {
      setIsGenerating(true);
      onGenerateStart?.();
      
      const pageDim = getPageDimensions();
      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: pageSize
      });
      
      // Margin in mm
      const margin = 10;
      const usableWidth = pageDim.width - (margin * 2);
      const usableHeight = pageDim.height - (margin * 2);
      
      for (let i = 0; i < images.length; i++) {
        // Add new page for each image except the first one
        if (i > 0) {
          pdf.addPage(pageSize, orientation);
        }
        
        const currentImage = images[i];
        
        // Check if we have a preloaded image for this image ID
        if (!currentImage.id || !preloadedImages[currentImage.id]) {
          throw new Error(`Image at position ${i+1} is not available. Please try reuploading the image.`);
        }
        
        const preloadedImage = preloadedImages[currentImage.id];
        
        // Calculate image dimensions to fit within page while preserving aspect ratio
        const imgAspectRatio = preloadedImage.width / preloadedImage.height;
        let imgWidth = usableWidth;
        let imgHeight = imgWidth / imgAspectRatio;
        
        if (imgHeight > usableHeight) {
          imgHeight = usableHeight;
          imgWidth = imgHeight * imgAspectRatio;
        }
        
        // Center image on page
        const xPos = margin + (usableWidth - imgWidth) / 2;
        const yPos = margin + (usableHeight - imgHeight) / 2;
        
        // Add the preloaded image to the PDF
        try {
          pdf.addImage(
            preloadedImage.data, 
            'JPEG', 
            xPos, 
            yPos, 
            imgWidth, 
            imgHeight
          );
        } catch (imgError) {
          console.error("Error adding image to PDF:", imgError);
          throw new Error(`Error adding image ${i+1} to PDF: ${imgError.message}`);
        }
      }
      
      // Save PDF
      pdf.save(`${pdfName || 'image-to-pdf'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError(error.message || "Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
      onGenerateEnd?.();
    }
  }, [images, preloadedImages, pageSize, orientation, imageQuality, pdfName, onGenerateStart, onGenerateEnd, getPageDimensions]);

  // Calculate preloading progress
  const preloadedCount = Object.keys(preloadedImages).length;
  const totalImagesToProcess = images.length;
  const preloadProgress = Math.round((preloadedCount / Math.max(1, totalImagesToProcess)) * 100);
  
  // Check if all images are preloaded
  const allImagesPreloaded = images.every(img => img.id && preloadedImages[img.id]);

  return (
    <div className="card">
      <h2>PDF Options</h2>
      
      <div className="form-group">
        <label className="form-label" htmlFor="pdf-name">PDF Name</label>
        <input
          id="pdf-name"
          type="text"
          className="form-control"
          value={pdfName}
          onChange={(e) => setPdfName(e.target.value)}
          placeholder="Enter PDF name"
        />
      </div>
      
      <div className="form-group">
        <label className="form-label" htmlFor="page-size">Page Size</label>
        <select
          id="page-size"
          className="form-control"
          value={pageSize}
          onChange={(e) => setPageSize(e.target.value)}
        >
          <option value="a4">A4</option>
          <option value="a3">A3</option>
          <option value="letter">Letter</option>
          <option value="legal">Legal</option>
        </select>
      </div>
      
      <div className="form-group">
        <label className="form-label" htmlFor="orientation">Orientation</label>
        <select
          id="orientation"
          className="form-control"
          value={orientation}
          onChange={(e) => setOrientation(e.target.value)}
        >
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select>
      </div>
      
      <div className="form-group">
        <label className="form-label" htmlFor="image-quality">
          Image Quality: {Math.round(imageQuality * 100)}%
        </label>
        <input
          id="image-quality"
          type="range"
          min="0.6"
          max="1"
          step="0.05"
          value={imageQuality}
          onChange={(e) => setImageQuality(parseFloat(e.target.value))}
          className="form-control"
        />
      </div>
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      
      {images.length > 0 && isPreloading && (
        <div>
          <div className="progress-container">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${preloadProgress}%` }}></div>
            </div>
            <p className="preparing-text">Preparing images: {preloadedCount} of {totalImagesToProcess} ready ({preloadProgress}%)</p>
          </div>
        </div>
      )}
      
      <button
        className="btn"
        onClick={generatePDF}
        disabled={images.length === 0 || isGenerating || isPreloading || !allImagesPreloaded}
      >
        {isGenerating ? 'Generating...' : (
          isPreloading ? 
          'Preparing Images...' : 
          'Generate PDF'
        )}
      </button>
    </div>
  );
};

export default PDFGenerator; 