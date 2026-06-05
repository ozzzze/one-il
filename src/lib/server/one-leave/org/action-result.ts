import { fail } from '@sveltejs/kit';

export function actionFail(
	status: number,
	message: string,
	variant: 'error' | 'warning' = 'error'
): ReturnType<typeof fail> {
	return fail(status, { error: message, toastVariant: variant });
}

export function actionSuccess(message: string): { success: true; message: string } {
	return { success: true, message };
}
