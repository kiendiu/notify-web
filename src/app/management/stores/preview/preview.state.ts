export interface TemplateDto {
  templateName: string;
  subject: string;
  content: string;
}

export interface TemplatePreviewDto {
  templateName: string;
  subject: string;
  content: string;
}

export interface PushPreview {
  title: string;
  body: string;
}

export interface EmailPreview {
  subject: string;
  content: string;
}

export interface UserDto {
  id: number;
  name: string;
  email: string;
  status?: string;
}

export interface UsersSearchResponse {
  content: UserDto[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
}

export interface PreviewState {
  templates: TemplateDto[];
  templatePreview: TemplatePreviewDto | null;
  pushPreview: PushPreview | null;
  emailPreview: EmailPreview | null;
  users: UserDto[];
  userSearchLoading: boolean;
  templatesLoading: boolean;
  templatePreviewLoading: boolean;
  templatesLoaded: boolean;
  templatesLastFetched: number | null;
  usersLoaded: boolean;
  usersLastFetched: number | null;
  templatePreviewLoaded: boolean;
  templatePreviewLastFetched: number | null;
  errorMessage: string | null;
}

export const initialPreviewState: PreviewState = {
  templates: [],
  templatePreview: null,
  pushPreview: null,
  emailPreview: null,
  users: [],
  userSearchLoading: false,
  templatesLoading: false,
  templatePreviewLoading: false,
  templatesLoaded: false,
  templatesLastFetched: null,
  usersLoaded: false,
  usersLastFetched: null,
  templatePreviewLoaded: false,
  templatePreviewLastFetched: null,
  errorMessage: null,
};
