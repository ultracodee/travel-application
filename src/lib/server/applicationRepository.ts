import { assertTransition } from '$lib/utils/applicationStatus';
import type {
	ApprovalRecord,
	Applicant,
	ApplicationStatus,
	TravelApplication,
	TravelApplicationInput
} from '$lib/types/application';
import type { User } from '$lib/types/user';

export interface ApplicationListQuery {
	page?: number;
	pageSize?: number;
	keyword?: string;
	status?: 'all' | ApplicationStatus;
	applicantId?: string;
	excludeDraft?: boolean;
	applications?: TravelApplication[];
}

export interface PaginationMeta {
	page: number;
	pageSize: number;
	total: number;
	totalPages: number;
}

export interface PaginatedApplications {
	data: TravelApplication[];
	pagination: PaginationMeta;
}

export const approver: Applicant = {
	id: 'U002',
	name: '李经理',
	department: '研发部',
	position: '部门负责人'
};

const applicants: Record<'zhangsan' | 'wangfang' | 'chenmin', Applicant> = {
	zhangsan: { id: 'U001', name: '张三', department: '研发部', position: '前端开发' },
	wangfang: { id: 'U003', name: '王芳', department: '市场部', position: '市场专员' },
	chenmin: { id: 'U004', name: '陈敏', department: '客户成功部', position: '客户成功专员' }
};

function approvalRecord(
	id: string,
	action: 'approved' | 'rejected',
	operatedAt: string,
	comment: string
): ApprovalRecord {
	return {
		id,
		approver: { ...approver },
		action,
		comment,
		operatedAt
	};
}

function application(
	id: string,
	applicant: Applicant,
	startDate: string,
	endDate: string,
	to: string,
	reason: string,
	status: ApplicationStatus,
	estimatedCost: number,
	options: {
		from?: string;
		transport?: TravelApplication['transport'];
		remark?: string;
		createdAt?: string;
		approvalComment?: string;
	} = {}
): TravelApplication {
	const createdAt = options.createdAt ?? `${startDate}T09:00:00.000Z`;
	const updatedAt = status === 'pending' || status === 'draft' ? createdAt : `${endDate}T10:30:00.000Z`;

	return {
		id,
		applicant: { ...applicant },
		approverId: approver.id,
		from: options.from ?? '上海',
		to,
		startDate,
		endDate,
		reason,
		transport: options.transport ?? 'train',
		estimatedCost,
		remark: options.remark,
		status,
		approvalRecords:
			status === 'approved' || status === 'rejected'
				? [
						approvalRecord(
							`APR-${id}`,
							status,
							updatedAt,
							options.approvalComment ?? (status === 'approved' ? '同意出差' : '本次安排暂缓')
						)
					]
				: [],
		createdAt,
		updatedAt
	};
}

