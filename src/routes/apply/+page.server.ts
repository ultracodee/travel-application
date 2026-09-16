import { fail, redirect } from '@sveltejs/kit';
import { getCurrentUser, hasRole } from '$lib/server/auth';
import {
	changeApplicationStatus,
	createApplication,
	updateEditableApplication
} from '$lib/server/applicationRepository';
import { validateApplicationInput } from '$lib/utils/applicationFormValidation';
import type { TravelApplicationInput } from '$lib/types/application';

function parseInput(formData: FormData): TravelApplicationInput {
	const raw = formData.get('payload');
	if (typeof raw !== 'string') throw new Error('表单数据无效');
	const input = JSON.parse(raw) as TravelApplicationInput;
	if ((input.type ?? 'travel') === 'travel') {
		input.formData = {
			from: input.from,
			to: input.to,
			startDate: input.startDate,
			endDate: input.endDate,
			transport: input.transport,
			estimatedCost: input.estimatedCost,
			...(input.formData ?? {})
		};
	}
	return input;
}

export const actions = {
	save: async ({ request, cookies }) => {
		const user = getCurrentUser(cookies);
		if (!user) return fail(401, { message: '请先登录' });
		if (hasRole(user, 'approver')) return fail(403, { message: '当前用户没有提交申请权限' });

		try {
			const formData = await request.formData();
			const input = parseInput(formData);
			const errors = validateApplicationInput(input);
			if (Object.keys(errors).length > 0) return fail(400, { message: '表单校验失败', errors });
			const id = formDataId(formData);
			if (id) {
				updateEditableApplication(id, input, user.id);
			} else {
				createApplication(input, user);
			}
			return { success: true };
		} catch {
			return fail(400, { message: '草稿保存失败' });
		}
	},
	submit: async ({ request, cookies }) => {
		const user = getCurrentUser(cookies);
		if (!user) return fail(401, { message: '请先登录' });
		if (hasRole(user, 'approver')) return fail(403, { message: '当前用户没有提交申请权限' });

		try {
			const formData = await request.formData();
			const input = parseInput(formData);
			const errors = validateApplicationInput(input);
			if (Object.keys(errors).length > 0) return fail(400, { message: '表单校验失败', errors });
			const id = formDataId(formData);
			const application = id ? updateEditableApplication(id, input, user.id) : createApplication(input, user);
			if (!application) return fail(404, { message: '申请不存在' });
			changeApplicationStatus(application.id, 'pending', user.id);
			throw redirect(303, `/applications/${application.id}`);
		} catch (error) {
			if (error && typeof error === 'object' && 'status' in error) throw error;
			return fail(400, { message: '提交审批失败' });
		}
	}
};

function formDataId(formData: FormData): string | undefined {
	const id = formData.get('id');
	return typeof id === 'string' && id ? id : undefined;
}

export function load({ url }) {
	return { draftId: url.searchParams.get('id') };
}
