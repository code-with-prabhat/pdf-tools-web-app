import { useState, useRef, useEffect } from 'react';

const ImageUploader = ({ onImagesSelected }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files) => {
    const validImageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (validImageFiles.length > 0) {
      const fileObjects = validImageFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        name: file.name,
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }));
      
      onImagesSelected(fileObjects);
      
      // Reset file input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const openFileDialog = () => {
    fileInputRef.current.click();
  };

  return (
    <div 
      className={`dropzone ${isDragging ? 'active' : ''}`}
      onClick={openFileDialog}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input 
        type="file" 
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
        multiple
        accept="image/*"
      />
      <div>
        <p>Drop images here or click to browse</p>
        <p className="small">Supported formats: JPG, PNG, GIF, WebP, etc.</p>
      </div>
    </div>
  );
};

export default ImageUploader; 