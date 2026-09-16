import { APPLICATION_TYPE_MAP } from '$lib/config/applicationTypes';
import type { ApplicationInput, ApplicationFieldValue } from '$lib/types/application';

export type ApplicationFormErrors = Record<string, string>;

function getLocalDateString(date = new Date()): string {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(
		2,
		'0'
	)}`;
}

export function validateApplicationInput(input: ApplicationInput): ApplicationFormErrors {
	const errors: ApplicationFormErrors = {};
	if (!input.title?.trim()) errors.title = '请输入申请标题';
	if (!input.description?.trim() && !input.reason?.trim()) errors.description = '请输入申请说明';
	const config = APPLICATION_TYPE_MAP[input.type ?? 'travel'];
	const values = input.formData ?? {};
	for (const field of config.fields) {
		const value = values[field.name] as ApplicationFieldValue | undefined;
		if (field.required && (value === undefined || value === '' || value === false)) {
			errors[field.name] = `请输入${field.label}`;
			continue;
		}
		if (field.type === 'number' && value !== undefined && (typeof value !== 'number' || value <= (field.min ?? 0))) {
			errors[field.name] = `${field.label}必须大于 ${field.min ?? 0}`;
		}
		if (field.maxLength && typeof value === 'string' && value.length > field.maxLength) {
			errors[field.name] = `${field.label}不能超过 ${field.maxLength} 个字符`;
		}
		if (field.minToday && typeof value === 'string' && value < getLocalDateString()) {
			errors[field.name] = `${field.label}不能早于今天`;
		}
		if (field.options && value !== undefined && !field.options.some((option) => option.value === value)) {
			errors[field.name] = `${field.label}选项无效`;
		}
	}
	if (input.type === 'overtime') {
		const start = `${values.overtimeDate ?? ''}T${values.startTime ?? ''}`;
		const end = `${values.endDate ?? ''}T${values.endTime ?? ''}`;
		if (values.overtimeDate && values.startTime && values.endDate && values.endTime && end <= start) {
			errors.endDate = '结束时间必须晚于开始时间';
		}
	}
	return errors;
}
