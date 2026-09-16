import { APPLICATION_TYPE_MAP } from '$lib/config/applicationTypes';
import type {
	Application,
	ApplicationFieldConfig,
	ApplicationFieldValue,
	ApplicationType
} from '$lib/types/application';

export function getApplicationTypeLabel(application: Application): string {
	return APPLICATION_TYPE_MAP[application.type]?.label ?? '未知申请';
}

export function getApplicationSummary(application: Application): string {
	if (application.type === 'travel') return `${application.from} → ${application.to}`;

	const config = APPLICATION_TYPE_MAP[application.type];
	const values = config.summaryFields
		.map((fieldName) =>
			formatFieldValue(
				config.fields.find((field) => field.name === fieldName),
				application.formData[fieldName]
			)
		)
		.filter(Boolean);

	return values.length > 0 ? values.join(' / ') : application.description;
}

export function getApplicationAmount(application: Application): number | undefined {
	return getApplicationAmountFromForm(application.type, application.formData, application.estimatedCost);
}

export function getApplicationAmountFromForm(
	type: ApplicationType | undefined,
	formData: Record<string, ApplicationFieldValue> | undefined,
	fallback?: number
): number | undefined {
	const amountField = APPLICATION_TYPE_MAP[type ?? 'travel']?.amountField;
	if (!amountField) return undefined;
	const value = formData?.[amountField];
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (fallback !== undefined && Number.isFinite(fallback)) return fallback;
	return undefined;
}

export function getApplicationBusinessDate(application: Application): string {
	if (application.type === 'travel') return application.startDate;
	const dateField = APPLICATION_TYPE_MAP[application.type]?.fields.find((field) => field.type === 'date')?.name;
	const value = dateField ? application.formData[dateField] : undefined;
	return typeof value === 'string' && value ? value : application.startDate;
}

export function getApplicationFieldEntries(application: Application): Array<{ label: string; value: string }> {
	return getApplicationFieldEntriesFromForm(application.type, application.formData);
}

export function getApplicationFieldEntriesFromForm(
	type: ApplicationType | undefined,
	formData: Record<string, ApplicationFieldValue> | undefined
): Array<{ label: string; value: string }> {
	const config = APPLICATION_TYPE_MAP[type ?? 'travel'];
	return config.fields.map((field) => ({
		label: field.label,
		value: formatFieldValue(field, formData?.[field.name]) || '—'
	}));
}

function formatFieldValue(field: ApplicationFieldConfig | undefined, value: ApplicationFieldValue | undefined): string {
	if (value === undefined || value === '') return '';
	if (field?.type === 'checkbox') return value ? '是' : '否';
	if (field?.type === 'number') return typeof value === 'number' ? value.toLocaleString() : String(value);
	const option = field?.options?.find((item) => item.value === value);
	return option?.label ?? String(value);
}
