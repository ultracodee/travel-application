import { describe, expect, it } from 'vitest';
import type { TravelApplication } from '$lib/types/application';
import { countByDepartment, countByStatus } from './applicationStatistics';
import { assertTransition, canTransition } from './applicationStatus';
import { validateTravelApplication } from './applicationValidation';
import { changeApplicationStatus, createApplication } from '$lib/server/applicationRepository';

const application: TravelApplication = {
	id: 'TRV-TEST-001',
	applicant: { id: 'U001', name: '张三', department: '研发部' },
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
		expect(errors.estimatedCost).toBe('预计费用必须是非负数字');
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
			{ ...application, id: 'TRV-TEST-003', applicant: { ...application.applicant, department: '销售部' }, status: 'rejected' as const }
		];
		expect(countByStatus(applications)).toEqual({ draft: 0, pending: 1, approved: 1, rejected: 1 });
		expect(countByDepartment(applications)).toEqual({ 研发部: 2, 销售部: 1 });
	});

	it('创建申请后可提交审批并记录审批意见', () => {
		const created = createApplication(input());
		expect(created.status).toBe('draft');
		const pending = changeApplicationStatus(created.id, 'pending');
		expect(pending?.status).toBe('pending');
		const approved = changeApplicationStatus(created.id, 'approved', '同意出差');
		expect(approved?.status).toBe('approved');
		expect(approved?.approvalRecords.at(-1)?.comment).toBe('同意出差');
	});
});
