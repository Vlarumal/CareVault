# ErrorBoundary Component Documentation

## Overview
The ErrorBoundary component catches JavaScript errors in its child component tree and displays a fallback UI.

## Usage
```jsx
<ErrorBoundary fallback={<CustomErrorComponent />}>
  <App />
</ErrorBoundary>
```

## Props
- `children`: Child components to render
- `fallback` (optional): Custom UI to display when an error occurs

## Best Practices
1. Wrap top-level route components
2. Use for critical UI sections
3. Provide actionable error messages
4. Include retry mechanisms

## Error Handling Flow
```mermaid
graph TD
    A[Render Children] --> B{Error?}
    B -->|Yes| C[Capture Error]
    B -->|No| D[Render Normally]
    C --> E[Display Fallback UI]
    E --> F[Log Error]
    F --> G[Retry Available]
