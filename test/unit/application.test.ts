import { describe, expect, it } from 'vitest';
import type { TravelApplication } from '$lib/types/application';
import {
	countByDepartment,
	countByDepartmentMonthlyTrend,
	countByStatus,
	countBySubmittedDepartment,
	countBySubmittedStatus,
	getRecentMonths
} from '$lib/utils/applicationStatistics';
import { assertTransition, canTransition } from '$lib/utils/applicationStatus';
import { validateTravelApplication } from '$lib/utils/applicationValidation';
import { changeApplicationStatus, createApplication } from '$lib/server/applicationRepository';

const application: TravelApplication = {
	id: 'TRV-TEST-001',
	applicant: { id: 'U001', name: '张三', department: '研发部' },
	approverId: 'U002',
	from: '上海',
	to: '杭州',
	startDate: '2026-09-12',
	endDate: '2026-09-14',
	reason: '客户现场支持',
	transport: 'train',
	estimatedCost: 1200,
	status: 'pending',
	approvalRecords: [],
	createdAt: '2026-09-10T00:00:00.000Z',
	updatedAt: '2026-09-10T00:00:00.000Z'
};

const input = () => {
	const { id, status, approvalRecords, createdAt, updatedAt, ...value } = application;
	return value;
};

describe('差旅申请校验', () => {
	it('接受完整申请', () => expect(validateTravelApplication(input())).toEqual({}));

	it('报告必填项和日期范围错误', () => {
		const errors = validateTravelApplication({
			...input(),
			from: '',
			to: '',
			startDate: '2026-09-15',
			endDate: '2026-09-14',
			reason: '',
			estimatedCost: -1
		});
		expect(errors.from).toBe('请输入出发地');
		expect(errors.to).toBe('请输入目的地');
		expect(errors.dateRange).toBe('结束日期不能早于开始日期');
		expect(errors.reason).toBe('请输入出差事由');
		expect(errors.estimatedCost).toBe('请输入大于 0 的预计费用');
	});
});

describe('状态流转和统计', () => {
	it('限制状态流转', () => {
		expect(canTransition('draft', 'pending')).toBe(true);
		expect(canTransition('approved', 'pending')).toBe(false);
		expect(() => assertTransition('approved', 'pending')).toThrow();
	});

	it('统计状态和部门数量', () => {
		const applications = [
			application,
			{ ...application, id: 'TRV-TEST-002', status: 'approved' as const },
			{ ...application, id: 'TRV-TEST-003', applicant: { ...application.applicant, department: '销售部' }, status: 'rejected' as const },
			{ ...application, id: 'TRV-TEST-004', applicant: { ...application.applicant, department: '销售部' }, status: 'draft' as const }
		];
		expect(countByStatus(applications)).toEqual({ draft: 1, pending: 1, approved: 1, rejected: 1 });
		expect(countBySubmittedStatus(applications)).toEqual({ pending: 1, approved: 1, rejected: 1 });
		expect(countByDepartment(applications)).toEqual({ 研发部: 2, 销售部: 2 });
		expect(countBySubmittedDepartment(applications)).toEqual({ 研发部: 2, 销售部: 1 });
	});

	it('按出发日期归属最近 12 个月的部门趋势并排除草稿', () => {
		const applications = [
			application,
			{ ...application, id: 'TRV-TEST-005', startDate: '2026-08-20', applicant: { ...application.applicant, department: '市场部' } },
			{ ...application, id: 'TRV-TEST-006', startDate: '2026-09-20', applicant: { ...application.applicant, department: '研发部' } },
			{ ...application, id: 'TRV-TEST-007', startDate: '2026-09-21', status: 'draft' as const, applicant: { ...application.applicant, department: '客户成功部' } },
			{ ...application, id: 'TRV-TEST-008', startDate: '2025-09-20' }
		];
		expect(getRecentMonths('2026-09-10')).toEqual([
			'2025-10',
			'2025-11',
			'2025-12',
			'2026-01',
			'2026-02',
			'2026-03',
			'2026-04',
			'2026-05',
			'2026-06',
			'2026-07',
			'2026-08',
			'2026-09'
		]);
		expect(countByDepartmentMonthlyTrend(applications, '2026-09-10')).toEqual({
			months: [
				'2025-10',
				'2025-11',
				'2025-12',
				'2026-01',
				'2026-02',
				'2026-03',
				'2026-04',
				'2026-05',
				'2026-06',
				'2026-07',
				'2026-08',
				'2026-09'
			],
			series: [
				{ department: '市场部', data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0] },
				{ department: '研发部', data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2] }
			]
		});
	});

	it('创建申请后可提交审批并记录审批意见', () => {
		const created = createApplication(input(), application.applicant);
		expect(created.status).toBe('draft');
		const pending = changeApplicationStatus(created.id, 'pending', 'U001');
		expect(pending?.status).toBe('pending');
		const approved = changeApplicationStatus(created.id, 'approved', 'U002', '同意出差');
		expect(approved?.status).toBe('approved');
		expect(approved?.approvalRecords.at(-1)?.comment).toBe('同意出差');
	});
});
