import React from 'react';
import { 
  FileTextIcon, 
  FileSpreadsheet, 
  Image, 
  Video, 
  Music, 
  FileArchive, 
  FileCode, 
  Book, 
  FilePieChart, 
  File 
} from "lucide-react";
import { getFileIconName } from '../../utils/fileUtils';

interface FileIconProps {
  fileType: string;
  size?: number;
  className?: string;
}

const FileIcon: React.FC<FileIconProps> = ({ fileType, size = 16, className = '' }) => {
  const iconName = getFileIconName(fileType);
  
  const iconProps = { size, className };
  
  switch (iconName) {
    case 'document':
      return <FileTextIcon {...iconProps} />;
    case 'spreadsheet':
      return <FileSpreadsheet {...iconProps} />;
    case 'image':
      return <Image {...iconProps} />;
    case 'video':
      return <Video {...iconProps} />;
    case 'audio':
      return <Music {...iconProps} />;
    case 'archive':
      return <FileArchive {...iconProps} />;
    case 'code':
      return <FileCode {...iconProps} />;
    case 'ebook':
      return <Book {...iconProps} />;
    case 'presentation':
      return <FilePieChart {...iconProps} />;
    default:
      return <File {...iconProps} />;
  }
};

export default FileIcon;