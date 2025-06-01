import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Button from './Button';

describe('Button Component', () => {
  it('renders with default props', () => {
    const mockOnClick = vi.fn().mockResolvedValue(undefined);
    
    render(<Button onClick={mockOnClick} />);
    
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Button')).toBeInTheDocument();
  });

  it('renders with custom label', () => {
    const mockOnClick = vi.fn().mockResolvedValue(undefined);
    
    render(<Button onClick={mockOnClick} buttonLabel="Custom Label" />);
    
    expect(screen.getByText('Custom Label')).toBeInTheDocument();
  });

  it('applies primary button type class', () => {
    const mockOnClick = vi.fn().mockResolvedValue(undefined);
    
    render(<Button onClick={mockOnClick} buttonType="primary" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn-primary');
  });

  it('applies secondary button type class', () => {
    const mockOnClick = vi.fn().mockResolvedValue(undefined);
    
    render(<Button onClick={mockOnClick} buttonType="secondary" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn-outline', 'btn-primary');
  });

  it('handles click events', async () => {
    const mockOnClick = vi.fn().mockResolvedValue(undefined);
    
    render(<Button onClick={mockOnClick} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
  });

  it('shows loading state when onClick is async', async () => {
    const mockOnClick = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );
    
    render(<Button onClick={mockOnClick} loadingIsEnabled={true} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // Should show loading spinner
    expect(screen.getByRole('button')).toContainHTML('loading-spinner');
    
    await waitFor(() => {
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
  });

  it('disables button when disabled prop is true', () => {
    const mockOnClick = vi.fn().mockResolvedValue(undefined);
    
    render(<Button onClick={mockOnClick} disabled={true} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('applies custom className', () => {
    const mockOnClick = vi.fn().mockResolvedValue(undefined);
    
    render(<Button onClick={mockOnClick} className="custom-class" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });
});