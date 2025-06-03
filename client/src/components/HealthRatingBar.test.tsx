import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import '@testing-library/jest-dom/vitest';
import HealthRatingBar from './HealthRatingBar';

describe('HealthRatingBar Component', () => {
  test('renders correct hearts for rating 0', () => {
    render(<HealthRatingBar rating={0} showText={false} />);
    const hearts = screen.getAllByTestId('FavoriteIcon');
    expect(hearts).toHaveLength(4);
    hearts.forEach(heart => {
      expect(heart).toHaveStyle({ color: '#4caf50' });
    });
  });

  test('renders correct hearts for rating 1', () => {
    render(<HealthRatingBar rating={1} showText={false} />);
    const hearts = screen.getAllByTestId('FavoriteIcon');
    expect(hearts[0]).toHaveStyle({ color: '#ffeb3b' });
    expect(hearts[1]).toHaveStyle({ color: '#ffeb3b' });
    expect(hearts[2]).toHaveStyle({ color: '#ffeb3b' });
    expect(hearts[3]).toHaveStyle({ color: 'rgba(0, 0, 0, 0)' }); // Transparent
  });

  test('renders correct hearts for rating 2', () => {
    render(<HealthRatingBar rating={2} showText={false} />);
    const hearts = screen.getAllByTestId('FavoriteIcon');
    expect(hearts[0]).toHaveStyle({ color: '#ff9800' });
    expect(hearts[1]).toHaveStyle({ color: '#ff9800' });
    expect(hearts[2]).toHaveStyle({ color: 'rgba(0, 0, 0, 0)' }); // Transparent
    expect(hearts[3]).toHaveStyle({ color: 'rgba(0, 0, 0, 0)' }); // Transparent
  });

  test('renders correct hearts for rating 3', () => {
    render(<HealthRatingBar rating={3} showText={false} />);
    const hearts = screen.getAllByTestId('FavoriteIcon');
    expect(hearts[0]).toHaveStyle({ color: '#f44336' });
    expect(hearts[1]).toHaveStyle({ color: 'rgba(0, 0, 0, 0)' }); // Transparent
    expect(hearts[2]).toHaveStyle({ color: 'rgba(0, 0, 0, 0)' }); // Transparent
    expect(hearts[3]).toHaveStyle({ color: 'rgba(0, 0, 0, 0)' }); // Transparent
  });

  test('shows N/A with tooltip when rating is null', async () => {
    render(<HealthRatingBar rating={null} showText={false} />);
    expect(screen.getByText('N/A')).toBeInTheDocument();
    
    // Trigger tooltip
    const helpIcon = screen.getByTestId('HelpOutlineIcon');
    fireEvent.mouseOver(helpIcon);
    
    // Tooltip content should appear
    expect(await screen.findByText('Health rating is only available for patients with HealthCheck entries')).toBeInTheDocument();
  });

  test('displays text when showText is true', () => {
    render(<HealthRatingBar rating={0} showText={true} />);
    expect(screen.getByText('The patient is in great shape')).toBeInTheDocument();
  });

  test('hides text when showText is false', () => {
    render(<HealthRatingBar rating={0} showText={false} />);
    expect(screen.queryByText('The patient is in great shape')).not.toBeInTheDocument();
  });
});
