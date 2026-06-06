import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import TaskCard from '../components/kanban/TaskCard';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const TestWrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </QueryClientProvider>
);

const mockTask = {
  _id: 'task1',
  title: 'Test Task',
  description: 'Test description',
  priority: 'medium',
  status: 'todo',
  columnId: 'todo',
  assignedTo: [],
  labels: [],
  checklist: [],
  attachments: [],
  commentCount: 0,
};

describe('TaskCard', () => {
  it('renders task title', () => {
    render(
      <TestWrapper>
        <TaskCard task={mockTask} boardId="board1" />
      </TestWrapper>
    );
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('shows priority indicator', () => {
    render(
      <TestWrapper>
        <TaskCard task={mockTask} boardId="board1" />
      </TestWrapper>
    );
    
    const priorityDot = screen.getByTitle('Priority: Medium');
    expect(priorityDot).toBeInTheDocument();
  });
});