<script lang="ts">
	import { onMount } from 'svelte';
	import {
		APPLICATION_STATUS_LABEL,
		TRANSPORT_LABEL,
		type ApplicationStatus,
		type TravelApplication
	} from '$lib/types/application';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import { getAuthState, hasRole } from '$lib/client/auth';

	let applications = $state<TravelApplication[]>([]);
	let loading = $state(true);
	let keyword = $state('');
	let status = $state<'all' | ApplicationStatus>('all');
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

<svelte:head><title>{isApprover ? '审批管理' : '我的申请'} - 差旅管理</title></svelte:head>

<div class="page-heading">
	<div>
		<h1>{isApprover ? '审批管理' : '我的申请'}</h1>
		<p>{isApprover ? '查看并处理全部员工的差旅申请。' : '查看我提交的差旅申请。'}</p>
	</div>
	{#if !isApprover}<a class="primary-button" href="/apply">＋ 新建申请</a>{/if}
</div>

<section class="panel list-panel">
	<div class="toolbar">
		<div class="search-wrap">
			<span>⌕</span><input
				aria-label="搜索申请"
				placeholder="搜索编号、申请人或目的地"
				bind:value={keyword}
				onkeydown={(event) => event.key === 'Enter' && applyFilters()}
			/>
		</div>
		<select aria-label="按状态筛选" bind:value={status} onchange={applyFilters}>
			<option value="all">全部状态</option>
			{#each Object.entries(APPLICATION_STATUS_LABEL).filter(([key]) => !isApprover || key !== 'draft') as [key, label] (key)}<option
					value={key}>{label}</option
				>{/each}
		</select>
		<button class="filter-button" type="button" onclick={applyFilters}>搜索</button>
	</div>
	{#if loading}
		<div class="empty">正在加载申请记录…</div>
	{:else if applications.length === 0}
		<div class="empty">
			<div class="empty-icon">▤</div>
			<strong>暂无匹配申请</strong><span>可以新建一条差旅申请。</span>
		</div>
	{:else}
		<div class="table-wrap">
			<table>
				<thead
					><tr
						><th>申请编号</th><th>申请人</th><th>行程</th><th>出行日期</th><th>交通方式</th><th>预计费用</th><th
							>状态</th
						><th></th></tr
					></thead
				>
				<tbody>
					{#each applications as item (item.id)}
						<tr>
							<td><a class="id-link" href={`/applications/${item.id}`}>{item.id}</a></td>
							<td><strong>{item.applicant.name}</strong><small>{item.applicant.department}</small></td>
							<td>{item.from} → {item.to}</td>
							<td>{item.startDate}<br /><span class="muted">至 {item.endDate}</span></td>
							<td>{TRANSPORT_LABEL[item.transport]}</td>
							<td>¥ {item.estimatedCost.toFixed(2)}</td>
							<td><StatusBadge status={item.status} /></td>
							<td>
								<div class="row-actions">
									{#if !isApprover && item.status === 'draft'}
										<a class="detail-link" href={`/apply?id=${item.id}`}>编辑</a>
										<button class="delete-button" disabled={deletingId === item.id} onclick={() => deleteDraft(item.id)}
											>删除</button
										>
									{:else}
										<a class="detail-link" href={`/applications/${item.id}`}>查看详情</a>
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

<style>
	.list-panel {
		padding: 20px 24px;
	}
	.toolbar {
		display: flex;
		justify-content: flex-end;
		gap: 14px;
		margin-bottom: 18px;
	}
	.search-wrap {
		position: relative;
		flex: 1;
		max-width: 360px;
	}
	.search-wrap span {
		position: absolute;
		left: 12px;
		top: 0;
		color: #8995a8;
		font-size: 27px;
	}
	input,
	select {
		height: 40px;
		border: 1px solid #dfe5ee;
		border-radius: 8px;
		background: white;
		color: #33405a;
		outline: none;
	}
	.search-wrap input {
		width: 100%;
		padding: 0 12px 0 36px;
	}
	select {
		min-width: 130px;
		padding: 0 10px;
	}
	.filter-button {
		height: 40px;
		padding: 0 16px;
		border: 0;
		border-radius: 8px;
		background: #3975f6;
		color: white;
		font-weight: 650;
		cursor: pointer;
	}
	input:focus,
	select:focus {
		border-color: #3975f6;
		box-shadow: 0 0 0 3px #3975f61c;
	}
	.table-wrap {
		overflow-x: auto;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		min-width: 920px;
	}
	th {
		padding: 12px 10px;
		color: #8a95a8;
		background: #f8f9fc;
		font-size: 12px;
		font-weight: 650;
		text-align: left;
	}
	td {
		padding: 16px 10px;
		border-bottom: 1px solid #edf0f5;
		color: #46536b;
		font-size: 13px;
		white-space: nowrap;
	}
	td strong,
	td small {
		display: block;
	}
	td small {
		margin-top: 4px;
		color: #9aa4b5;
		font-size: 11px;
	}
	.id-link,
	.detail-link {
		color: #3975f6;
		font-weight: 650;
	}
	.detail-link {
		font-size: 12px;
	}
	.row-actions {
		display: flex;
		align-items: center;
		gap: 12px;
		min-height: 18px;
	}
	.delete-button {
		padding: 0;
		border: 0;
		background: transparent;
		color: #d45c68;
		font-size: 12px;
		font-weight: 650;
		cursor: pointer;
	}
	.delete-button:disabled {
		opacity: 0.55;
		cursor: wait;
	}
	.muted {
		color: #9aa4b5;
		font-size: 11px;
	}
	.empty {
		min-height: 280px;
		display: grid;
		place-content: center;
		justify-items: center;
		gap: 8px;
		color: #8a95a8;
		font-size: 13px;
	}
	.empty strong {
		color: #44516a;
		font-size: 16px;
	}
	.empty-icon {
		color: #3975f6;
		font-size: 30px;
	}
	@media (max-width: 620px) {
		.toolbar {
			flex-direction: column;
		}
		.search-wrap {
			max-width: none;
		}
		select {
			width: 100%;
		}
		.list-panel {
			padding: 16px;
		}
	}
</style>
