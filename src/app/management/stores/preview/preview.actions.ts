import { createAction, props } from '@ngrx/store';
import { TemplateDto, TemplatePreviewDto, PushPreview, EmailPreview, UserDto, UsersSearchResponse } from './preview.state';

// Load Templates
export const loadTemplates = createAction(
  '[Preview] Load Templates'
);

export const loadTemplatesSuccess = createAction(
  '[Preview] Load Templates Success',
  props<{ templates: TemplateDto[] }>()
);

export const loadTemplatesFailure = createAction(
  '[Preview] Load Templates Failure',
  props<{ errorMessage: string }>()
);

// Load Template Preview
export const loadTemplatePreview = createAction(
  '[Preview] Load Template Preview',
  props<{ templateName: string }>()
);

export const loadTemplatePreviewSuccess = createAction(
  '[Preview] Load Template Preview Success',
  props<{ templatePreview: TemplatePreviewDto }>()
);

export const loadTemplatePreviewFailure = createAction(
  '[Preview] Load Template Preview Failure',
  props<{ errorMessage: string }>()
);

// Update Push Preview
export const updatePushPreview = createAction(
  '[Preview] Update Push Preview',
  props<{ pushPreview: PushPreview }>()
);

// Update Email Preview
export const updateEmailPreview = createAction(
  '[Preview] Update Email Preview',
  props<{ emailPreview: EmailPreview }>()
);

// Search Users
export const searchUsers = createAction(
  '[Preview] Search Users',
  props<{ keyword: string; page: number; size: number }>()
);

export const searchUsersSuccess = createAction(
  '[Preview] Search Users Success',
  props<{ users: UserDto[] }>()
);

export const searchUsersFailure = createAction(
  '[Preview] Search Users Failure',
  props<{ errorMessage: string }>()
);

// Clear Preview
export const clearPreview = createAction(
  '[Preview] Clear Preview'
);
