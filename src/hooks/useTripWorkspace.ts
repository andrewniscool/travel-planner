import { useContext } from 'react';
import { TripWorkspaceContext } from './tripWorkspaceContext';

export function useTripWorkspace() {
  const context = useContext(TripWorkspaceContext);
  if (!context) throw new Error('useTripWorkspace must be used within TripWorkspaceProvider.');
  return context;
}
