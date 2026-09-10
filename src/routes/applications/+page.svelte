<script lang="ts">
	import { onMount } from 'svelte';
	import { APPLICATION_STATUS_LABEL, TRANSPORT_LABEL, type ApplicationStatus, type TravelApplication } from '$lib/types/application';

	let applications = $state<TravelApplication[]>([]);
	let loading = $state(true);
	let keyword = $state('');
	let status = $state<'all' | ApplicationStatus>('all');

	onMount(async () => {
		try {
			const response = await fetch('/api/applications');
			if (response.ok) applications = (await response.json()).data;
		} finally {
			loading = false;
		}
	});

	let filteredApplications = $derived(
		applications.filter((item) => {
			const text = `${item.id} ${item.applicant.name} ${item.from} ${item.to}`.toLowerCase();
			return (status === 'all' || item.status === status) && text.includes(keyword.trim().toLowerCase());
		})
	);
</script>

<svelte:head><title>申请管理 - 差旅管理</title></svelte:head>

<div class="page-heading">
	<div><h1>申请管理</h1><p>查看并处理全部差旅申请。</p></div>
	<a class="primary-button" href="/apply">＋ 新建申请</a>
</div>

<section class="panel list-panel">
	<div class="toolbar">
		<div class="search-wrap"><span>⌕</span><input aria-label="搜索申请" placeholder="搜索编号、申请人或目的地" bind:value={keyword} /></div>
		<select aria-label="按状态筛选" bind:value={status}>
			<option value="all">全部状态</option>
			{#each Object.entries(APPLICATION_STATUS_LABEL) as [key, label]}<option value={key}>{label}</option>{/each}
		</select>
	</div>
	{#if loading}
		<div class="empty">正在加载申请记录…</div>
	{:else if filteredApplications.length === 0}
		<div class="empty"><div class="empty-icon">▤</div><strong>暂无匹配申请</strong><span>可以新建一条差旅申请。</span></div>
	{:else}
		<div class="table-wrap">
			<table>
				<thead><tr><th>申请编号</th><th>申请人</th><th>行程</th><th>出行日期</th><th>交通方式</th><th>预计费用</th><th>状态</th><th></th></tr></thead>
				<tbody>
					{#each filteredApplications as item}
						<tr>
							<td><a class="id-link" href={`/applications/${item.id}`}>{item.id}</a></td>
							<td><strong>{item.applicant.name}</strong><small>{item.applicant.department}</small></td>
							<td>{item.from} → {item.to}</td>
							<td>{item.startDate}<br /><span class="muted">至 {item.endDate}</span></td>
							<td>{TRANSPORT_LABEL[item.transport]}</td>
							<td>¥ {item.estimatedCost.toFixed(2)}</td>
							<td><span class={`status status-${item.status}`}>{APPLICATION_STATUS_LABEL[item.status]}</span></td>
							<td><a class="detail-link" href={`/applications/${item.id}`}>查看详情</a></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</section>

<style>
	.list-panel { padding: 20px 24px; }
	.toolbar { display: flex; justify-content: space-between; gap: 14px; margin-bottom: 18px; }
	.search-wrap { position: relative; flex: 1; max-width: 360px; }
	.search-wrap span { position: absolute; left: 12px; top: 0; color: #8995a8; font-size: 27px; }
	input, select { height: 40px; border: 1px solid #dfe5ee; border-radius: 8px; background: white; color: #33405a; outline: none; }
	.search-wrap input { width: 100%; padding: 0 12px 0 36px; }
	select { min-width: 130px; padding: 0 10px; }
	input:focus, select:focus { border-color: #3975f6; box-shadow: 0 0 0 3px #3975f61c; }
	.table-wrap { overflow-x: auto; }
	table { width: 100%; border-collapse: collapse; min-width: 920px; }
	th { padding: 12px 10px; color: #8a95a8; background: #f8f9fc; font-size: 12px; font-weight: 650; text-align: left; }
	td { padding: 16px 10px; border-bottom: 1px solid #edf0f5; color: #46536b; font-size: 13px; white-space: nowrap; }
	td strong, td small { display: block; } td small { margin-top: 4px; color: #9aa4b5; font-size: 11px; }
	.id-link, .detail-link { color: #3975f6; font-weight: 650; } .detail-link { font-size: 12px; }
	.muted { color: #9aa4b5; font-size: 11px; }
	.status { display: inline-flex; padding: 5px 9px; border-radius: 999px; font-size: 11px; font-weight: 650; }
	.status-draft { color: #667085; background: #f0f2f5; } .status-pending { color: #946b16; background: #fff5d8; }
	.status-approved { color: #237a52; background: #e8f8ef; } .status-rejected { color: #b54855; background: #ffedf0; }
	.empty { min-height: 280px; display: grid; place-content: center; justify-items: center; gap: 8px; color: #8a95a8; font-size: 13px; }
	.empty strong { color: #44516a; font-size: 16px; } .empty-icon { color: #3975f6; font-size: 30px; }
	@media (max-width: 620px) { .toolbar { flex-direction: column; } .search-wrap { max-width: none; } select { width: 100%; } .list-panel { padding: 16px; } }
</style>
