<script lang="ts">
	let {
		page,
		pageSize,
		total,
		totalPages,
		onPageChange
	}: {
		page: number;
		pageSize: number;
		total: number;
		totalPages: number;
		onPageChange: (page: number) => void;
	} = $props();

	let from = $derived(total === 0 ? 0 : (page - 1) * pageSize + 1);
	let to = $derived(Math.min(total, page * pageSize));
	let pageNumbers = $derived(
		Array.from({ length: totalPages }, (_, index) => index + 1).filter(
			(item) => item === 1 || item === totalPages || Math.abs(item - page) <= 1
		)
	);
</script>

<div class="pagination" aria-label="分页导航">
	<div class="summary">第 {from}-{to} 条 / 共 {total} 条</div>
	<div class="controls">
		<button type="button" disabled={page <= 1} onclick={() => onPageChange(page - 1)}>上一页</button>
		{#each pageNumbers as item, index}
			{#if index > 0 && item - pageNumbers[index - 1] > 1}<span class="ellipsis">…</span>{/if}
			<button type="button" class:active={item === page} aria-current={item === page ? 'page' : undefined} onclick={() => onPageChange(item)}>{item}</button>
		{/each}
		<button type="button" disabled={page >= totalPages} onclick={() => onPageChange(page + 1)}>下一页</button>
	</div>
</div>

<style>
	.pagination { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-top: 16px; color: #7b879a; font-size: 12px; }
	.controls { display: flex; align-items: center; gap: 6px; }
	button { min-width: 32px; height: 32px; padding: 0 10px; border: 1px solid #dfe5ee; border-radius: 8px; background: white; color: #44516a; font-size: 12px; font-weight: 650; cursor: pointer; }
	button:hover:not(:disabled), button.active { border-color: #3975f6; color: #3975f6; background: #eef4ff; }
	button:disabled { opacity: .5; cursor: not-allowed; }
	.ellipsis { padding: 0 4px; color: #9aa4b5; }
	@media (max-width: 620px) { .pagination { align-items: flex-start; flex-direction: column; } .controls { flex-wrap: wrap; } }
</style>
