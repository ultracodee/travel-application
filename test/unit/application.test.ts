import { describe, expect, it } from 'vitest';
import type { TravelApplication } from '$lib/types/application';
import {
	countByDepartment,
	countByDepartmentMonthlyTrend,
	countByApplicationType,
	countBySubmittedApplicationType,
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
import {
	changeApplicationStatus,
	createApplication,
	deleteDraft,
	getApplicationsForUser,
	listApplications,
	listApplicationsPage,
	updateDraft,
	updateEditableApplication
} from '$lib/server/applicationRepository';
import { users } from '$lib/server/auth';
import { APPLICATION_TYPE_CONFIGS, APPLICATION_TYPE_MAP } from '$lib/config/applicationTypes';
import { validateApplicationInput } from '$lib/utils/applicationFormValidation';
import {
	getApplicationAmount,
	getApplicationAmountFromForm,
	getApplicationBusinessDate,
	getApplicationFieldEntries,
	getApplicationFieldEntriesFromForm,
	getApplicationSummary,
	getApplicationTypeLabel
} from '$lib/utils/applicationDisplay';

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

	it('校验下拉选项、复选框和文本长度边界', () => {
		const errors = validateApplicationInput({
			...input(),
			type: 'expense',
			title: '费用报销',
			description: '测试报销',
			formData: {
				expenseType: 'unknown',
				expenseAmount: 100,
				expenseDate: '2026-09-01',
				expenseDescription: '说明',
				invoiceAvailable: false,
				accountLastFour: '12345'
			}
		});
		expect(errors.expenseType).toBe('报销类型选项无效');
		expect(errors.invoiceAvailable).toBe('请输入已有发票');
		expect(errors.accountLastFour).toContain('不能超过');
	});

	it('校验加班申请的时间和必填业务字段', () => {
		const errors = validateApplicationInput({
			...input(),
			type: 'overtime',
			title: '版本发布加班',
			description: '版本发布',
			formData: {
				overtimeDate: '',
				startTime: '',
				endTime: '',
				durationHours: 0,
				overtimeReason: '',
				timeOff: false
			}
		});
		expect(errors.overtimeDate).toBe('请输入加班日期');
		expect(errors.durationHours).toContain('必须大于');
		expect(errors.overtimeReason).toBe('请输入加班原因');
	});

	it('限制采购到货日期和加班日期不能早于今天', () => {
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		const date = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(
			yesterday.getDate()
		).padStart(2, '0')}`;
		const purchaseErrors = validateApplicationInput({
			...input(),
			type: 'purchase',
			formData: {
				itemName: '显示器',
				quantity: 1,
				budgetAmount: 1000,
				expectedDate: date,
				purchaseReason: '设备补充'
			}
		});
		const overtimeErrors = validateApplicationInput({
			...input(),
			type: 'overtime',
			formData: {
				project: '版本发布',
				overtimeDate: date,
				startTime: '09:00',
				endTime: '18:00',
				durationHours: 8,
				overtimeReason: '版本发布保障',
				timeOff: false
			}
		});
		expect(purchaseErrors.expectedDate).toBe('期望到货日期不能早于今天');
		expect(overtimeErrors.overtimeDate).toBe('加班日期不能早于今天');
	});

	it('校验加班结束日期时间必须晚于开始日期时间', () => {
		const errors = validateApplicationInput({
			...input(),
			type: 'overtime',
			formData: {
				project: '版本发布',
				overtimeDate: '2026-09-20',
				startTime: '22:00',
				endDate: '2026-09-20',
				endTime: '22:00',
				durationHours: 0,
				overtimeReason: '版本发布保障',
				timeOff: false
			}
		});
		expect(errors.endDate).toBe('结束时间必须晚于开始时间');
	});
});

describe('通用申请展示适配', () => {
	it('按申请类型生成类型、摘要、金额和业务日期', () => {
		const purchase = {
			...application,
			type: 'purchase' as const,
			title: '采购显示器',
			formData: {
				itemName: '显示器',
				quantity: 2,
				budgetAmount: 3600,
				expectedDate: '2026-10-08',
				supplier: '待比价',
				purchaseReason: '项目扩容'
			},
			startDate: '2026-10-08',
			estimatedCost: 3600
		};
		expect(getApplicationTypeLabel(purchase)).toBe('采购申请');
		expect(getApplicationSummary(purchase)).toContain('显示器');
		expect(getApplicationAmount(purchase)).toBe(3600);
		expect(getApplicationBusinessDate(purchase)).toBe('2026-10-08');
		expect(getApplicationFieldEntries(purchase)).toEqual(
			expect.arrayContaining([
				{ label: '采购物品', value: '显示器' },
				{ label: '采购数量', value: '2' }
			])
		);
		expect(getApplicationSummary(application)).toBe('上海 → 杭州');
		expect(countBySubmittedApplicationType([application, { ...application, status: 'draft' }])).toEqual({
			travel: 1,
			purchase: 0,
			expense: 0,
			overtime: 0
		});
	});

	it('支持表单金额回退、无金额类型和布尔/选项字段格式化', () => {
		expect(getApplicationAmountFromForm('travel', {}, 1800)).toBe(1800);
		expect(getApplicationAmountFromForm('overtime', { durationHours: 8 }, 800)).toBeUndefined();
		const entries = getApplicationFieldEntriesFromForm('expense', {
			expenseType: 'hotel',
			expenseAmount: 1200,
			expenseDate: '2026-09-02',
			expenseDescription: '住宿',
			invoiceAvailable: true
		});
		expect(entries).toEqual(
			expect.arrayContaining([
				{ label: '报销类型', value: '住宿费' },
				{ label: '已有发票', value: '是' }
			])
		);
	});

	it('缺少配置字段时使用安全的未知申请和空摘要', () => {
		const unknown = { ...application, type: 'invalid' as never, formData: {} };
		expect(getApplicationTypeLabel(unknown)).toBe('未知申请');
		expect(getApplicationSummary({ ...unknown, type: 'purchase', description: '采购说明' })).toBe('采购说明');
		expect(getApplicationAmountFromForm(undefined, undefined)).toBeUndefined();
		expect(getApplicationFieldEntriesFromForm(undefined, undefined).length).toBeGreaterThan(0);
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

	it('支持驳回后由申请人编辑并重新提交，且保留审批记录', () => {
		const created = createApplication(input(), application.applicant);
		changeApplicationStatus(created.id, 'pending', 'U001');
		const rejected = changeApplicationStatus(created.id, 'rejected', 'U002', '请补充业务背景');
		expect(rejected?.status).toBe('rejected');
		expect(rejected?.approvalRecords).toHaveLength(1);
		const edited = updateEditableApplication(
			created.id,
			{
				...input(),
				title: '补充说明后的申请',
				description: '补充了客户和项目背景'
			},
			'U001'
		);
		expect(edited?.title).toBe('补充说明后的申请');
		expect(() => updateEditableApplication(created.id, input(), 'U003')).toThrow('只能编辑自己的申请');
		changeApplicationStatus(created.id, 'pending', 'U001');
		expect(edited?.status).toBe('pending');
		expect(edited?.approvalRecords).toHaveLength(1);
		expect(() => updateEditableApplication(created.id, input(), 'U001')).toThrow('只有草稿或已驳回申请可以编辑');
	});

	it('限制草稿编辑、删除和审批权限', () => {
		const created = createApplication(input(), application.applicant);
		expect(updateDraft(created.id, { ...input(), title: '更新草稿' }, 'U001')?.title).toBe('更新草稿');
		expect(() => updateDraft(created.id, input(), 'U003')).toThrow('只能编辑自己的草稿');
		expect(() => changeApplicationStatus(created.id, 'approved', 'U001')).toThrow('不能审批自己的申请');
		expect(() => deleteDraft(created.id, 'U003')).toThrow('只能删除自己的草稿');
		expect(deleteDraft(created.id, 'U001')).toBe(true);
		expect(deleteDraft('missing-id', 'U001')).toBe(false);
	});

	it('按角色限制申请可见范围并支持类型筛选', () => {
		const employee = users.find((user) => user.id === 'U001')!;
		const approverUser = users.find((user) => user.id === 'U002')!;
		const employeeApplications = getApplicationsForUser(employee);
		const approverApplications = getApplicationsForUser(approverUser);
		expect(employeeApplications.every((item) => item.applicant.id === 'U001')).toBe(true);
		expect(approverApplications.every((item) => item.status !== 'draft')).toBe(true);
		const purchasePage = listApplicationsPage({ type: 'purchase', applications: listApplications() });
		expect(purchasePage.data.every((item) => item.type === 'purchase')).toBe(true);
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

	it('覆盖员工提交、审批通过到统计聚合的完整业务链路', () => {
		const employee = users.find((user) => user.id === 'U004')!;
		const before = filterApplicationsByRange(listApplications(), new Date(), 'year');
		const beforeApproved = countBySubmittedStatus(before).approved;
		const beforeCost = sumByMonth(before, new Date(), 'year').data.reduce((total, value) => total + value, 0);
		const created = createApplication(
			{
				...input(),
				type: 'travel',
				title: '客户成功现场支持',
				startDate: offsetDate(1),
				endDate: offsetDate(2),
				estimatedCost: 2600,
				formData: {
					from: '上海',
					to: '杭州',
					startDate: offsetDate(1),
					endDate: offsetDate(2),
					transport: 'train',
					estimatedCost: 2600
				}
			},
			employee
		);
		expect(created.status).toBe('draft');
		expect(changeApplicationStatus(created.id, 'pending', employee.id)?.status).toBe('pending');
		expect(changeApplicationStatus(created.id, 'approved', 'U002')?.status).toBe('approved');

		const after = filterApplicationsByRange(listApplications(), new Date(), 'year');
		expect(countBySubmittedStatus(after).approved).toBe(beforeApproved + 1);
		expect(
			sumByMonth(after, new Date(), 'year').data.reduce((total, value) => total + value, 0)
		).toBeGreaterThanOrEqual(beforeCost + 2600);
	});

	it('覆盖草稿到驳回、再次提交再到通过的完整状态链路', () => {
		const employee = users.find((user) => user.id === 'U001')!;
		const created = createApplication(
			{
				...input(),
				title: '客户成功部现场支持',
				startDate: offsetDate(2),
				endDate: offsetDate(3)
			},
			employee
		);
		expect(created.status).toBe('draft');

		const pending = changeApplicationStatus(created.id, 'pending', employee.id);
		expect(pending?.status).toBe('pending');

		const rejected = changeApplicationStatus(created.id, 'rejected', 'U002', '请补充客户背景');
		expect(rejected?.status).toBe('rejected');
		expect(rejected?.approvalRecords.at(-1)?.comment).toBe('请补充客户背景');

		const edited = updateEditableApplication(
			created.id,
			{ ...input(), title: '客户成功部现场支持（已补充背景）' },
			employee.id
		);
		expect(edited?.status).toBe('rejected');
		expect(edited?.title).toBe('客户成功部现场支持（已补充背景）');

		const resubmitted = changeApplicationStatus(created.id, 'pending', employee.id);
		expect(resubmitted?.status).toBe('pending');
		expect(resubmitted?.approvalRecords).toHaveLength(1);

		const approved = changeApplicationStatus(created.id, 'approved', 'U002', '同意');
		expect(approved?.status).toBe('approved');
		expect(approved?.approvalRecords).toHaveLength(2);
		expect(approved?.approvalRecords.at(-1)?.comment).toBe('同意');
	});
});
