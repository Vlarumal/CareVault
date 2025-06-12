import { sanitizeInput, sanitizeObject } from '../utils/sanitize';

describe('sanitizeInput', () => {
  test('removes all HTML tags', () => {
    const input = '<script>alert("XSS")</script>Safe content';
    const output = sanitizeInput(input);
    expect(output).toBe('Safe content');
  });

  test('removes all attributes', () => {
    const input = '<img src="x" onerror="alert(1)">';
    const output = sanitizeInput(input);
    expect(output).toBe('');
  });

  test('removes dangerous CSS', () => {
    const input = '<div style="background: url(javascript:alert(1))">Test</div>';
    const output = sanitizeInput(input);
    expect(output).toBe('Test');
  });

  test('keeps plain text', () => {
    const input = 'Safe text content';
    const output = sanitizeInput(input);
    expect(output).toBe('Safe text content');
  });
});

describe('sanitizeObject', () => {
  test('sanitizes string properties', () => {
    const input = {
      name: '<script>alert(1)</script>',
      bio: 'Safe bio',
      details: {
        notes: '<img src=x onerror=alert(1)>'
      }
    };
    
    const output = sanitizeObject(input);
    
    expect(output.name).toBe('');
    expect(output.bio).toBe('Safe bio');
    expect(output.details.notes).toBe('');
  });

  test('handles arrays', () => {
    const input = {
      comments: [
        'Safe comment',
        '<iframe src="javascript:alert(1)"></iframe>'
      ]
    };
    
    const output = sanitizeObject(input);
    
    expect(output.comments[0]).toBe('Safe comment');
    expect(output.comments[1]).toBe('');
  });

  test('handles nested objects', () => {
    const input = {
      user: {
        profile: {
          description: '<script>malicious</script>'
        }
      }
    };
    
    const output = sanitizeObject(input);
    expect(output.user.profile.description).toBe('');
  });
});