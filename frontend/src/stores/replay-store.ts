import { create } from 'zustand'

interface ReplayState {
  isPlaying: boolean
  currentFrameIndex: number
  playbackSpeed: number
  setPlaying: (value: boolean) => void
  setFrameIndex: (index: number) => void
  setPlaybackSpeed: (speed: number) => void
  reset: () => void
}

export const useReplayStore = create<ReplayState>((set) => ({
  isPlaying: false,
  currentFrameIndex: 0,
  playbackSpeed: 1,
  setPlaying: (value) => set({ isPlaying: value }),
  setFrameIndex: (index) => set({ currentFrameIndex: index }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  reset: () => set({ isPlaying: false, currentFrameIndex: 0, playbackSpeed: 1 }),
}))
