import { renderHook, act } from '@testing-library/react';
import useSocketStore from '../store/useSocketStore';

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connected: false,
  })),
}));

describe('useSocketStore', () => {
  beforeEach(() => {
    // Reset store state
    useSocketStore.setState({
      socket: null,
      isConnected: false,
      onlineMembers: [],
      typingUsers: {},
    });
  });

  it('initializes with disconnected state', () => {
    const { result } = renderHook(() => useSocketStore());
    expect(result.current.isConnected).toBe(false);
    expect(result.current.socket).toBeNull();
    expect(result.current.onlineMembers).toEqual([]);
  });

  it('connect creates a socket instance', async () => {
    const { result } = renderHook(() => useSocketStore());
    act(() => {
      result.current.connect('test_token');
    });
    // Socket should be set after connect
    expect(result.current.socket).not.toBeNull();
  });

  it('disconnect clears socket', async () => {
    const { result } = renderHook(() => useSocketStore());

    act(() => {
      result.current.connect('test_token');
    });
    act(() => {
      result.current.disconnect();
    });

    expect(result.current.socket).toBeNull();
    expect(result.current.isConnected).toBe(false);
  });
});
