import { useState, useEffect } from 'react';
import ImageUploader from '../components/ImageUploader';
import PDFGenerator from '../components/PDFGenerator';
import Layout from '../components/Layout';

export default function ImageToPdf() {
  const [images, setImages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleImagesSelected = (newImages) => {
    setImages((prevImages) => [...prevImages, ...newImages]);
  };

  const removeImage = (index) => {
    setImages((prevImages) => {
      const updatedImages = [...prevImages];
      // Only revoke the URL if we're removing the image completely
      URL.revokeObjectURL(updatedImages[index].preview);
      updatedImages.splice(index, 1);
      return updatedImages;
    });
  };

  const reorderImages = (fromIndex, toIndex) => {
    setImages((prevImages) => {
      const updatedImages = [...prevImages];
      // Just move the image object without revoking/recreating URLs
      const [movedImage] = updatedImages.splice(fromIndex, 1);
      updatedImages.splice(toIndex, 0, movedImage);
      return updatedImages;
    });
  };

  const moveImageUp = (index) => {
    if (index > 0) {
      reorderImages(index, index - 1);
    }
  };

  const moveImageDown = (index) => {
    if (index < images.length - 1) {
      reorderImages(index, index + 1);
    }
  };

  const clearAllImages = () => {
    // Revoke all object URLs to prevent memory leaks
    images.forEach(image => {
      if (image && image.preview) {
        URL.revokeObjectURL(image.preview);
      }
    });
    setImages([]);
  };

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      images.forEach(image => {
        if (image && image.preview) {
          URL.revokeObjectURL(image.preview);
        }
      });
    };
  }, [images]);

  return (
    <Layout
      title="Image to PDF Converter - High Quality"
      description="Convert your images to PDF without losing quality"
    >
      <div className="card">
        <h2>Upload Images</h2>
        <p>Upload the images you want to convert to PDF. The original quality will be preserved.</p>
        <ImageUploader onImagesSelected={handleImagesSelected} />
        
        {images.length > 0 && (
          <>
            <div className="image-container">
              {images.map((image, index) => (
                <div key={image.id || `${image.name}-${index}`} className="image-preview">
                  <img src={image.preview} alt={`Preview ${index}`} />
                  <div className="image-controls">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        moveImageUp(index);
                      }}
                      disabled={index === 0}
                      className="btn-small"
                      title="Move Up"
                    >
                      ↑
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        moveImageDown(index);
                      }}
                      disabled={index === images.length - 1}
                      className="btn-small"
                      title="Move Down"
                    >
                      ↓
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(index);
                      }}
                      className="btn-small btn-danger"
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                  <span className="image-name">{image.name}</span>
                </div>
              ))}
            </div>
            
            <div className="actions">
              <button onClick={clearAllImages} className="btn btn-secondary">
                Clear All Images
              </button>
            </div>
          </>
        )}
      </div>

      <PDFGenerator 
        images={images} 
        onGenerateStart={() => setIsGenerating(true)} 
        onGenerateEnd={() => setIsGenerating(false)} 
      />
    </Layout>
  );
} 