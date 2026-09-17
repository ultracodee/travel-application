<script lang="ts">
	import { onMount } from 'svelte';
	import {
		APPLICATION_STATUS_LABEL,
		APPLICATION_TYPE_LABEL,
		type ApplicationStatus,
		type ApplicationType,
		type TravelApplication
	} from '$lib/types/application';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import { getAuthState, hasRole } from '$lib/client/auth';
	import {
		getApplicationAmount,
		getApplicationBusinessDate,
		getApplicationSummary,
		getApplicationTypeLabel
	} from '$lib/utils/applicationDisplay';

	let applications = $state<TravelApplication[]>([]);
	let loading = $state(true);
	let keyword = $state('');
	let status = $state<'all' | ApplicationStatus>('all');
	let type = $state<'all' | ApplicationType>('all');
	let isApprover = $state(false);
	let deletingId = $state('');
	let page = $state(1);
	let pageSize = $state(10);
	let total = $state(0);
	let totalPages = $state(1);
	let requestId = 0;

	onMount(async () => {
		const auth = await getAuthState();
		isApprover = hasRole(auth.data, 'approver');
		await loadApplications();
	});

	async function loadApplications() {
		const currentRequest = ++requestId;
		loading = true;
		const params = new URLSearchParams({
			page: String(page),
			pageSize: String(pageSize),
			status,
			type,
			keyword
		});
		try {
			const response = await fetch(`/api/applications?${params}`);
			if (!response.ok) return;
			const result = await response.json();
			if (currentRequest !== requestId) return;
			applications = result.data;
			total = result.pagination?.total ?? result.data.length;
			totalPages = result.pagination?.totalPages ?? 1;
			page = result.pagination?.page ?? page;
		} finally {
			if (currentRequest === requestId) loading = false;
		}
	}

	function applyFilters() {
		page = 1;
		loadApplications();
	}

	function changePage(nextPage: number) {
		if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
		page = nextPage;
		loadApplications();
	}

	async function deleteDraft(id: string) {
		if (!confirm('确定删除这条草稿申请吗？')) return;
		deletingId = id;
		try {
			const response = await fetch(`/api/applications/${id}`, { method: 'DELETE' });
			if (response.ok) await loadApplications();
		} finally {
			deletingId = '';
		}
	}
</script>

<svelte:head><title>{isApprover ? '审批管理' : '我的申请'} - 申请管理</title></svelte:head>

