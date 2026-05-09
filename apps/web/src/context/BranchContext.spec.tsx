import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BranchProvider, useBranch } from './BranchContext';

// Minimal consumer component for testing context values
function BranchDisplay() {
  const { selectedBranch, isAllBranches, setSelectedBranch } = useBranch();
  return (
    <div>
      <span data-testid="branch-code">{selectedBranch?.code ?? 'none'}</span>
      <span data-testid="is-all">{String(isAllBranches)}</span>
      <button
        onClick={() => setSelectedBranch({ id: 'branch-kpk', name: 'Keilor Park', code: 'KPK' })}
      >
        Select KPK
      </button>
      <button onClick={() => setSelectedBranch({ id: 'all', name: 'All Branches', code: 'ALL' })}>
        Select All
      </button>
    </div>
  );
}

// Stub out sessionStorage for each test
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

beforeEach(() => sessionStorageMock.clear());

describe('BranchContext', () => {
  it('defaults to All Branches on first render', () => {
    render(
      <BranchProvider>
        <BranchDisplay />
      </BranchProvider>,
    );

    expect(screen.getByTestId('branch-code').textContent).toBe('ALL');
    expect(screen.getByTestId('is-all').textContent).toBe('true');
  });

  it('updates selectedBranch and persists to sessionStorage on selection', async () => {
    render(
      <BranchProvider>
        <BranchDisplay />
      </BranchProvider>,
    );

    await userEvent.click(screen.getByText('Select KPK'));

    expect(screen.getByTestId('branch-code').textContent).toBe('KPK');
    expect(screen.getByTestId('is-all').textContent).toBe('false');
    expect(JSON.parse(sessionStorageMock.getItem('selectedBranch')!).code).toBe('KPK');
  });

  it('isAllBranches is true when code is ALL', async () => {
    render(
      <BranchProvider>
        <BranchDisplay />
      </BranchProvider>,
    );

    await userEvent.click(screen.getByText('Select KPK'));
    await userEvent.click(screen.getByText('Select All'));

    expect(screen.getByTestId('is-all').textContent).toBe('true');
  });

  it('restores previously saved branch from sessionStorage on mount', () => {
    sessionStorageMock.setItem(
      'selectedBranch',
      JSON.stringify({ id: 'branch-cob', name: 'Coburg', code: 'COB' }),
    );

    render(
      <BranchProvider>
        <BranchDisplay />
      </BranchProvider>,
    );

    // After the useEffect fires the stored value should be applied
    expect(screen.getByTestId('branch-code').textContent).toBe('COB');
  });
});
