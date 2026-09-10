import { json } from '@sveltejs/kit';
import { createApplication, listApplications } from '$lib/server/applicationRepository';
import { validateTravelApplication } from '$lib/utils/applicationValidation';
import type { TravelApplicationInput } from '$lib/types/application';

export function GET() {
	return json({ data: listApplications() });
}

export async function POST({ request }) {
	try {
		const input = (await request.json()) as TravelApplicationInput;
		const errors = validateTravelApplication(input);

		if (Object.keys(errors).length > 0) {
			return json({ message: '表单校验失败', errors }, { status: 400 });
		}

		return json({ data: createApplication(input) }, { status: 201 });
	} catch {
		return json({ message: '请求体格式无效' }, { status: 400 });
	}
}