<div class="page-heading">
	<div>
		<h1>{isApprover ? '审批管理' : '我的申请'}</h1>
		<p>{isApprover ? '查看并处理全部员工的申请。' : '查看我提交的申请。'}</p>
	</div>
	{#if !isApprover}<a class="primary-button" href="/apply">＋ 新建申请</a>{/if}
</div>

<section class="panel px-6 py-5 max-[620px]:p-4">
	<div class="mb-[18px] flex justify-end gap-3.5 max-[620px]:flex-col">
		<div class="relative max-w-[360px] flex-1 max-[620px]:max-w-none">
			<span class="absolute top-0 left-3 text-[27px] text-[#8995a8]">⌕</span><input
				class="h-10 w-full rounded-lg border border-[#dfe5ee] bg-white pr-3 pl-9 text-[#33405a] outline-none focus:border-[#3975f6] focus:shadow-[0_0_0_3px_#3975f61c]"
				aria-label="搜索申请"
				placeholder="搜索编号、申请人或目的地"
				bind:value={keyword}
				onkeydown={(event) => event.key === 'Enter' && applyFilters()}
			/>
		</div>
		<select
			class="h-10 min-w-[130px] rounded-lg border border-[#dfe5ee] bg-white px-2.5 text-[#33405a] outline-none focus:border-[#3975f6] focus:shadow-[0_0_0_3px_#3975f61c] max-[620px]:w-full"
			aria-label="按状态筛选"
			bind:value={status}
			onchange={applyFilters}
		>
			<option value="all">全部状态</option>
			{#each Object.entries(APPLICATION_STATUS_LABEL).filter(([key]) => !isApprover || key !== 'draft') as [key, label] (key)}<option
					value={key}>{label}</option
				>{/each}
		</select>
		<select
			class="h-10 min-w-[130px] rounded-lg border border-[#dfe5ee] bg-white px-2.5 text-[#33405a] outline-none focus:border-[#3975f6] focus:shadow-[0_0_0_3px_#3975f61c] max-[620px]:w-full"
			aria-label="按类型筛选"
			bind:value={type}
			onchange={applyFilters}
		>
			<option value="all">全部类型</option>
			{#each Object.entries(APPLICATION_TYPE_LABEL) as [key, label] (key)}<option value={key}>{label}</option>{/each}
		</select>
		<button
			class="h-10 cursor-pointer rounded-lg bg-[#3975f6] px-4 font-semibold text-white"
			type="button"
			onclick={applyFilters}>搜索</button
		>
	</div>
	{#if loading}
		<div class="grid min-h-[280px] place-content-center justify-items-center gap-2 text-[13px] text-[#8a95a8]">
			正在加载申请记录…
		</div>
	{:else if applications.length === 0}
		<div class="grid min-h-[280px] place-content-center justify-items-center gap-2 text-[13px] text-[#8a95a8]">
			<div class="text-[30px] text-[#3975f6]">▤</div>
			<strong class="text-base text-[#44516a]">暂无匹配申请</strong><span>可以新建一条申请。</span>
		</div>
	{:else}
		<div class="overflow-x-auto">
			<table class="w-full min-w-[920px] border-collapse">
				<thead
					><tr
						><th class="bg-[#f8f9fc] px-2.5 py-3 text-left text-xs font-semibold text-[#8a95a8]">申请编号</th><th
							class="bg-[#f8f9fc] px-2.5 py-3 text-left text-xs font-semibold text-[#8a95a8]">申请类型</th
						><th class="bg-[#f8f9fc] px-2.5 py-3 text-left text-xs font-semibold text-[#8a95a8]">申请人</th><th
							class="w-[180px] max-w-[180px] bg-[#f8f9fc] px-2.5 py-3 text-left text-xs font-semibold text-[#8a95a8]"
							>申请摘要</th
						><th class="bg-[#f8f9fc] px-2.5 py-3 text-left text-xs font-semibold text-[#8a95a8]">业务日期</th><th
							class="bg-[#f8f9fc] px-2.5 py-3 text-left text-xs font-semibold text-[#8a95a8]">预计金额</th
						><th class="bg-[#f8f9fc] px-2.5 py-3 text-left text-xs font-semibold text-[#8a95a8]">状态</th><th
							class="bg-[#f8f9fc] px-2.5 py-3 text-left text-xs font-semibold text-[#8a95a8]">操作</th
						></tr
					></thead
				>
				<tbody>
					{#each applications as item (item.id)}
						<tr>
							<td class="border-b border-[#edf0f5] px-2.5 py-4 text-[13px] whitespace-nowrap text-[#46536b]"
								><a class="font-semibold text-[#3975f6]" href={`/applications/${item.id}`}>{item.id}</a></td
							>
							<td class="border-b border-[#edf0f5] px-2.5 py-4 text-[13px] whitespace-nowrap text-[#46536b]"
								><strong class="block">{getApplicationTypeLabel(item)}</strong><small
									class="mt-1 block text-[11px] text-[#9aa4b5]">{item.title}</small
								></td
							>
							<td class="border-b border-[#edf0f5] px-2.5 py-4 text-[13px] whitespace-nowrap text-[#46536b]"
								><strong class="block">{item.applicant.name}</strong><small
									class="mt-1 block text-[11px] text-[#9aa4b5]">{item.applicant.department}</small
								></td
							>
							<td
								class="w-[180px] max-w-[180px] overflow-hidden border-b border-[#edf0f5] px-2.5 py-4 text-[13px] text-ellipsis whitespace-nowrap text-[#46536b]"
								>{getApplicationSummary(item)}</td
							>
							<td class="border-b border-[#edf0f5] px-2.5 py-4 text-[13px] whitespace-nowrap text-[#46536b]"
								>{getApplicationBusinessDate(item)}</td
							>
							<td class="border-b border-[#edf0f5] px-2.5 py-4 text-[13px] whitespace-nowrap text-[#46536b]"
								>{#if getApplicationAmount(item) !== undefined}¥ {getApplicationAmount(item)?.toFixed(2)}{:else}<span
										class="text-[11px] text-[#9aa4b5]">—</span
									>{/if}</td
							>
							<td class="border-b border-[#edf0f5] px-2.5 py-4 text-[13px] whitespace-nowrap text-[#46536b]"
								><StatusBadge status={item.status} /></td
							>
							<td class="border-b border-[#edf0f5] px-2.5 py-4 text-[13px] whitespace-nowrap text-[#46536b]">
								<div class="flex min-h-[18px] items-center gap-3">
									{#if !isApprover && item.status === 'draft'}
										<a class="text-xs font-semibold text-[#3975f6]" href={`/apply?id=${item.id}`}>编辑</a>
										<button
											class="cursor-pointer border-0 bg-transparent p-0 text-xs font-semibold text-[#d45c68] disabled:cursor-wait disabled:opacity-55"
											disabled={deletingId === item.id}
											onclick={() => deleteDraft(item.id)}>删除</button
										>
									{:else}
										<a class="text-xs font-semibold text-[#3975f6]" href={`/applications/${item.id}`}>查看详情</a>
									{/if}
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<Pagination {page} {pageSize} {total} {totalPages} onPageChange={changePage} />
	{/if}
</section>
