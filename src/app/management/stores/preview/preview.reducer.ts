import { createReducer, on } from '@ngrx/store';
import * as PreviewActions from './preview.actions';
import { initialPreviewState } from './preview.state';

export const previewReducer = createReducer(
  initialPreviewState,
  
  // Load Templates
  on(PreviewActions.loadTemplates, (state) => ({
    ...state,
    templatesLoading: true,
    errorMessage: null,
  })),
  on(PreviewActions.loadTemplatesSuccess, (state, { templates }) => ({
    ...state,
    templates,
    templatesLoading: false,
    templatesLoaded: true,
    templatesLastFetched: Date.now(),
    errorMessage: null,
  })),
  on(PreviewActions.loadTemplatesFailure, (state, { errorMessage }) => ({
    ...state,
    templatesLoading: false,
    errorMessage,
  })),
  
  // Load Template Preview
  on(PreviewActions.loadTemplatePreview, (state) => ({
    ...state,
    templatePreviewLoading: true,
    errorMessage: null,
  })),
  on(PreviewActions.loadTemplatePreviewSuccess, (state, { templatePreview }) => ({
    ...state,
    templatePreview,
    templatePreviewLoading: false,
    templatePreviewLoaded: true,
    templatePreviewLastFetched: Date.now(),
    errorMessage: null,
  })),
  on(PreviewActions.loadTemplatePreviewFailure, (state, { errorMessage }) => ({
    ...state,
    templatePreviewLoading: false,
    errorMessage,
  })),
  
  // Update Push Preview
  on(PreviewActions.updatePushPreview, (state, { pushPreview }) => ({
    ...state,
    pushPreview,
  })),
  
  // Update Email Preview
  on(PreviewActions.updateEmailPreview, (state, { emailPreview }) => ({
    ...state,
    emailPreview,
  })),
  
  // Search Users
  on(PreviewActions.searchUsers, (state) => ({
    ...state,
    userSearchLoading: true,
    errorMessage: null,
  })),
  on(PreviewActions.searchUsersSuccess, (state, { users }) => ({
    ...state,
    users,
    userSearchLoading: false,
    usersLoaded: true,
    usersLastFetched: Date.now(),
    errorMessage: null,
  })),
  on(PreviewActions.searchUsersFailure, (state, { errorMessage }) => ({
    ...state,
    userSearchLoading: false,
    errorMessage,
  })),
  
  // Clear Preview
  on(PreviewActions.clearPreview, (state) => ({
    ...state,
    templatePreview: null,
    pushPreview: null,
    emailPreview: null,
    errorMessage: null,
    templatesLoading: false,
    templatePreviewLoading: false,
    userSearchLoading: false,
  })),
);
