import type { Application } from '$lib/types/application';

const approver = { id: 'U002', name: '李经理', department: '研发部', position: '部门负责人' };

export const supplementalApplications: Application[] = [
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
			supplier: '待比价',
			purchaseReason: '培训现场需要双屏演示和多接口适配，现有设备数量不足。'
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
	}
];
