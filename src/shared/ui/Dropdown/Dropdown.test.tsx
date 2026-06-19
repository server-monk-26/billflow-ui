import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { Dropdown } from './Dropdown';

const options = [
  { value: 'le1', label: 'Acme Traders Pvt Ltd', sublabel: '27ABCDE1234F1Z5' },
  { value: 'le2', label: 'Acme Exports LLP' },
];

describe('Dropdown', () => {
  it('shows the placeholder when nothing is selected', () => {
    renderWithProviders(
      <Dropdown options={options} value={null} onChange={() => {}} placeholder="Select entity" ariaLabel="Legal entity" />,
    );
    expect(screen.getByRole('button', { name: 'Legal entity' })).toHaveTextContent('Select entity');
  });

  it('shows the selected option label', () => {
    renderWithProviders(<Dropdown options={options} value="le1" onChange={() => {}} ariaLabel="Legal entity" />);
    expect(screen.getByRole('button', { name: 'Legal entity' })).toHaveTextContent('Acme Traders Pvt Ltd');
  });

  it('opens on click and fires onChange with the chosen value', async () => {
    const onChange = vi.fn();
    renderWithProviders(<Dropdown options={options} value="le1" onChange={onChange} ariaLabel="Legal entity" />);
    await userEvent.click(screen.getByRole('button', { name: 'Legal entity' }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('option', { name: /Acme Exports LLP/ }));
    expect(onChange).toHaveBeenCalledWith('le2');
  });

  it('marks the active option as selected', async () => {
    renderWithProviders(<Dropdown options={options} value="le1" onChange={() => {}} ariaLabel="Legal entity" />);
    await userEvent.click(screen.getByRole('button', { name: 'Legal entity' }));
    expect(screen.getByRole('option', { name: /Acme Traders Pvt Ltd/ })).toHaveAttribute('aria-selected', 'true');
  });
});
