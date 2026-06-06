import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import FilterBar from '../components/filters/FilterBar';
import useUIStore from '../store/useUIStore';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const TestWrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>{children}</BrowserRouter>
  </QueryClientProvider>
);

describe('FilterBar', () => {
  beforeEach(() => {
    // Reset filters before each test
    useUIStore.setState({
      filters: { priority: [], assignee: [], label: [], dueDate: null, search: '' },
    });
  });

  it('renders search input', () => {
    render(
      <TestWrapper>
        <FilterBar boardMembers={[]} boardLabels={[]} />
      </TestWrapper>
    );
    expect(screen.getByPlaceholderText('Search tasks...')).toBeInTheDocument();
  });

  it('shows priority filter dropdown', () => {
    render(
      <TestWrapper>
        <FilterBar boardMembers={[]} boardLabels={[]} />
      </TestWrapper>
    );
    expect(screen.getByText('Priority')).toBeInTheDocument();
  });

  it('shows clear all button when filter is active', async () => {
    useUIStore.setState({
      filters: { priority: ['high'], assignee: [], label: [], dueDate: null, search: '' },
    });

    render(
      <TestWrapper>
        <FilterBar boardMembers={[]} boardLabels={[]} />
      </TestWrapper>
    );

    expect(screen.getByText('Clear all')).toBeInTheDocument();
  });
});
