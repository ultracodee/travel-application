import type { TravelApplicationInput } from '$lib/types/application';

export type ValidationErrors = Partial<Record<keyof TravelApplicationInput | 'dateRange', string>>;

export function validateTravelApplication(input: TravelApplicationInput): ValidationErrors {
	const errors: ValidationErrors = {};

	if (!input.applicant.name.trim()) errors.applicant = '请输入申请人姓名';
	if (!input.applicant.department.trim()) errors.applicant = '请输入所属部门';
	if (!input.from.trim()) errors.from = '请输入出发地';
	if (!input.to.trim()) errors.to = '请输入目的地';
	if (input.from.trim() && input.to.trim() && input.from.trim() === input.to.trim()) {
		errors.to = '出发地和目的地不能相同';
	}
	if (!input.startDate) errors.startDate = '请选择出差开始日期';
	if (!input.endDate) errors.endDate = '请选择出差结束日期';
	if (input.startDate && input.endDate && input.endDate < input.startDate) {
		errors.dateRange = '结束日期不能早于开始日期';
	}
	if (!input.reason.trim()) errors.reason = '请输入出差事由';
	if (!Number.isFinite(input.estimatedCost) || input.estimatedCost < 0) {
		errors.estimatedCost = '预计费用必须是非负数字';
	}

	return errors;
}

export function isValidTravelApplication(input: TravelApplicationInput): boolean {
	return Object.keys(validateTravelApplication(input)).length === 0;
}
