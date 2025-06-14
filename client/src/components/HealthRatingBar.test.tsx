import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, expect, test, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import HealthRatingBar from './HealthRatingBar';

afterEach(cleanup);

describe('HealthRatingBar Component', () => {
  test('renders correct hearts for rating 0', () => {
    render(<HealthRatingBar rating={0} showText={false} />);
    const hearts = screen.getAllByTestId(/heart-/);
    expect(hearts).toHaveLength(4);
    // All hearts should be green
    hearts.forEach(heart => {
      expect(heart).toHaveStyle({ color: '#4caf50' });
    });
  });

  test('renders correct hearts for rating 1', () => {
    render(<HealthRatingBar rating={1} showText={false} />);
    // Only first 3 hearts should be yellow, last transparent
    expect(screen.getByTestId('heart-0')).toHaveStyle({ color: '#ffeb3b' });
    expect(screen.getByTestId('heart-1')).toHaveStyle({ color: '#ffeb3b' });
    expect(screen.getByTestId('heart-2')).toHaveStyle({ color: '#ffeb3b' });
    expect(screen.getByTestId('heart-3')).toHaveStyle({ color: 'transparent' });
  });

  test('renders correct hearts for rating 2', () => {
    render(<HealthRatingBar rating={2} showText={false} />);
    // Only first 2 hearts should be orange, others transparent
    expect(screen.getByTestId('heart-0')).toHaveStyle({ color: '#ff9800' });
    expect(screen.getByTestId('heart-1')).toHaveStyle({ color: '#ff9800' });
    expect(screen.getByTestId('heart-2')).toHaveStyle({ color: 'transparent' });
    expect(screen.getByTestId('heart-3')).toHaveStyle({ color: 'transparent' });
  });

  test('renders correct hearts for rating 3', () => {
    render(<HealthRatingBar rating={3} showText={false} />);
    // Only first heart should be red, others transparent
    expect(screen.getByTestId('heart-0')).toHaveStyle({ color: '#f44336' });
    expect(screen.getByTestId('heart-1')).toHaveStyle({ color: 'transparent' });
    expect(screen.getByTestId('heart-2')).toHaveStyle({ color: 'transparent' });
    expect(screen.getByTestId('heart-3')).toHaveStyle({ color: 'transparent' });
  });

  test('shows N/A with tooltip when rating is null', async () => {
    render(<HealthRatingBar rating={null} showText={false} />);
    expect(screen.getByText('N/A')).toBeInTheDocument();
    
    // Trigger tooltip
    const helpIcon = screen.getByTestId('HelpOutlineIcon');
    fireEvent.mouseOver(helpIcon);
    
    // Tooltip content should appear
    expect(await screen.findByText('N/A: Health rating not available (requires HealthCheck entry)')).toBeInTheDocument();
  });

  test('displays text when showText is true', () => {
    render(<HealthRatingBar rating={0} showText={true} />);
    expect(screen.getByText('The patient is in great shape')).toBeInTheDocument();
  });

  test('hides text when showText is false', () => {
    render(<HealthRatingBar rating={0} showText={false} />);
    expect(screen.queryByTestId('health-rating-text')).not.toBeInTheDocument();
  });
});

// Snapshot tests
test('matches snapshot for rating 0 without text', () => {
  const { container } = render(<HealthRatingBar rating={0} showText={false} />);
  expect(container).toMatchSnapshot();
});

test('matches snapshot for rating 0 with text', () => {
  const { container } = render(<HealthRatingBar rating={0} showText={true} />);
  expect(container).toMatchSnapshot();
});

test('matches snapshot for rating 1', () => {
  const { container } = render(<HealthRatingBar rating={1} showText={false} />);
  expect(container).toMatchSnapshot();
});

test('matches snapshot for rating 2', () => {
  const { container } = render(<HealthRatingBar rating={2} showText={false} />);
  expect(container).toMatchSnapshot();
});

test('matches snapshot for rating 3', () => {
  const { container } = render(<HealthRatingBar rating={3} showText={false} />);
  expect(container).toMatchSnapshot();
});

test('matches snapshot for rating null', () => {
  const { container } = render(<HealthRatingBar rating={null} showText={false} />);
  expect(container).toMatchSnapshot();
});
