export type ApplicationStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export type TransportType = 'train' | 'flight' | 'car' | 'other';

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

export interface TravelApplication {
	id: string;
	applicant: Applicant;
	approverId: string;
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

export interface TravelApplicationInput {
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

export const TRANSPORT_LABEL: Record<TransportType, string> = {
	train: '高铁/火车',
	flight: '飞机',
	car: '自驾',
	other: '其他'
};
