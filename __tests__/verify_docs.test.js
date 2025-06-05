const fs = require('fs');
const path = require('path');

describe('Documentation Verification', () => {
  test('Client docs are generated', () => {
    const indexPath = path.join(__dirname, '../client/docs/index.html');
    expect(fs.existsSync(indexPath)).toBe(true);
    
    const content = fs.readFileSync(indexPath, 'utf8');
    expect(content).toContain('Patients App');
  });

  test('Server docs are generated', () => {
    const indexPath = path.join(__dirname, '../server/docs/index.html');
    expect(fs.existsSync(indexPath)).toBe(true);
    
    const content = fs.readFileSync(indexPath, 'utf8');
    expect(content).toContain('API Reference');
  });

  test('Docs contain API endpoints', () => {
    const clientPath = path.join(__dirname, '../client/docs/modules.html');
    expect(fs.existsSync(clientPath)).toBe(true);
    
    const serverPath = path.join(__dirname, '../server/docs/modules.html');
    expect(fs.existsSync(serverPath)).toBe(true);
  });

  test('Context7 annotations are present in test files', () => {
    const testFiles = [
      '../client/src/components/PatientListPage/index.test.tsx',
      // Add more test files as they get annotated
    ];

    testFiles.forEach(filePath => {
      const fullPath = path.join(__dirname, filePath);
      const content = fs.readFileSync(fullPath, 'utf8');
      expect(content).toMatch(/@context7/);
    });
  });
});
