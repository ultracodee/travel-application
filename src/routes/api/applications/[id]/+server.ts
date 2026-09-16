import { error, json } from '@sveltejs/kit';
import {
	changeApplicationStatus,
	deleteDraft,
	findApplication,
	updateEditableApplication
} from '$lib/server/applicationRepository';
import type { ApplicationStatus, TravelApplicationInput } from '$lib/types/application';
import { getCurrentUser, hasRole } from '$lib/server/auth';
import { validateTravelApplication } from '$lib/utils/applicationValidation';
import { validateApplicationInput } from '$lib/utils/applicationFormValidation';

export function GET({ params, cookies }) {
	const user = getCurrentUser(cookies);
	if (!user) return json({ message: '请先登录' }, { status: 401 });
	const application = findApplication(params.id);
	if (!application) throw error(404, '申请不存在');
	if (!hasRole(user, 'approver') && application.applicant.id !== user.id) {
		return json({ message: '无权查看该申请' }, { status: 403 });
	}
	return json({ data: application });
}

export async function PATCH({ params, request, cookies }) {
	try {
		const user = getCurrentUser(cookies);
		if (!user) return json({ message: '请先登录' }, { status: 401 });
		const body = (await request.json()) as {
			status?: Extract<ApplicationStatus, 'pending' | 'approved' | 'rejected'>;
			comment?: string;
		};

		if (!body.status || !['pending', 'approved', 'rejected'].includes(body.status)) {
			return json({ message: '不支持的状态' }, { status: 400 });
		}
		if (body.status === 'pending') {
			if (applicationOwner(params.id, user.id) === false) {
				return json({ message: '只有申请人可以提交自己的申请' }, { status: 403 });
			}
		} else if (!hasRole(user, 'approver')) {
			return json({ message: '当前用户没有审批权限' }, { status: 403 });
		}

		const application = changeApplicationStatus(params.id, body.status, user.id, body.comment);
		if (!application) throw error(404, '申请不存在');
		return json({ data: application });
	} catch (cause) {
		if (cause instanceof SyntaxError) return json({ message: '请求体格式无效' }, { status: 400 });
		if (cause instanceof Error && cause.message.includes('不能审批自己'))
			return json({ message: cause.message }, { status: 403 });
		if (cause instanceof Error && cause.message.includes('指定审批人'))
			return json({ message: cause.message }, { status: 403 });
		if (cause instanceof Error) return json({ message: cause.message }, { status: 409 });
		throw cause;
	}
}

export async function PUT({ params, request, cookies }) {
	try {
		const user = getCurrentUser(cookies);
		if (!user) return json({ message: '请先登录' }, { status: 401 });
		const input = (await request.json()) as TravelApplicationInput;
		const errors = {
			...((input.type ?? 'travel') === 'travel' ? validateTravelApplication(input) : {}),
			...validateApplicationInput(input)
		};
		if (Object.keys(errors).length > 0) return json({ message: '表单校验失败', errors }, { status: 400 });
		const application = updateEditableApplication(params.id, input, user.id);
		if (!application) throw error(404, '申请不存在');
		return json({ data: application });
	} catch (cause) {
		if (cause instanceof SyntaxError) return json({ message: '请求体格式无效' }, { status: 400 });
		if (cause instanceof Error && (cause.message.includes('草稿') || cause.message.includes('只能编辑'))) {
			return json({ message: cause.message }, { status: 403 });
		}
		throw cause;
	}
}

export function DELETE({ params, cookies }) {
	try {
		const user = getCurrentUser(cookies);
		if (!user) return json({ message: '请先登录' }, { status: 401 });
		if (!deleteDraft(params.id, user.id)) throw error(404, '申请不存在');
		return new Response(null, { status: 204 });
	} catch (cause) {
		if (cause instanceof Error && (cause.message.includes('草稿') || cause.message.includes('只能删除'))) {
			return json({ message: cause.message }, { status: 403 });
		}
		throw cause;
	}
}

function applicationOwner(id: string, userId: string) {
	const application = findApplication(id);
	return application ? application.applicant.id === userId : false;
}
