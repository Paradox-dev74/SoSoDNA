import type { QueryClient } from '@tanstack/react-query'

export function invalidateLiveDataQueries(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    queryClient.invalidateQueries({ queryKey: ['trades'] }),
    queryClient.invalidateQueries({ queryKey: ['dna'] }),
    queryClient.invalidateQueries({ queryKey: ['insights'] }),
    queryClient.invalidateQueries({ queryKey: ['heatmap'] }),
    queryClient.invalidateQueries({ queryKey: ['market-context'] }),
    queryClient.invalidateQueries({ queryKey: ['market-regimes'] }),
    queryClient.invalidateQueries({ queryKey: ['integration-health'] }),
    queryClient.invalidateQueries({ queryKey: ['pretrade-risk'] }),
    queryClient.invalidateQueries({ queryKey: ['execution-preview'] }),
  ])
}
