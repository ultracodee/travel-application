import { assertTransition } from '$lib/utils/applicationStatus';
import type {
	ApprovalRecord,
	Applicant,
	ApplicationStatus,
	TravelApplication,
	TravelApplicationInput
} from '$lib/types/application';

export const approver: Applicant = {
	id: 'U002',
	name: '李经理',
	department: '研发部',
	position: '部门负责人'
};

const applications: TravelApplication[] = [
	{
		id: 'TRV-202609-001',
		applicant: { id: 'U001', name: '张三', department: '研发部', position: '前端开发' },
		approverId: approver.id,
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

export function createApplication(
	input: TravelApplicationInput,
	applicant: Applicant,
	approverId = approver.id,
	status: Extract<ApplicationStatus, 'draft' | 'pending'> = 'draft'
): TravelApplication {
	const timestamp = now();
	const application: TravelApplication = {
		...input,
		applicant: { ...applicant },
		approverId,
		id: nextId(),
		status,
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
	actorId: string,
	comment?: string
): TravelApplication | undefined {
	const application = findApplication(id);
	if (!application) return undefined;
	if (status !== 'pending') {
		if (application.applicant.id === actorId) throw new Error('申请人不能审批自己的申请');
		if (application.approverId !== actorId) throw new Error('当前用户不是该申请的指定审批人');
	} else if (application.applicant.id !== actorId) {
		throw new Error('只有申请人可以提交自己的草稿');
	}

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
