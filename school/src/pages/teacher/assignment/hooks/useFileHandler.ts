import { useCallback } from "react";
import toast from "react-hot-toast";
import { type UploadedFile } from "../types/assignment.types";
import { validateFile, formatFileSize } from "../utils/fileUtils";

export const useFileHandler = () => {
  const handleFileUpload = useCallback(async (
    files: FileList, 
    isBulk: boolean = false
  ): Promise<UploadedFile[]> => {
    const fileArray = Array.from(files);
    const validFiles: UploadedFile[] = [];
    const errors: string[] = [];

    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        const uploadedFile: UploadedFile = {
          name: file.name,
          size: file.size,
          type: file.type || '.' + file.name.split('.').pop()?.toLowerCase(),
          file,
          uploaded: false
        };
        
        // Create preview for images
        if (file.type.startsWith('image/')) {
          uploadedFile.previewUrl = URL.createObjectURL(file);
        }
        
        validFiles.push(uploadedFile);
      }
    });

    if (errors.length > 0) {
      toast.error(errors.join(', '));
    }

    if (validFiles.length > 0) {
      toast.success(`${validFiles.length} file(s) ready for upload`);
    }

    return validFiles;
  }, []);

  const removeFile = useCallback((
    files: UploadedFile[],
    setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>,
    index: number
  ) => {
    setFiles(files.filter((_, i) => i !== index));
  }, []);

  return {
    handleFileUpload,
    removeFile,
    formatFileSize,
    validateFile
  };
};