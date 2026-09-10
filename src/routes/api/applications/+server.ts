import { json } from '@sveltejs/kit';
import { createApplication, listApplications } from '$lib/server/applicationRepository';
import { validateTravelApplication } from '$lib/utils/applicationValidation';
import type { TravelApplicationInput } from '$lib/types/application';
import { getCurrentUser } from '$lib/server/auth';
import { approver } from '$lib/server/applicationRepository';

export function GET({ cookies }) {
	const user = getCurrentUser(cookies);
	if (!user) return json({ message: '请先登录' }, { status: 401 });
	const data = user.roles.includes('approver')
		? listApplications()
		: listApplications().filter((application) => application.applicant.id === user.id);
	return json({ data });
}

export async function POST({ request, cookies }) {
	try {
		const user = getCurrentUser(cookies);
		if (!user) return json({ message: '请先登录' }, { status: 401 });
		if (!user.roles.includes('employee')) return json({ message: '当前用户没有提交申请权限' }, { status: 403 });
		const input = (await request.json()) as TravelApplicationInput;
		const errors = validateTravelApplication(input);

		if (Object.keys(errors).length > 0) {
			return json({ message: '表单校验失败', errors }, { status: 400 });
		}

		return json({ data: createApplication(input, user, approver.id) }, { status: 201 });
	} catch {
		return json({ message: '请求体格式无效' }, { status: 400 });
	}
}
