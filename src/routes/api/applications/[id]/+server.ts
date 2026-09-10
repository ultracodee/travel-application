import { error, json } from '@sveltejs/kit';
import { changeApplicationStatus, findApplication } from '$lib/server/applicationRepository';
import type { ApplicationStatus } from '$lib/types/application';

export function GET({ params }) {
	const application = findApplication(params.id);
	if (!application) throw error(404, '申请不存在');
	return json({ data: application });
}

export async function PATCH({ params, request }) {
	try {
		const body = (await request.json()) as {
			status?: Extract<ApplicationStatus, 'pending' | 'approved' | 'rejected'>;
			comment?: string;
		};

		if (!body.status || !['pending', 'approved', 'rejected'].includes(body.status)) {
			return json({ message: '不支持的状态' }, { status: 400 });
		}

		const application = changeApplicationStatus(params.id, body.status, body.comment);
		if (!application) throw error(404, '申请不存在');
		return json({ data: application });
	} catch (cause) {
		if (cause instanceof SyntaxError) return json({ message: '请求体格式无效' }, { status: 400 });
		if (cause instanceof Error) return json({ message: cause.message }, { status: 409 });
		throw cause;
	}
}
