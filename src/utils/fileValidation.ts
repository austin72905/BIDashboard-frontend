/**
 * 前端檔案驗證工具
 * 提供 CSV 檔案的客戶端安全驗證
 */

export interface FileValidationResult {
  isValid: boolean;
  errorMessage?: string;
  warnings?: string[];
}

export interface FileSecurityCheck {
  hasValidExtension: boolean;
  hasValidMimeType: boolean;
  hasValidSize: boolean;
  hasSecureName: boolean;
  hasValidContent?: boolean;
}

/**
 * 檔案驗證類
 */
export class FileValidator {
  // 允許的檔案副檔名
  private static readonly ALLOWED_EXTENSIONS = ['.csv'];
  
  // 允許的 MIME 類型
  private static readonly ALLOWED_MIME_TYPES = [
    'text/csv',
    'application/csv', 
    'text/plain',
    'application/vnd.ms-excel'
  ];
  
  // 檔案大小限制（10MB）
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024;
  
  // 最大檔名長度
  private static readonly MAX_FILENAME_LENGTH = 255;
  
  // 危險字符和模式
  private static readonly DANGEROUS_CHARS = ['./', '../', '\\', ':', '*', '?', '"', '<', '>', '|'];
  private static readonly DANGEROUS_PATTERNS = [
    /\.\./g,           // 路徑遍歷
    /[<>:"|?*]/g,      // Windows 檔名禁用字符
    /\x00/g,           // null 字符
    /[\x01-\x1f]/g,    // 控制字符
  ];

  /**
   * 驗證 CSV 檔案
   */
  static async validateCsvFile(file: File): Promise<FileValidationResult> {
    const warnings: string[] = [];
    
    try {
      // 1. 基本檔案檢查
      const basicCheck = this.validateBasicFile(file);
      if (!basicCheck.isValid) {
        return basicCheck;
      }

      // 2. 檔案名稱安全檢查
      const nameCheck = this.validateFileName(file.name);
      if (!nameCheck.isValid) {
        return nameCheck;
      }

      // 3. 檔案類型檢查
      const typeCheck = this.validateFileType(file);
      if (!typeCheck.isValid) {
        return typeCheck;
      }
      if (typeCheck.warnings) {
        warnings.push(...typeCheck.warnings);
      }

      // 4. 檔案大小檢查
      const sizeCheck = this.validateFileSize(file);
      if (!sizeCheck.isValid) {
        return sizeCheck;
      }

      // 5. 檔案內容預檢查（前 1KB）
      const contentCheck = await this.validateFileContent(file);
      if (!contentCheck.isValid) {
        return contentCheck;
      }
      if (contentCheck.warnings) {
        warnings.push(...contentCheck.warnings);
      }

      return {
        isValid: true,
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (error) {
      console.error('檔案驗證過程中發生錯誤:', error);
      return {
        isValid: false,
        errorMessage: '檔案驗證失敗，請稍後再試'
      };
    }
  }

  /**
   * 基本檔案檢查
   */
  private static validateBasicFile(file: File): FileValidationResult {
    if (!file) {
      return { isValid: false, errorMessage: '檔案不能為空' };
    }

    if (file.size === 0) {
      return { isValid: false, errorMessage: '檔案內容為空' };
    }

    return { isValid: true };
  }

  /**
   * 檔案名稱安全檢查
   */
  private static validateFileName(fileName: string): FileValidationResult {
    if (!fileName || fileName.trim().length === 0) {
      return { isValid: false, errorMessage: '檔案名稱不能為空' };
    }

    // 檢查檔案名稱長度
    if (fileName.length > this.MAX_FILENAME_LENGTH) {
      return { 
        isValid: false, 
        errorMessage: `檔案名稱過長（最多 ${this.MAX_FILENAME_LENGTH} 個字符）` 
      };
    }

    // 檢查危險字符
    if (this.DANGEROUS_CHARS.some(char => fileName.includes(char))) {
      return { 
        isValid: false, 
        errorMessage: '檔案名稱包含不安全的字符' 
      };
    }

    // 檢查危險模式
    if (this.DANGEROUS_PATTERNS.some(pattern => pattern.test(fileName))) {
      return { 
        isValid: false, 
        errorMessage: '檔案名稱格式不安全' 
      };
    }

    return { isValid: true };
  }

  /**
   * 檔案類型檢查
   */
  private static validateFileType(file: File): FileValidationResult & { warnings?: string[] } {
    const warnings: string[] = [];

    // 檢查副檔名
    const extension = this.getFileExtension(file.name);
    if (!this.ALLOWED_EXTENSIONS.includes(extension)) {
      return { 
        isValid: false, 
        errorMessage: `只允許上傳 ${this.ALLOWED_EXTENSIONS.join(', ')} 格式的檔案` 
      };
    }

    // 檢查 MIME 類型（如果瀏覽器提供）
    if (file.type) {
      if (!this.ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
        return { 
          isValid: false, 
          errorMessage: `不支援的檔案類型: ${file.type}` 
        };
      }
    } else {
      warnings.push('無法檢測檔案的 MIME 類型，將基於檔案內容進行進一步驗證');
    }

    return { isValid: true, warnings };
  }

  /**
   * 檔案大小檢查
   */
  private static validateFileSize(file: File): FileValidationResult {
    if (file.size > this.MAX_FILE_SIZE) {
      const maxSizeMB = this.MAX_FILE_SIZE / (1024 * 1024);
      return { 
        isValid: false, 
        errorMessage: `檔案大小不能超過 ${maxSizeMB} MB` 
      };
    }

    return { isValid: true };
  }

  /**
   * 檔案內容預檢查
   */
  private static async validateFileContent(file: File): Promise<FileValidationResult & { warnings?: string[] }> {
    const warnings: string[] = [];

    try {
      // 讀取檔案前 1KB 進行預檢
      const chunk = file.slice(0, 1024);
      const arrayBuffer = await chunk.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const textDecoder = new TextDecoder('utf-8', { fatal: false });
      const content = textDecoder.decode(uint8Array);

      // 檢查是否包含危險內容
      if (this.containsDangerousContent(content)) {
        return { 
          isValid: false, 
          errorMessage: '檔案內容包含潛在危險字符或腳本' 
        };
      }

      // 檢查是否看起來像 CSV
      if (!this.looksLikeCsv(content)) {
        warnings.push('檔案內容可能不是有效的 CSV 格式');
      }

      return { isValid: true, warnings };

    } catch (error) {
      console.error('檔案內容檢查失敗:', error);
      return { 
        isValid: false, 
        errorMessage: '無法讀取檔案內容' 
      };
    }
  }

  /**
   * 檢查是否包含危險內容
   */
  private static containsDangerousContent(content: string): boolean {
    const dangerousPatterns = [
      // JavaScript/HTML 注入
      /<script[\s\S]*?>[\s\S]*?<\/script>/i,
      /javascript:/i,
      /vbscript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      
      // SQL 注入模式
      /('|(\'\')|(\b(or|and)\b.*(=|like))|(--)|\/\*|\*\/)/i,
      /\b(select|insert|update|delete|drop|create|alter|exec|execute|union)\b/i,
      
      // 路徑遍歷
      /\.\.[\/\\]/,
      
      // 二進制內容檢測（可能不是純文字）
      /[\x00-\x08\x0E-\x1F\x7F]/
    ];

    return dangerousPatterns.some(pattern => pattern.test(content));
  }

  /**
   * 檢查內容是否看起來像 CSV
   */
  private static looksLikeCsv(content: string): boolean {
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    if (lines.length === 0) return false;

    // 檢查是否有逗號分隔的結構
    const hasCommas = lines.some(line => line.includes(','));
    
    // 檢查前幾行的欄位數量是否大致一致
    if (hasCommas && lines.length > 1) {
      const firstLineFields = lines[0].split(',').length;
      const consistentFieldCount = lines.slice(0, Math.min(3, lines.length))
        .every(line => Math.abs(line.split(',').length - firstLineFields) <= 1);
      
      return consistentFieldCount;
    }

    return hasCommas;
  }

  /**
   * 獲取檔案副檔名
   */
  private static getFileExtension(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf('.');
    if (lastDotIndex === -1) return '';
    return fileName.substring(lastDotIndex).toLowerCase();
  }

  /**
   * 進行完整的安全檢查
   */
  static performSecurityCheck(file: File): FileSecurityCheck {
    return {
      hasValidExtension: this.ALLOWED_EXTENSIONS.includes(this.getFileExtension(file.name)),
      hasValidMimeType: !file.type || this.ALLOWED_MIME_TYPES.includes(file.type.toLowerCase()),
      hasValidSize: file.size > 0 && file.size <= this.MAX_FILE_SIZE,
      hasSecureName: !this.DANGEROUS_CHARS.some(char => file.name.includes(char)) &&
                     !this.DANGEROUS_PATTERNS.some(pattern => pattern.test(file.name))
    };
  }
}

/**
 * 便利函數：快速驗證 CSV 檔案
 */
export const validateCsvFile = (file: File): Promise<FileValidationResult> => {
  return FileValidator.validateCsvFile(file);
};

/**
 * 便利函數：檢查檔案是否安全
 */
export const isFileSafe = (file: File): boolean => {
  const check = FileValidator.performSecurityCheck(file);
  return check.hasValidExtension && 
         check.hasValidMimeType && 
         check.hasValidSize && 
         check.hasSecureName;
};
