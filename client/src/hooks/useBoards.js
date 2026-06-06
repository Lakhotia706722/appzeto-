import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { boardsApi } from '../api/boards';
import { queryKeys } from '../api/queryKeys';

export const useBoards = () =>
  useQuery({
    queryKey: queryKeys.boards.all(),
    queryFn: boardsApi.getAll,
  });

export const useBoard = (boardId) =>
  useQuery({
    queryKey: queryKeys.boards.detail(boardId),
    queryFn: () => boardsApi.getOne(boardId),
    enabled: !!boardId,
  });

export const useBoardTasks = (boardId, filters) =>
  useQuery({
    queryKey: queryKeys.boards.tasks(boardId, filters),
    queryFn: () => boardsApi.getTasks?.(boardId, filters),
    enabled: !!boardId,
    staleTime: 30000,
  });

export const useBoardAnalytics = (boardId, range = 30) =>
  useQuery({
    queryKey: queryKeys.boards.analytics(boardId, range),
    queryFn: () => boardsApi.getAnalytics(boardId, range),
    enabled: !!boardId,
    staleTime: 5 * 60 * 1000, // 5 min
  });

export const useBoardActivity = (boardId, page = 1) =>
  useQuery({
    queryKey: queryKeys.boards.activity(boardId, page),
    queryFn: () => boardsApi.getActivity(boardId, page),
    enabled: !!boardId,
  });

export const useCreateBoard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: boardsApi.create,
    onSuccess: (board) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.all() });
      toast.success(`Board "${board.title}" created`);
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to create board'),
  });
};

export const useUpdateBoard = (boardId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => boardsApi.update(boardId, data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.boards.detail(boardId) });
      const prev = queryClient.getQueryData(queryKeys.boards.detail(boardId));
      queryClient.setQueryData(queryKeys.boards.detail(boardId), (old) => ({ ...old, ...data }));
      return { prev };
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(queryKeys.boards.detail(boardId), context.prev);
      toast.error(err.response?.data?.error?.message || 'Failed to update board');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.all() });
    },
  });
};

export const useDeleteBoard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: boardsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.all() });
      toast.success('Board deleted');
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to delete board'),
  });
};

export const useStarBoard = (boardId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => boardsApi.star(boardId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.boards.all() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.all() });
    },
  });
};
