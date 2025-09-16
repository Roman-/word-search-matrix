import { createAppState } from './initialState'

export const ACTIONS = {
  SET_LANGUAGE: 'SET_LANGUAGE',
  UPDATE_GENERATION: 'UPDATE_GENERATION',
  UPDATE_STYLE: 'UPDATE_STYLE',
  UPDATE_SEPARATORS: 'UPDATE_SEPARATORS',
  RESET: 'RESET',
}

export const wordSearchReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_LANGUAGE:
      return { ...state, language: action.payload }
    case ACTIONS.UPDATE_GENERATION:
      return { ...state, generation: { ...state.generation, ...action.payload } }
    case ACTIONS.UPDATE_STYLE:
      return { ...state, style: { ...state.style, ...action.payload } }
    case ACTIONS.UPDATE_SEPARATORS:
      return { ...state, separators: { ...state.separators, ...action.payload } }
    case ACTIONS.RESET:
      return createAppState(state.language)
    default:
      return state
  }
}

export default wordSearchReducer
