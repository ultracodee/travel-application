import type { ApplicationTypeConfig } from '$lib/types/application';

export const APPLICATION_TYPE_CONFIGS: ApplicationTypeConfig[] = [
	{
		type: 'travel',
		label: '差旅申请',
		description: '用于客户拜访、项目支持和业务出行。',
		amountField: 'estimatedCost',
		summaryFields: ['from', 'to', 'startDate', 'endDate'],
		fields: [
			{ name: 'from', label: '出发城市', type: 'text', required: true },
			{ name: 'to', label: '目的城市', type: 'text', required: true },
			{ name: 'startDate', label: '出发日期', type: 'date', required: true },
			{ name: 'endDate', label: '返回日期', type: 'date', required: true },
			{
				name: 'transport',
				label: '交通方式',
				type: 'select',
				required: true,
				options: [
					{ label: '高铁/火车', value: 'train' },
					{ label: '飞机', value: 'flight' },
					{ label: '自驾', value: 'car' },
					{ label: '其他', value: 'other' }
				]
			},
			{ name: 'estimatedCost', label: '预计费用', type: 'number', required: true, min: 0 }
		]
	},
	{
		type: 'purchase',
		label: '采购申请',
		description: '用于办公物品、项目设备和服务采购。',
		amountField: 'budgetAmount',
		summaryFields: ['itemName', 'quantity', 'budgetAmount', 'expectedDate'],
		fields: [
			{ name: 'itemName', label: '采购物品', type: 'text', required: true },
			{ name: 'quantity', label: '采购数量', type: 'number', required: true, min: 1, suffix: '件' },
			{ name: 'budgetAmount', label: '预算金额', type: 'number', required: true, min: 0, suffix: '元' },
			{ name: 'expectedDate', label: '期望到货日期', type: 'date', required: true, minToday: true },
			{ name: 'purchaseReason', label: '采购原因', type: 'textarea', required: true, fullWidth: true },
			{ name: 'remark', label: '备注', type: 'textarea', fullWidth: true }
		]
	},
	{
		type: 'expense',
		label: '报销申请',
		description: '用于差旅、招待和日常办公费用报销。',
		amountField: 'expenseAmount',
		summaryFields: ['expenseType', 'expenseAmount', 'expenseDate', 'invoiceAvailable'],
		fields: [
			{
				name: 'expenseType',
				label: '报销类型',
				type: 'select',
				required: true,
				options: [
					{ label: '交通费', value: 'transport' },
					{ label: '住宿费', value: 'hotel' },
					{ label: '招待费', value: 'entertainment' },
					{ label: '办公费', value: 'office' }
				]
			},
			{ name: 'expenseAmount', label: '报销金额', type: 'number', required: true, min: 0, suffix: '元' },
			{ name: 'expenseDate', label: '费用发生日期', type: 'date', required: true },
			{ name: 'invoiceAvailable', label: '已有发票', type: 'checkbox', required: true },
			{ name: 'expenseDescription', label: '费用说明', type: 'textarea', required: true, fullWidth: true },
			{ name: 'accountLastFour', label: '收款账户后四位', type: 'text', maxLength: 4 }
		]
	},
	{
		type: 'overtime',
		label: '加班申请',
		description: '用于工作日或休息日的计划加班申请。',
		summaryFields: ['project', 'overtimeDate', 'startTime', 'endDate', 'endTime', 'durationHours', 'timeOff'],
		fields: [
			{ name: 'project', label: '项目', type: 'text', required: true },
			{ name: 'overtimeDate', label: '加班日期', type: 'date', required: true, minToday: true },
			{ name: 'startTime', label: '开始时间', type: 'time', required: true },
			{ name: 'endDate', label: '结束日期', type: 'date', required: true, minToday: true },
			{ name: 'endTime', label: '结束时间', type: 'time', required: true },
			{
				name: 'durationHours',
				label: '预计加班时长',
				type: 'number',
				required: true,
				min: 0,
				suffix: '小时',
				readonly: true
			},
			{ name: 'overtimeReason', label: '加班原因', type: 'textarea', required: true, fullWidth: true },
			{ name: 'timeOff', label: '申请调休', type: 'checkbox' }
		]
	}
];

export const APPLICATION_TYPE_MAP = Object.fromEntries(
	APPLICATION_TYPE_CONFIGS.map((config) => [config.type, config])
) as Record<ApplicationTypeConfig['type'], ApplicationTypeConfig>;
