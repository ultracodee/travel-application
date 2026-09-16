export type ApplicationStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export type ApplicationType = 'travel' | 'purchase' | 'expense' | 'overtime';

export type TransportType = 'train' | 'flight' | 'car' | 'other';

export type ApplicationFieldType = 'text' | 'textarea' | 'number' | 'date' | 'time' | 'select' | 'checkbox';

export type ApplicationFieldValue = string | number | boolean;

export interface Applicant {
	id: string;
	name: string;
	department: string;
	position?: string;
}

export interface ApprovalRecord {
	id: string;
	approver: Applicant;
	action: 'approved' | 'rejected';
	comment?: string;
	operatedAt: string;
}

export interface Application {
	id: string;
	type: ApplicationType;
	title: string;
	description: string;
	applicant: Applicant;
	approverId: string;
	formData: Record<string, ApplicationFieldValue>;
	from: string;
	to: string;
	startDate: string;
	endDate: string;
	reason: string;
	transport: TransportType;
	estimatedCost: number;
	remark?: string;
	status: ApplicationStatus;
	approvalRecords: ApprovalRecord[];
	createdAt: string;
	updatedAt: string;
}

/** 兼容批次 2 迁移期间的旧页面与测试，批次 3 将完全替换该别名。 */
export type TravelApplication = Application;

export interface ApplicationInput {
	type?: ApplicationType;
	title?: string;
	description?: string;
	formData?: Record<string, ApplicationFieldValue>;
	applicant: Applicant;
	from: string;
	to: string;
	startDate: string;
	endDate: string;
	reason: string;
	transport: TransportType;
	estimatedCost: number;
	remark?: string;
}

export type TravelApplicationInput = ApplicationInput;

export interface ApplicationFieldConfig {
	name: string;
	label: string;
	type: ApplicationFieldType;
	required?: boolean;
	placeholder?: string;
	options?: Array<{ label: string; value: string }>;
	min?: number;
	max?: number;
	maxLength?: number;
	suffix?: string;
	fullWidth?: boolean;
	minToday?: boolean;
	maxToday?: boolean;
	integer?: boolean;
	readonly?: boolean;
}

export interface ApplicationTypeConfig {
	type: ApplicationType;
	label: string;
	description: string;
	fields: ApplicationFieldConfig[];
	amountField?: string;
	summaryFields: string[];
}

export interface LegacyTravelApplicationInput {
	applicant: Applicant;
	from: string;
	to: string;
	startDate: string;
	endDate: string;
	reason: string;
	transport: TransportType;
	estimatedCost: number;
	remark?: string;
}

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
	draft: '草稿',
	pending: '审批中',
	approved: '已通过',
	rejected: '已驳回'
};

export const APPLICATION_TYPE_LABEL: Record<ApplicationType, string> = {
	travel: '差旅申请',
	purchase: '采购申请',
	expense: '报销申请',
	overtime: '加班申请'
};

export const TRANSPORT_LABEL: Record<TransportType, string> = {
	train: '高铁/火车',
	flight: '飞机',
	car: '自驾',
	other: '其他'
};
