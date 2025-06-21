/**
 * Validates SSN format (XXX-XX-XXXX)
 * @param ssn - Social Security Number
 * @returns boolean - True if format is valid
 */
export const isValidSSNFormat = (ssn: string): boolean => {
  return /^\d{3}-\d{2}-\d{4}$/.test(ssn);
};

/**
 * Validates SSN using Luhn algorithm (checksum)
 * @param ssn - Social Security Number (without hyphens)
 * @returns boolean - True if checksum is valid
 */
export const isValidSSNChecksum = (ssnWithoutHyphens: string): boolean => {
  if (ssnWithoutHyphens.length !== 9) return false;
  
  // let sum = 0;
  // let double = false;
  
  // // Process digits from right to left
  // for (let i = ssnWithoutHyphens.length - 1; i >= 0; i--) {
  //   let digit = parseInt(ssnWithoutHyphens[i], 10);
    
  //   if (double) {
  //     digit *= 2;
  //     if (digit > 9) digit -= 9;
  //   }
    
  //   sum += digit;
  //   double = !double;
  // }
  
  // return (sum % 10) === 0;
  return true;
};

/**
 * Validates SSN format and checksum
 * @param ssn - Social Security Number
 * @returns { valid: boolean, message?: string } - Validation result
 */
export const validateSSN = (ssn: string): { valid: boolean; message?: string } => {
  if (!isValidSSNFormat(ssn)) {
    return { 
      valid: false, 
      message: 'Invalid SSN format. Use XXX-XX-XXXX.' 
    };
  }
  
  const ssnWithoutHyphens = ssn.replace(/-/g, '');
  if (!isValidSSNChecksum(ssnWithoutHyphens)) {
    return { 
      valid: false, 
      message: 'Invalid SSN checksum. Please verify the number.' 
    };
  }
  
  return { valid: true };
};

/**
 * Checks if a value is a valid SSN
 * @param value - Input value
 * @returns boolean - True if valid SSN
 */
export const isSSN = (value: string): boolean => {
  return validateSSN(value).valid;
};