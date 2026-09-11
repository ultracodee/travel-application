import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Pagination from '$lib/components/Pagination.svelte';

describe('Pagination.svelte', () => {
	it('renders summary and disables previous button on the first page', async () => {
		render(Pagination, {
			page: 1,
			pageSize: 10,
			total: 25,
			totalPages: 3,
			onPageChange: vi.fn()
		});

		await expect.element(page.getByText('第 1-10 条 / 共 25 条')).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: '上一页' })).toBeDisabled();
		await expect.element(page.getByRole('button', { name: '下一页' })).not.toBeDisabled();
		await expect.element(page.getByRole('button', { name: '1' })).toHaveAttribute('aria-current', 'page');
	});

	it('enables previous and disables next button on the last page', async () => {
		render(Pagination, {
			page: 3,
			pageSize: 10,
			total: 25,
			totalPages: 3,
			onPageChange: vi.fn()
		});

		await expect.element(page.getByText('第 21-25 条 / 共 25 条')).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: '上一页' })).not.toBeDisabled();
		await expect.element(page.getByRole('button', { name: '下一页' })).toBeDisabled();
	});

	it('calls page change callback when a page is clicked', async () => {
		const onPageChange = vi.fn();
		render(Pagination, { page: 1, pageSize: 10, total: 35, totalPages: 4, onPageChange });

		await page.getByRole('button', { name: '2' }).click();
		await vi.waitFor(() => expect(onPageChange).toHaveBeenCalledWith(2));
	});
});
