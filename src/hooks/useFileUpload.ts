import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export const useFileUpload = () => {
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<{ [key: number]: string }>({});
  const { toast } = useToast();

  // Constants for validation
  const MAX_FILES = 6;
  const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB in bytes
  const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf', '.docx', '.heic', '.heif'];

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

  const validateFile = (file: File): boolean => {
    // Check file extension
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      toast({
        title: "Format non autorisé",
        description: "Formats de fichiers autorisés : .jpg, .png, .pdf, .docx .heic, .heif",
        variant: "destructive",
      });
      return false;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Fichier trop volumineux",
        description: "Votre fichier doit peser moins de 8Mo",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const newFiles = Array.from(files);
    
    // Check total number of files
    if (attachedFiles.length + newFiles.length > MAX_FILES) {
      toast({
        title: "Trop de fichiers",
        description: "Limite de 6 fichiers par envoi",
        variant: "destructive",
      });
      return;
    }

    // Validate each file
    const validFiles = newFiles.filter(validateFile);
    if (validFiles.length === 0) return;

    const startIndex = attachedFiles.length;
    
    // Create preview URLs for image files
    const newPreviewUrls: { [key: number]: string } = {};
    validFiles.forEach((file, index) => {
      if (isImageFile(file)) {
        newPreviewUrls[startIndex + index] = URL.createObjectURL(file);
      }
    });
    
    setAttachedFiles(prev => [...prev, ...validFiles]);
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