import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { Button } from './Button';

describe('Button', () => {
  it('renders its label (default state)', () => {
    renderWithProviders(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('fires onClick when enabled', async () => {
    const onClick = vi.fn();
    renderWithProviders(<Button onClick={onClick}>Create</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is disabled and shows a spinner when loading', () => {
    const onClick = vi.fn();
    renderWithProviders(
      <Button loading onClick={onClick}>
        Save
      </Button>,
    );
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(screen.getByLabelText('loading')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is set', () => {
    renderWithProviders(<Button disabled>Save</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders without provider wrapper too (smoke)', () => {
    render(<Button variant="danger">Delete</Button>);
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });
});
