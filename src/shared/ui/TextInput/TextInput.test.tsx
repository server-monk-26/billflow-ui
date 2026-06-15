import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { TextInput } from './TextInput';

describe('TextInput', () => {
  it('renders its label and associates it with the input', () => {
    renderWithProviders(<TextInput label="Username" />);
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
  });

  it('shows the error message and marks the field invalid', () => {
    renderWithProviders(<TextInput label="Username" error="Username is required" />);
    expect(screen.getByText('Username is required')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInvalid();
  });

  it('renders helper text when there is no error', () => {
    renderWithProviders(<TextInput label="Email" helperText="We never share it" />);
    expect(screen.getByText('We never share it')).toBeInTheDocument();
  });

  it('is disabled when disabled', () => {
    renderWithProviders(<TextInput label="Username" disabled />);
    expect(screen.getByLabelText('Username')).toBeDisabled();
  });

  it('calls onChange as the user types', async () => {
    const onChange = vi.fn();
    renderWithProviders(<TextInput label="Username" onChange={onChange} />);
    await userEvent.type(screen.getByLabelText('Username'), 'ab');
    expect(onChange).toHaveBeenCalled();
  });

  it('toggles password visibility', async () => {
    renderWithProviders(<TextInput label="Password" type="password" />);
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');
    await userEvent.click(screen.getByRole('button', { name: /show password/i }));
    expect(input).toHaveAttribute('type', 'text');
  });
});
