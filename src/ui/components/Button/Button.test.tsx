import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import Button from './Button';

// Mock the logging system
vi.mock('../../hooks/useLogger', () => ({
  useLogger: () => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    logUserAction: vi.fn(),
    logComponentError: vi.fn(),
    createTimer: vi.fn(() => vi.fn())
  })
}));

describe('Button Component', () => {
  let mockStore: any;

  beforeEach(() => {
    mockStore = configureStore({
      reducer: {
        auth: (state = { user: null }) => state
      }
    });
  });

  const renderButton = (props = {}) => {
    return render(
      <Provider store={mockStore}>
        <Button {...props} />
      </Provider>
    );
  };

  it('renders with default props', () => {
    const mockOnClick = vi.fn().mockResolvedValue(undefined);
    
    renderButton({ onClick: mockOnClick });
    
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Button')).toBeInTheDocument();
  });

  it('renders with custom children', () => {
    const mockOnClick = vi.fn().mockResolvedValue(undefined);
    
    renderButton({ onClick: mockOnClick, children: 'Custom Label' });
    
    expect(screen.getByText('Custom Label')).toBeInTheDocument();
  });

  it('renders with legacy buttonLabel prop', () => {
    const mockOnClick = vi.fn().mockResolvedValue(undefined);
    
    renderButton({ onClick: mockOnClick, buttonLabel: 'Legacy Label' });
    
    expect(screen.getByText('Legacy Label')).toBeInTheDocument();
  });

  it('applies primary variant class', () => {
    const mockOnClick = vi.fn().mockResolvedValue(undefined);
    
    renderButton({ onClick: mockOnClick, variant: 'primary' });
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn-primary');
  });

  it('applies secondary variant class', () => {
    const mockOnClick = vi.fn().mockResolvedValue(undefined);
    
    renderButton({ onClick: mockOnClick, variant: 'secondary' });
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn-outline', 'btn-primary');
  });

  it('applies legacy buttonType props', () => {
    const mockOnClick = vi.fn().mockResolvedValue(undefined);
    
    renderButton({ onClick: mockOnClick, buttonType: 'secondary' });
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn-outline', 'btn-primary');
  });

  it('handles click events', async () => {
    const mockOnClick = vi.fn().mockResolvedValue(undefined);
    
    renderButton({ onClick: mockOnClick });
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
  });

  it('shows loading state when loading prop is true', () => {
    const mockOnClick = vi.fn().mockResolvedValue(undefined);
    
    renderButton({ onClick: mockOnClick, loading: true });
    
    const button = screen.getByRole('button');
    expect(button).toContainHTML('loading-spinner');
  });

  it('shows loading state during async operations', async () => {
    const mockOnClick = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );
    
    renderButton({ onClick: mockOnClick, showLoadingState: true });
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // Should show loading spinner
    expect(button).toContainHTML('loading-spinner');
    
    await waitFor(() => {
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
  });

  it('disables button when disabled prop is true', () => {
    const mockOnClick = vi.fn().mockResolvedValue(undefined);
    
    renderButton({ onClick: mockOnClick, disabled: true });
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
    expect(button).toBeDisabled();
  });

  it('applies custom className', () => {
    const mockOnClick = vi.fn().mockResolvedValue(undefined);
    
    renderButton({ onClick: mockOnClick, className: 'custom-class' });
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('applies full width when fullWidth prop is true', () => {
    const mockOnClick = vi.fn().mockResolvedValue(undefined);
    
    renderButton({ onClick: mockOnClick, fullWidth: true });
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('w-full');
  });

  it('renders with different sizes', () => {
    const mockOnClick = vi.fn().mockResolvedValue(undefined);
    
    renderButton({ onClick: mockOnClick, size: 'lg' });
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn-lg');
  });

  it('handles missing onClick gracefully', () => {
    renderButton({ children: 'No Click Handler' });
    
    const button = screen.getByRole('button');
    
    // Should not throw error when clicked
    expect(() => fireEvent.click(button)).not.toThrow();
  });
});