const applications: TravelApplication[] = [
	application(
		'TRV-202609-001',
		applicants.zhangsan,
		'2026-09-12',
		'2026-09-14',
		'杭州',
		'客户现场技术支持',
		'pending',
		1800,
		{
			remark: '预计周日下午返回',
			createdAt: '2026-09-08T10:00:00.000Z'
		}
	),
	application(
		'TRV-202609-002',
		applicants.wangfang,
		'2026-09-18',
		'2026-09-20',
		'南京',
		'渠道客户拜访',
		'approved',
		2600,
		{
			approvalComment: '行程合理，同意安排'
		}
	),
	application(
		'TRV-202609-003',
		applicants.chenmin,
		'2026-09-22',
		'2026-09-24',
		'苏州',
		'客户上线培训',
		'pending',
		2100
	),
	application(
		'TRV-202608-001',
		applicants.zhangsan,
		'2026-08-05',
		'2026-08-08',
		'深圳',
		'项目交付支持',
		'approved',
		5200,
		{
			transport: 'flight'
		}
	),
	application(
		'TRV-202608-002',
		applicants.wangfang,
		'2026-08-16',
		'2026-08-18',
		'广州',
		'区域市场活动支持',
		'approved',
		4300,
		{
			transport: 'flight'
		}
	),
	application(
		'TRV-202608-003',
		applicants.chenmin,
		'2026-08-25',
		'2026-08-26',
		'杭州',
		'重点客户复盘会议',
		'rejected',
		1500,
		{
			approvalComment: '客户会议改为线上进行'
		}
	),
	application(
		'TRV-202607-001',
		applicants.zhangsan,
		'2026-07-10',
		'2026-07-12',
		'宁波',
		'生产环境问题排查',
		'approved',
		2400
	),
	application(
		'TRV-202607-002',
		applicants.wangfang,
		'2026-07-21',
		'2026-07-23',
		'成都',
		'行业峰会参展',
		'approved',
		5600,
		{
			transport: 'flight'
		}
	),
	application(
		'TRV-202607-003',
		applicants.chenmin,
		'2026-07-28',
		'2026-07-30',
		'无锡',
		'客户续约拜访',
		'approved',
		1900
	),
	application(
		'TRV-202606-001',
		applicants.zhangsan,
		'2026-06-03',
		'2026-06-05',
		'北京',
		'客户系统升级支持',
		'approved',
		4800,
		{
			transport: 'flight'
		}
	),
	application(
		'TRV-202606-002',
		applicants.wangfang,
		'2026-06-18',
		'2026-06-19',
		'合肥',
		'代理商培训',
		'rejected',
		1600,
		{
			approvalComment: '预算周期内暂不安排'
		}
	),
	application(
		'TRV-202606-003',
		applicants.chenmin,
		'2026-06-24',
		'2026-06-26',
		'厦门',
		'客户成功案例访谈',
		'approved',
		3900,
		{
			transport: 'flight'
		}
	),
	application(
		'TRV-202605-001',
		applicants.zhangsan,
		'2026-05-11',
		'2026-05-13',
		'苏州',
		'实施环境联调',
		'approved',
		1700
	),
	application(
		'TRV-202605-002',
		applicants.chenmin,
		'2026-05-20',
		'2026-05-22',
		'武汉',
		'客户培训与回访',
		'approved',
		3600,
		{
			transport: 'flight'
		}
	),
	application(
		'TRV-202604-001',
		applicants.zhangsan,
		'2026-04-07',
		'2026-04-10',
		'青岛',
		'项目验收支持',
		'approved',
		4100,
		{
			transport: 'flight'
		}
	),
	application(
		'TRV-202604-002',
		applicants.wangfang,
		'2026-04-17',
		'2026-04-19',
		'杭州',
		'春季渠道沙龙',
		'approved',
		2200
	),
	application(
		'TRV-202603-001',
		applicants.wangfang,
		'2026-03-09',
		'2026-03-12',
		'深圳',
		'重点客户拜访',
		'approved',
		5100,
		{
			transport: 'flight'
		}
	),
	application(
		'TRV-202603-002',
		applicants.chenmin,
		'2026-03-18',
		'2026-03-20',
		'南京',
		'客户使用培训',
		'approved',
		2300
	),
	application(
		'TRV-202602-001',
		applicants.zhangsan,
		'2026-02-23',
		'2026-02-25',
		'广州',
		'售前技术支持',
		'approved',
		4500,
		{
			transport: 'flight'
		}
	),
	application(
		'TRV-202602-002',
		applicants.chenmin,
		'2026-02-26',
		'2026-02-27',
		'杭州',
		'客户健康度巡检',
		'approved',
		1600
	),
	application(
		'TRV-202601-001',
		applicants.zhangsan,
		'2026-01-13',
		'2026-01-15',
		'南京',
		'客户定制功能联调',
		'rejected',
		2100,
		{
			approvalComment: '需求范围需进一步确认'
		}
	),
	application(
		'TRV-202601-002',
		applicants.wangfang,
		'2026-01-20',
		'2026-01-22',
		'重庆',
		'渠道年度计划沟通',
		'approved',
		4700,
		{
			transport: 'flight'
		}
	),
	application(
		'TRV-202512-001',
		applicants.zhangsan,
		'2025-12-08',
		'2025-12-10',
		'武汉',
		'年度项目收尾支持',
		'approved',
		3600,
		{
			transport: 'flight'
		}
	),
	application(
		'TRV-202512-002',
		applicants.wangfang,
		'2025-12-16',
		'2025-12-18',
		'长沙',
		'客户答谢活动支持',
		'approved',
		3300
	),
	application(
		'TRV-202511-001',
		applicants.chenmin,
		'2025-11-06',
		'2025-11-08',
		'北京',
		'重点客户 QBR 会议',
		'approved',
		4900,
		{
			transport: 'flight'
		}
	),
	application(
		'TRV-202511-002',
		applicants.zhangsan,
		'2025-11-19',
		'2025-11-21',
		'杭州',
		'项目版本发布保障',
		'approved',
		1900
	),
	application(
		'TRV-202510-001',
		applicants.wangfang,
		'2025-10-14',
		'2025-10-17',
		'上海',
		'行业展会执行',
		'approved',
		2800,
		{
			from: '杭州'
		}
	),
	application(
		'TRV-202510-002',
		applicants.chenmin,
		'2025-10-22',
		'2025-10-24',
		'成都',
		'客户培训交付',
		'approved',
		5200,
		{
			transport: 'flight'
		}
	),
	application(
		'TRV-202609-D01',
		applicants.zhangsan,
		'2026-09-25',
		'2026-09-26',
		'无锡',
		'客户补充需求沟通',
		'draft',
		900
	),
	application('TRV-202609-D02', applicants.wangfang, '2026-09-28', '2026-09-29', '苏州', '市场物料沟通', 'draft', 700),
	application(
		'TRV-202609-D03',
		applicants.chenmin,
		'2026-09-29',
		'2026-09-30',
		'杭州',
		'客户培训方案准备',
		'draft',
		800
	)
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

/** 返回当前用户有权查看的申请，统一封装数据范围规则。 */
export function getApplicationsForUser(user: User): TravelApplication[] {
	const isApprover = user.roles.includes('approver');
	return listApplications().filter((application) => {
		if (isApprover) return application.status !== 'draft';
		return application.applicant.id === user.id;
	});
}

export function listApplicationsPage(query: ApplicationListQuery): PaginatedApplications {
	const page = Math.max(1, query.page ?? 1);
	const pageSize = Math.min(50, Math.max(1, query.pageSize ?? 10));
	const keyword = query.keyword?.trim().toLowerCase() ?? '';

	const filtered = (query.applications ?? listApplications()).filter((application) => {
		const matchedApplicant = !query.applicantId || application.applicant.id === query.applicantId;
		const matchedDraft = !query.excludeDraft || application.status !== 'draft';
		const matchedStatus = !query.status || query.status === 'all' || application.status === query.status;
		const searchableText =
			`${application.id} ${application.applicant.name} ${application.applicant.department} ${application.from} ${application.to}`.toLowerCase();
		const matchedKeyword = !keyword || searchableText.includes(keyword);

		return matchedApplicant && matchedDraft && matchedStatus && matchedKeyword;
	});

	const total = filtered.length;
	const totalPages = Math.max(1, Math.ceil(total / pageSize));
	const safePage = Math.min(page, totalPages);
	const start = (safePage - 1) * pageSize;

	return {
		data: filtered.slice(start, start + pageSize),
		pagination: {
			page: safePage,
			pageSize,
			total,
			totalPages
		}
	};
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

export function updateDraft(id: string, input: TravelApplicationInput, actorId: string): TravelApplication | undefined {
	const application = findApplication(id);
	if (!application) return undefined;
	if (application.status !== 'draft') throw new Error('只有草稿可以编辑');
	if (application.applicant.id !== actorId) throw new Error('只能编辑自己的草稿');
	Object.assign(application, { ...input, applicant: { ...application.applicant }, updatedAt: now() });
	return application;
}

export function deleteDraft(id: string, actorId: string): boolean {
	const index = applications.findIndex((application) => application.id === id);
	if (index === -1) return false;
	const application = applications[index];
	if (application.status !== 'draft') throw new Error('只有草稿可以删除');
	if (application.applicant.id !== actorId) throw new Error('只能删除自己的草稿');
	applications.splice(index, 1);
	return true;
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
