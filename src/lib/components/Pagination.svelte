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

<div
	class="flex items-center justify-between gap-4 pt-4 text-xs text-[#7b879a] max-[620px]:items-start max-[620px]:flex-col"
	aria-label="分页导航"
>
	<div>第 {from}-{to} 条 / 共 {total} 条</div>
	<div class="flex items-center gap-1.5 max-[620px]:flex-wrap">
		<button
			class="h-8 rounded-lg border border-[#dfe5ee] bg-white px-2.5 text-xs font-semibold text-[#44516a] transition-colors hover:border-[#3975f6] hover:bg-[#eef4ff] hover:text-[#3975f6] disabled:cursor-not-allowed disabled:opacity-50"
			type="button"
			disabled={page <= 1}
			onclick={() => onPageChange(page - 1)}>上一页</button
		>
		{#each pageNumbers as item, index (item)}
			{#if index > 0 && item - pageNumbers[index - 1] > 1}<span class="px-1 text-[#9aa4b5]">…</span>{/if}
			<button
				class={`h-8 min-w-8 rounded-lg border px-2.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${item === page ? 'border-[#3975f6] bg-[#eef4ff] text-[#3975f6]' : 'border-[#dfe5ee] bg-white text-[#44516a] hover:border-[#3975f6] hover:bg-[#eef4ff] hover:text-[#3975f6]'}`}
				type="button"
				aria-current={item === page ? 'page' : undefined}
				onclick={() => onPageChange(item)}>{item}</button
			>
		{/each}
		<button
			class="h-8 min-w-8 rounded-lg border border-[#dfe5ee] bg-white px-2.5 text-xs font-semibold text-[#44516a] transition-colors hover:border-[#3975f6] hover:bg-[#eef4ff] hover:text-[#3975f6] disabled:cursor-not-allowed disabled:opacity-50"
			type="button"
			disabled={page >= totalPages}
			onclick={() => onPageChange(page + 1)}>下一页</button
		>
	</div>
</div>
