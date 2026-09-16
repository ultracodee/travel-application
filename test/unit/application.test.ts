import { describe, expect, it } from 'vitest';
import type { TravelApplication } from '$lib/types/application';
import {
	countByDepartment,
	countByDepartmentMonthlyTrend,
	countByApplicationType,
	countByStatus,
	countBySubmittedDepartment,
	countBySubmittedStatus,
	filterApplicationsByRange,
	getRecentMonths,
	getMonthsByRange,
	sumByMonth
} from '$lib/utils/applicationStatistics';
import { assertTransition, canTransition } from '$lib/utils/applicationStatus';
import { validateTravelApplication } from '$lib/utils/applicationValidation';
import { changeApplicationStatus, createApplication, listApplicationsPage } from '$lib/server/applicationRepository';
import { APPLICATION_TYPE_CONFIGS, APPLICATION_TYPE_MAP } from '$lib/config/applicationTypes';
import { validateApplicationInput } from '$lib/utils/applicationFormValidation';

const application: TravelApplication = {
	id: 'TRV-TEST-001',
	type: 'travel',
	title: '客户现场支持差旅申请',
	description: '前往杭州进行客户现场支持',
	applicant: { id: 'U001', name: '张三', department: '研发部' },
	approverId: 'U002',
	formData: {
		from: '上海',
		to: '杭州',
		startDate: '2026-09-12',
		endDate: '2026-09-14',
		transport: 'train',
		estimatedCost: 1200
	},
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

function offsetDate(days: number) {
	const date = new Date();
	date.setDate(date.getDate() + days);
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const input = () => {
	return {
		applicant: application.applicant,
		approverId: application.approverId,
		type: application.type,
		title: application.title,
		description: application.description,
		formData: application.formData,
		from: application.from,
		to: application.to,
		startDate: offsetDate(1),
		endDate: offsetDate(3),
		reason: application.reason,
		transport: application.transport,
		estimatedCost: application.estimatedCost,
		remark: application.remark
	};
};

describe('差旅申请校验', () => {
	it('接受完整申请', () => expect(validateTravelApplication(input())).toEqual({}));

	it('报告必填项和日期范围错误', () => {
		const errors = validateTravelApplication({
			...input(),
			from: '',
			to: '',
			startDate: offsetDate(2),
			endDate: offsetDate(1),
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

describe('通用申请类型校验', () => {
	it('校验采购申请的类型字段和金额', () => {
		const errors = validateApplicationInput({
			...input(),
			type: 'purchase',
			title: '设备采购',
			description: '补充培训设备',
			formData: { itemName: '', quantity: 0, budgetAmount: 0, expectedDate: '' }
		});
		expect(errors.itemName).toBe('请输入采购物品');
		expect(errors.quantity).toContain('必须大于');
		expect(errors.budgetAmount).toContain('必须大于');
		expect(errors.expectedDate).toBe('请输入期望到货日期');
	});
});

describe('状态流转和统计', () => {
	it('提供四种预置申请类型配置', () => {
		expect(APPLICATION_TYPE_CONFIGS.map((item) => item.type)).toEqual(['travel', 'purchase', 'expense', 'overtime']);
		expect(APPLICATION_TYPE_MAP.purchase.amountField).toBe('budgetAmount');
		expect(APPLICATION_TYPE_MAP.overtime.amountField).toBeUndefined();
		expect(APPLICATION_TYPE_MAP.travel.fields.some((field) => field.name === 'estimatedCost')).toBe(true);
	});

	it('限制状态流转', () => {
		expect(canTransition('draft', 'pending')).toBe(true);
		expect(canTransition('approved', 'pending')).toBe(false);
		expect(() => assertTransition('approved', 'pending')).toThrow();
	});

	it('统计状态和部门数量', () => {
		const applications = [
			application,
			{ ...application, id: 'TRV-TEST-002', status: 'approved' as const },
			{
				...application,
				id: 'TRV-TEST-003',
				applicant: { ...application.applicant, department: '销售部' },
				status: 'rejected' as const
			},
			{
				...application,
				id: 'TRV-TEST-004',
				applicant: { ...application.applicant, department: '销售部' },
				status: 'draft' as const
			}
		];
		expect(countByStatus(applications)).toEqual({ draft: 1, pending: 1, approved: 1, rejected: 1 });
		expect(countBySubmittedStatus(applications)).toEqual({ pending: 1, approved: 1, rejected: 1 });
		expect(countByDepartment(applications)).toEqual({ 研发部: 2, 销售部: 2 });
		expect(countBySubmittedDepartment(applications)).toEqual({ 研发部: 2, 销售部: 1 });
		expect(
			countByApplicationType([
				...applications,
				{ ...application, id: 'PUR-TEST-001', type: 'purchase' },
				{ ...application, id: 'EXP-TEST-001', type: 'expense' },
				{ ...application, id: 'OVT-TEST-001', type: 'overtime' }
			])
		).toEqual({ travel: 4, purchase: 1, expense: 1, overtime: 1 });
	});

	it('按出发日期归属最近 12 个月的部门趋势并排除草稿', () => {
		const applications = [
			application,
			{
				...application,
				id: 'TRV-TEST-005',
				startDate: '2026-08-20',
				applicant: { ...application.applicant, department: '市场部' }
			},
			{
				...application,
				id: 'TRV-TEST-006',
				startDate: '2026-09-20',
				applicant: { ...application.applicant, department: '研发部' }
			},
			{
				...application,
				id: 'TRV-TEST-007',
				startDate: '2026-09-21',
				status: 'draft' as const,
				applicant: { ...application.applicant, department: '客户成功部' }
			},
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

	it('空数据时返回完整月份轴和空系列', () => {
		expect(countByDepartmentMonthlyTrend([], '2026-09-10')).toEqual({
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
			series: []
		});
	});

	it('拒绝无效的月份数量和参考日期', () => {
		expect(getRecentMonths('2026-09-10', 0)).toEqual([]);
		expect(() => getRecentMonths('invalid-date')).toThrow('无效的参考日期');
	});

	it('按出发月份汇总预计费用并排除草稿', () => {
		expect(
			sumByMonth(
				[
					{
						...application,
						estimatedCost: 1000,
						formData: { ...application.formData, estimatedCost: 1000 },
						startDate: '2026-09-01'
					},
					{
						...application,
						estimatedCost: 2000,
						formData: { ...application.formData, estimatedCost: 2000 },
						startDate: '2026-09-15',
						status: 'approved' as const
					},
					{
						...application,
						estimatedCost: 9000,
						formData: { ...application.formData, estimatedCost: 9000 },
						startDate: '2026-09-20',
						status: 'draft' as const
					}
				],
				'2026-09-10'
			).data.at(-1)
		).toBe(3000);
	});

	it('支持最近半年、最近三月和今年的时间范围', () => {
		expect(getMonthsByRange('2026-09-10', 'halfYear')).toHaveLength(6);
		expect(getMonthsByRange('2026-09-10', 'quarter')).toHaveLength(3);
		expect(getMonthsByRange('2026-09-10', 'currentYear')).toEqual([
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
		const filtered = filterApplicationsByRange(
			[
				{ ...application, startDate: '2026-09-01' },
				{ ...application, id: 'TRV-TEST-009', startDate: '2025-10-01' },
				{ ...application, id: 'TRV-TEST-010', startDate: '2026-09-02', status: 'draft' as const }
			],
			'2026-09-10',
			'quarter'
		);
		expect(filtered.map((item) => item.id)).toEqual(['TRV-TEST-001']);
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

	it('支持按页返回申请并应用筛选条件', () => {
		const result = listApplicationsPage({ page: 2, pageSize: 5, excludeDraft: true, keyword: '客户' });
		expect(result.pagination.page).toBe(2);
		expect(result.pagination.pageSize).toBe(5);
		expect(result.pagination.total).toBeGreaterThan(5);
		expect(result.data.length).toBeGreaterThan(0);
		expect(result.data.length).toBeLessThanOrEqual(5);
		expect(result.data.every((item) => item.status !== 'draft')).toBe(true);
		expect(
			result.data.every((item) =>
				`${item.id}${item.applicant.name}${item.from}${item.to}${item.reason}`.includes('客户')
			)
		).toBe(true);
	});
});
