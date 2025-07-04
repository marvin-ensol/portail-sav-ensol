import { useState, useEffect } from "react";

export const useFileUpload = () => {
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<{ [key: number]: string }>({});

  // Clean up preview URLs when component unmounts
  useEffect(() => {
    return () => {
      Object.values(previewUrls).forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [previewUrls]);

  const isImageFile = (file: File) => {
    return file.type.startsWith('image/');
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const newFiles = Array.from(files);
    const startIndex = attachedFiles.length;
    
    // Create preview URLs for image files
    const newPreviewUrls: { [key: number]: string } = {};
    newFiles.forEach((file, index) => {
      if (isImageFile(file)) {
        newPreviewUrls[startIndex + index] = URL.createObjectURL(file);
      }
    });
    
    setAttachedFiles(prev => [...prev, ...newFiles]);
    setPreviewUrls(prev => ({ ...prev, ...newPreviewUrls }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    // Clean up preview URL if it exists
    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index]);
      setPreviewUrls(prev => {
        const newUrls = { ...prev };
        delete newUrls[index];
        return newUrls;
      });
    }
    
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return {
    attachedFiles,
    isDragging,
    previewUrls,
    isImageFile,
    handleFileSelect,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    removeFile,
  };
};