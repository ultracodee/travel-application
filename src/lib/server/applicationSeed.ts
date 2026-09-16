import type {
	Application,
	ApplicationFieldValue,
	ApplicationStatus,
	ApplicationType,
	ApprovalRecord
} from '$lib/types/application';

const approver = { id: 'U002', name: '李经理', department: '研发部', position: '部门负责人' };

const seedEmployees = [
	{ id: 'U001', name: '张三', department: '研发部', position: '前端开发' },
	{ id: 'U003', name: '王芳', department: '市场部', position: '市场专员' },
	{ id: 'U004', name: '陈敏', department: '客户成功部', position: '客户成功专员' }
];

const generatedStatuses: ApplicationStatus[] = [
	'approved',
	'pending',
	'rejected',
	'approved',
	'pending',
	'approved',
	'rejected',
	'pending',
	'approved',
	'draft'
];

function generatedApplication(type: ApplicationType, index: number): Application {
	const employee = seedEmployees[index % seedEmployees.length];
	const month = 10 + index;
	const year = month > 12 ? 2026 : 2025;
	const normalizedMonth = month > 12 ? month - 12 : month;
	const recentDates = ['2026-09-05', '2026-09-04', '2026-08-28', '2026-08-20'];
	const date =
		recentDates[index] ??
		`${year}-${String(normalizedMonth).padStart(2, '0')}-${String(8 + (index % 10)).padStart(2, '0')}`;
	const status = generatedStatuses[index];
	const idPrefix = type === 'travel' ? 'TRV' : type === 'purchase' ? 'PUR' : type === 'expense' ? 'EXP' : 'OVT';
	const applicant = { ...employee };
	const approvalRecords: ApprovalRecord[] =
		status === 'approved' || status === 'rejected'
			? [
					{
						id: `APR-${idPrefix}-GEN-${index + 1}`,
						approver: { ...approver },
						action: status === 'approved' ? 'approved' : 'rejected',
						comment: status === 'approved' ? '审批通过' : '请补充业务说明',
						operatedAt: `${date}T15:00:00.000Z`
					}
				]
			: [];
	const amount = type === 'overtime' ? 0 : 800 + index * 260;
	const formData: Record<string, ApplicationFieldValue> =
		type === 'travel'
			? {
					from: '上海',
					to: ['杭州', '北京', '深圳', '成都'][index % 4],
					startDate: date,
					endDate: date,
					transport: index % 2 ? 'flight' : 'train',
					estimatedCost: amount
				}
			: type === 'purchase'
				? {
						itemName: ['测试设备', '办公显示器', '客户演示套件'][index % 3],
						quantity: 1 + (index % 5),
						budgetAmount: amount,
						expectedDate: date,
						purchaseReason: '部门业务开展需要补充物资。',
						remark: '按部门预算执行。'
					}
				: type === 'expense'
					? {
							expenseType: index % 2 ? 'transport' : 'office',
							expenseAmount: amount,
							expenseDate: date,
							expenseDescription: '部门日常业务产生的费用。',
							invoiceAvailable: true,
							accountLastFour: `${5200 + index}`
						}
					: {
							project: ['版本发布', '客户上线', '专项交付'][index % 3],
							overtimeDate: date,
							startTime: '19:00',
							endTime: '22:00',
							durationHours: 3,
							overtimeReason: '保障项目节点按计划完成。',
							timeOff: index % 2 === 0
						};

	return {
		id: `${idPrefix}-GEN-${String(index + 1).padStart(3, '0')}`,
		type,
		title: `${applicant.name}${type === 'travel' ? '客户支持出差' : type === 'purchase' ? '部门物资采购' : type === 'expense' ? '业务费用报销' : '项目加班申请'}`,
		description: '部门日常业务申请。',
		applicant,
		approverId: approver.id,
		formData,
		from: type === 'travel' ? '上海' : '',
		to: type === 'travel' ? String(formData.to) : '',
		startDate: date,
		endDate: date,
		reason: '部门日常业务申请。',
		transport: type === 'travel' ? (formData.transport as Application['transport']) : 'other',
		estimatedCost: amount,
		status,
		approvalRecords,
		createdAt: `${date}T09:00:00.000Z`,
		updatedAt: `${date}T15:00:00.000Z`
	};
}

