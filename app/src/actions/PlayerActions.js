import * as utils from "../utils/utils"
import * as types from "../constants/PlayerConstants";

import {
  setTrack,
  createTrack,
  setTrackQueue,
  removeTrackAudio,
  setNewTrackAudio,
  shuffleTrackQueue,
  popQueue,
} from "../actions/TrackActions";

import { setWindowTitle } from "../actions/AppActions";

export const togglePlayerLoopAction = () => ({
  type: types.PLAYER_TOGGLE_LOOP
})

export const togglePlayerQueueLoopAction = () => ({
  type: types.PLAYER_TOGGLE_QUEUE_LOOP,
})

export const updatePlayerProgress = (time) => ({
  type: types.PLAYER_UPDATE_PROGRESS,
  payload: time,
})

export const setPlayerDuration = (duration) => ({
  type: types.PLAYER_SET_DURATION,
  payload: duration,
})

export const createNewAudio = (src, volume, index) => (dispatch, getState) => {
  let audio = new Audio();
  audio.src = src;
  audio.volume = volume;
  audio.index = index;
  audio.addEventListener("loadedmetadata", () => {
    dispatch(setPlayerDuration(audio.duration));
  });
  audio.addEventListener("ended", () => {
    dispatch(nextTrack());
  });
  audio.addEventListener("seeked", () => {
    // Maybe do something here later
  })
  audio.addEventListener("timeupdate", () => {
    let time = audio.currentTime;
    dispatch(updatePlayerProgress(time));
  });

  return audio;
};

export const play = () => (dispatch, getState) => {
  const { track, library } = getState();
  const { index } = track;
  const { trackList } = library;

  let { audio } = track;

  if (trackList.length < 0) return;

  if ((audio && index != audio.index) || (!audio)) // Switch tracks
    dispatch(jumpToTrack(index));
  else if (audio) // Continue playing
    audio.play();

  let trackObj = getState().track.track;
  if (trackObj)
    dispatch(setWindowTitle(trackObj.title));
};

export const pause = () => (dispatch, getState) => {
  const { track } = getState();
  if (track.audio)
    track.audio.pause();
}

export const stop = () => (dispatch, getState) => {
  dispatch(removeTrackAudio());
};

export const togglePlayerLoop = () => (dispatch, getState) => {
  dispatch(togglePlayerLoopAction());
}

export const togglePlayerQueueLoop = () => (dispatch, getState) => {
  dispatch(togglePlayerQueueLoopAction());
};

export const shuffle = () => (dispatch, getState) => {
  dispatch(shuffleTrackQueue());
};

export const nextTrack = () => (dispatch, getState) => {
  dispatch(removeTrackAudio());

  let { track, library, player } = getState();
  const { trackList } = library;

  if (track.queue.length > 0) {
    // Check queue
    let queue = getState().track.queue;
    if (queue.length <= 0) return;

    // Get next track and remove it from queue
    let nextTrackIndex;
    if (player.loop) {
      console.log('looped');
      nextTrackIndex = track.index;
      if (queue[0] == track.index)
        dispatch(popQueue());
    } else {
      nextTrackIndex = queue[0];
      dispatch(popQueue());
    }

    // Set track
    dispatch(setTrack(trackList[nextTrackIndex], nextTrackIndex));

    track = getState().track;

    // Create actual audio object and set it in the store
    let newTrack = trackList[track.index],
      src = newTrack.path,
      volume = track.volume,
      newIndex = track.index;
    let audio = createNewAudio(src, volume, newIndex)(dispatch, getState);
    audio.load();

    dispatch(setNewTrackAudio(audio));
    dispatch(play());
  } else {
    if (player.queueLoop) {
      dispatch(setTrackQueue([...track.copyQueue]));
      dispatch(nextTrack());
    } else {
      dispatch(setTrackQueue([], null));
    }
  }
};

export const seek = (time) => (dispatch, getState) => {
  const { track, player } = getState();
  if (track.audio)
    track.audio.currentTime = time;
};

export const jumpToTrack = (trackIndex) => (dispatch, getState) => {
  dispatch(removeTrackAudio());

  const { track } = getState();
  const { queue } = track;

  // Search for track index in queue
  let index = -1;
  for (let i = 0; i < queue.length; i++) {
    if (trackIndex == queue[i]) {
      index = i;
    }
  }

  // Remove everything before track index in queue or set to play just that track
  let newQ;
  if (index < 0)
    newQ = [trackIndex];
  else
    newQ = queue.slice(index);

  dispatch(setTrackQueue(newQ));
  dispatch(nextTrack());
};

export const pushQueueFront = (index) => (dispatch, getState) => {
  const { queue } = getState().track;
  let newQ = [index, ...queue];
  dispatch(setTrackQueue(newQ));
};