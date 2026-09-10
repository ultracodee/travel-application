import { assertTransition } from '$lib/utils/applicationStatus';
import type {
	ApprovalRecord,
	Applicant,
	ApplicationStatus,
	TravelApplication,
	TravelApplicationInput
} from '$lib/types/application';

const approver: Applicant = {
	id: 'U002',
	name: '李经理',
	department: '研发部',
	position: '部门负责人'
};

const applications: TravelApplication[] = [
	{
		id: 'TRV-202609-001',
		applicant: { id: 'U001', name: '张三', department: '研发部', position: '前端开发' },
		from: '上海',
		to: '杭州',
		startDate: '2026-09-12',
		endDate: '2026-09-14',
		reason: '客户现场技术支持',
		transport: 'train',
		estimatedCost: 1800,
		remark: '预计周日下午返回',
		status: 'pending',
		approvalRecords: [],
		createdAt: '2026-09-08T10:00:00.000Z',
		updatedAt: '2026-09-08T10:00:00.000Z'
	}
];

function now() {
	return new Date().toISOString();
}

function nextId() {
	return `TRV-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(applications.length + 1).padStart(3, '0')}`;
}

export function listApplications(): TravelApplication[] {
	return applications.map((application) => ({
		...application,
		applicant: { ...application.applicant },
		approvalRecords: application.approvalRecords.map((record) => ({ ...record, approver: { ...record.approver } }))
	}));
}

export function findApplication(id: string): TravelApplication | undefined {
	return applications.find((application) => application.id === id);
}

export function createApplication(input: TravelApplicationInput): TravelApplication {
	const timestamp = now();
	const application: TravelApplication = {
		...input,
		id: nextId(),
		status: 'draft',
		approvalRecords: [],
		createdAt: timestamp,
		updatedAt: timestamp
	};
	applications.unshift(application);
	return application;
}

export function changeApplicationStatus(
	id: string,
	status: Extract<ApplicationStatus, 'pending' | 'approved' | 'rejected'>,
	comment?: string
): TravelApplication | undefined {
	const application = findApplication(id);
	if (!application) return undefined;

	assertTransition(application.status, status);
	application.status = status;
	application.updatedAt = now();

	if (status === 'approved' || status === 'rejected') {
		const record: ApprovalRecord = {
			id: `APR-${Date.now()}`,
			approver: { ...approver },
			action: status,
			comment,
			operatedAt: application.updatedAt
		};
		application.approvalRecords.push(record);
	}

	return application;
}
