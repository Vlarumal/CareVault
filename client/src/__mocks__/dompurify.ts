// Simple mock for DOMPurify that returns the input string directly
const DOMPurify = {
  sanitize: (dirty: string) => dirty
};

export default DOMPurify;