export interface TemplateDto {
	templateName: string;
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