export const supplementalApplications: Application[] = [
	{
		id: 'PUR-202608-002',
		type: 'purchase',
		title: '研发测试设备采购',
		description: '补充自动化测试和移动端兼容性验证设备。',
		applicant: { id: 'U001', name: '张三', department: '研发部', position: '前端开发' },
		approverId: approver.id,
		formData: {
			itemName: '移动测试设备',
			quantity: 3,
			budgetAmount: 4200,
			expectedDate: '2026-08-20',
			purchaseReason: '支持新版本多设备兼容性测试。',
			remark: '纳入研发部季度设备预算。'
		},
		from: '',
		to: '',
		startDate: '2026-08-20',
		endDate: '2026-08-20',
		reason: '研发测试设备补充',
		transport: 'other',
		estimatedCost: 4200,
		status: 'approved',
		approvalRecords: [
			{
				id: 'APR-PUR-202608-002',
				approver: { ...approver },
				action: 'approved',
				comment: '同意采购',
				operatedAt: '2026-08-12T10:00:00.000Z'
			}
		],
		createdAt: '2026-08-10T09:00:00.000Z',
		updatedAt: '2026-08-12T10:00:00.000Z'
	},
	{
		id: 'PUR-202609-001',
		type: 'purchase',
		title: '客户成功部培训设备采购',
		description: '为新客户培训补充便携显示器与转接设备。',
		applicant: { id: 'U004', name: '陈敏', department: '客户成功部', position: '客户成功专员' },
		approverId: approver.id,
		formData: {
			itemName: '便携显示器及转接设备',
			quantity: 6,
			budgetAmount: 6800,
			expectedDate: '2026-09-25',
			purchaseReason: '培训现场需要双屏演示和多接口适配，现有设备数量不足。',
			remark: '优先选择可开具增值税专用发票的供应商。'
		},
		from: '',
		to: '',
		startDate: '2026-09-25',
		endDate: '2026-09-25',
		reason: '客户培训设备补充',
		transport: 'other',
		estimatedCost: 6800,
		status: 'pending',
		approvalRecords: [],
		createdAt: '2026-09-09T09:30:00.000Z',
		updatedAt: '2026-09-09T09:30:00.000Z'
	},
	{
		id: 'EXP-202608-001',
		type: 'expense',
		title: '市场活动交通费用报销',
		description: '报销华东区域市场活动期间产生的交通费用。',
		applicant: { id: 'U003', name: '王芳', department: '市场部', position: '市场专员' },
		approverId: approver.id,
		formData: {
			expenseType: 'transport',
			expenseAmount: 1260,
			expenseDate: '2026-08-28',
			expenseDescription: '华东区域市场活动期间市内交通及客户拜访交通费用。',
			invoiceAvailable: true,
			accountLastFour: '5821'
		},
		from: '',
		to: '',
		startDate: '2026-08-28',
		endDate: '2026-08-28',
		reason: '市场活动交通费用',
		transport: 'other',
		estimatedCost: 1260,
		status: 'approved',
		approvalRecords: [
			{
				id: 'APR-EXP-202608-001',
				approver: { ...approver },
				action: 'approved',
				comment: '票据齐全，同意报销',
				operatedAt: '2026-09-02T10:00:00.000Z'
			}
		],
		createdAt: '2026-08-29T09:00:00.000Z',
		updatedAt: '2026-09-02T10:00:00.000Z'
	},
	{
		id: 'OVT-202607-001',
		type: 'overtime',
		title: '版本发布周末加班申请',
		description: '配合版本发布完成上线验证和问题跟踪。',
		applicant: { id: 'U001', name: '张三', department: '研发部', position: '前端开发' },
		approverId: approver.id,
		formData: {
			project: '版本发布保障',
			overtimeDate: '2026-07-18',
			startTime: '09:00',
			endTime: '18:00',
			durationHours: 8,
			overtimeReason: '配合版本发布完成上线验证、监控观察和问题跟踪。',
			timeOff: true
		},
		from: '',
		to: '',
		startDate: '2026-07-18',
		endDate: '2026-07-18',
		reason: '版本发布保障',
		transport: 'other',
		estimatedCost: 0,
		status: 'rejected',
		approvalRecords: [
			{
				id: 'APR-OVT-202607-001',
				approver: { ...approver },
				action: 'rejected',
				comment: '调整为工作日完成发布',
				operatedAt: '2026-07-15T11:00:00.000Z'
			}
		],
		createdAt: '2026-07-14T09:00:00.000Z',
		updatedAt: '2026-07-15T11:00:00.000Z'
	},
	{
		id: 'EXP-202607-002',
		type: 'expense',
		title: '客户活动物料费用报销',
		description: '报销市场活动物料和现场布置费用。',
		applicant: { id: 'U003', name: '王芳', department: '市场部', position: '市场专员' },
		approverId: approver.id,
		formData: {
			expenseType: 'office',
			expenseAmount: 860,
			expenseDate: '2026-07-22',
			expenseDescription: '客户活动现场物料及布置费用。',
			invoiceAvailable: true,
			accountLastFour: '6138'
		},
		from: '',
		to: '',
		startDate: '2026-07-22',
		endDate: '2026-07-22',
		reason: '客户活动费用报销',
		transport: 'other',
		estimatedCost: 860,
		status: 'pending',
		approvalRecords: [],
		createdAt: '2026-07-23T09:00:00.000Z',
		updatedAt: '2026-07-23T09:00:00.000Z'
	},
	{
		id: 'OVT-202608-002',
		type: 'overtime',
		title: '客户上线支持加班申请',
		description: '配合客户上线窗口完成系统验证和问题响应。',
		applicant: { id: 'U004', name: '陈敏', department: '客户成功部', position: '客户成功专员' },
		approverId: approver.id,
		formData: {
			project: '客户上线支持',
			overtimeDate: '2026-08-15',
			startTime: '10:00',
			endTime: '19:00',
			durationHours: 8,
			overtimeReason: '配合客户上线完成验证和问题响应。',
			timeOff: true
		},
		from: '',
		to: '',
		startDate: '2026-08-15',
		endDate: '2026-08-15',
		reason: '客户上线支持',
		transport: 'other',
		estimatedCost: 0,
		status: 'approved',
		approvalRecords: [
			{
				id: 'APR-OVT-202608-002',
				approver: { ...approver },
				action: 'approved',
				comment: '同意调休安排',
				operatedAt: '2026-08-13T11:00:00.000Z'
			}
		],
		createdAt: '2026-08-12T09:00:00.000Z',
		updatedAt: '2026-08-13T11:00:00.000Z'
	},
	...(['travel', 'purchase', 'expense', 'overtime'] as ApplicationType[]).flatMap((type) =>
		Array.from({ length: 10 }, (_, index) => generatedApplication(type, index))
	)
];
