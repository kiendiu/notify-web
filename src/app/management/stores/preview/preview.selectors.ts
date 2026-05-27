import { createFeatureSelector, createSelector } from '@ngrx/store';
import { PreviewState } from './preview.state';

export const selectPreviewState = createFeatureSelector<PreviewState>('preview');

export const selectTemplates = createSelector(
  selectPreviewState,
  (state: PreviewState) => state.templates,
);

export const selectTemplatePreview = createSelector(
  selectPreviewState,
  (state: PreviewState) => state.templatePreview,
);

export const selectPushPreview = createSelector(
  selectPreviewState,
  (state: PreviewState) => state.pushPreview,
);

export const selectEmailPreview = createSelector(
  selectPreviewState,
  (state: PreviewState) => state.emailPreview,
);

export const selectUsers = createSelector(
  selectPreviewState,
  (state: PreviewState) => state.users,
);

export const selectUserSearchLoading = createSelector(
  selectPreviewState,
  (state: PreviewState) => state.userSearchLoading,
);

export const selectTemplatesLoading = createSelector(
  selectPreviewState,
  (state: PreviewState) => state.templatesLoading,
);

export const selectTemplatePreviewLoading = createSelector(
  selectPreviewState,
  (state: PreviewState) => state.templatePreviewLoading,
);

export const selectPreviewError = createSelector(
  selectPreviewState,
  (state: PreviewState) => state.errorMessage,
);
