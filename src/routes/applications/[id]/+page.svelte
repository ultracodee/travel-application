<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { APPLICATION_STATUS_LABEL, TRANSPORT_LABEL, type ApplicationStatus, type TravelApplication } from '$lib/types/application';

	let application = $state<TravelApplication | null>(null);
	let loading = $state(true);
	let errorMessage = $state('');
	let actionMessage = $state('');
	let comment = $state('');
	let acting = $state(false);

	onMount(async () => {
		const response = await fetch(`/api/applications/${page.params.id}`);
		if (response.ok) application = (await response.json()).data;
		else errorMessage = '申请不存在或已被删除。';
		loading = false;
	});

	async function changeStatus(status: Extract<ApplicationStatus, 'pending' | 'approved' | 'rejected'>) {
		if (!application) return;
		acting = true;
		actionMessage = '';
		const response = await fetch(`/api/applications/${application.id}`, {
			method: 'PATCH',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ status, comment: comment.trim() || undefined })
		});
		const result = await response.json();
		if (response.ok) {
			application = result.data;
			comment = '';
			actionMessage = `状态已更新为“${APPLICATION_STATUS_LABEL[status]}”。`;
		} else actionMessage = result.message ?? '状态更新失败。';
		acting = false;
	}
</script>

<svelte:head><title>申请详情 - 差旅管理</title></svelte:head>

<div class="page-heading">
	<div><h1>申请详情</h1><p>申请编号：{page.params.id}</p></div>
	<a class="secondary-button" href="/applications">← 返回列表</a>
</div>

{#if loading}
	<section class="panel empty">正在加载申请详情…</section>
{:else if errorMessage}
	<section class="panel empty"><strong>{errorMessage}</strong><a class="primary-button" href="/applications">返回申请列表</a></section>
{:else if application}
	<section class="panel detail-panel">
		<div class="detail-header">
			<div><span class={`status status-${application.status}`}>{APPLICATION_STATUS_LABEL[application.status]}</span><h2>{application.from} → {application.to}</h2><p>{application.startDate} 至 {application.endDate} · {TRANSPORT_LABEL[application.transport]}</p></div>
			<div class="cost">¥ {application.estimatedCost.toFixed(2)}<small>预计费用</small></div>
		</div>
		<div class="info-grid">
			<div><span>申请人</span><strong>{application.applicant.name}</strong></div>
			<div><span>部门 / 职位</span><strong>{application.applicant.department} / {application.applicant.position ?? '—'}</strong></div>
			<div class="wide"><span>出行事由</span><strong>{application.reason}</strong></div>
			{#if application.remark}<div class="wide"><span>备注</span><strong>{application.remark}</strong></div>{/if}
		</div>
	</section>
	<section class="panel detail-panel">
		<div class="section-title"><h2>审批记录</h2><span>{application.approvalRecords.length} 条记录</span></div>
		{#if application.approvalRecords.length === 0}<p class="muted">暂无审批记录</p>{:else}
			<div class="timeline">{#each application.approvalRecords as record}<div class="record"><span class="dot"></span><div><strong>{record.approver.name} · {record.action === 'approved' ? '通过' : '驳回'}</strong><small>{record.operatedAt} {#if record.comment} · {record.comment}{/if}</small></div></div>{/each}</div>
		{/if}
	</section>
	{#if application.status === 'pending' || application.status === 'draft' || application.status === 'rejected'}
		<section class="panel action-panel">
			<h2>处理申请</h2><textarea rows="3" placeholder="填写审批意见（可选）" bind:value={comment}></textarea>
			<div class="actions">
				{#if application.status === 'draft' || application.status === 'rejected'}<button class="primary-button" disabled={acting} onclick={() => changeStatus('pending')}>提交审批</button>{/if}
				{#if application.status === 'pending'}<button class="danger-button" disabled={acting} onclick={() => changeStatus('rejected')}>驳回</button><button class="primary-button" disabled={acting} onclick={() => changeStatus('approved')}>通过</button>{/if}
			</div>
			{#if actionMessage}<p class="action-message">{actionMessage}</p>{/if}
		</section>
	{/if}
{/if}

<style>
	.secondary-button { display: inline-flex; align-items: center; min-height: 42px; padding: 0 16px; border: 1px solid #d9e0eb; border-radius: 9px; background: white; color: #526078; font-weight: 650; }
	.detail-panel, .action-panel { margin-bottom: 18px; padding: 26px 28px; }
	.detail-header { display: flex; justify-content: space-between; gap: 20px; padding-bottom: 22px; border-bottom: 1px solid #edf0f5; }
	.detail-header h2 { margin: 12px 0 6px; font-size: 22px; } .detail-header p { margin: 0; color: #8a95a8; font-size: 13px; }
	.cost { color: #3975f6; font-size: 24px; font-weight: 750; text-align: right; } .cost small { display: block; margin-top: 4px; color: #9aa4b5; font-size: 11px; font-weight: 400; }
	.status { display: inline-flex; padding: 5px 9px; border-radius: 999px; font-size: 11px; font-weight: 650; } .status-draft { color: #667085; background: #f0f2f5; } .status-pending { color: #946b16; background: #fff5d8; } .status-approved { color: #237a52; background: #e8f8ef; } .status-rejected { color: #b54855; background: #ffedf0; }
	.info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; padding-top: 22px; } .info-grid div { display: grid; gap: 7px; } .info-grid span, .section-title span { color: #8a95a8; font-size: 12px; } .info-grid strong { color: #34415a; font-size: 14px; line-height: 1.6; } .wide { grid-column: 1 / -1; }
	.section-title { display: flex; justify-content: space-between; align-items: center; } .section-title h2, .action-panel h2 { margin: 0; font-size: 17px; } .muted { color: #8a95a8; font-size: 13px; }
	.timeline { display: grid; gap: 18px; margin-top: 20px; } .record { display: flex; gap: 12px; align-items: flex-start; } .dot { width: 9px; height: 9px; margin-top: 5px; border-radius: 50%; background: #3975f6; } .record strong, .record small { display: block; } .record strong { color: #34415a; font-size: 13px; } .record small { margin-top: 5px; color: #8a95a8; font-size: 12px; }
	.action-panel textarea { width: 100%; margin-top: 16px; padding: 11px 12px; border: 1px solid #dfe5ee; border-radius: 8px; resize: vertical; outline: none; } .actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 14px; } .danger-button { min-height: 42px; padding: 0 18px; border: 1px solid #f0c6cc; border-radius: 9px; background: #fff6f7; color: #b54855; font-weight: 650; } button:disabled { opacity: .6; cursor: wait; } .action-message { margin: 12px 0 0; color: #237a52; font-size: 13px; }
	.empty { min-height: 240px; display: grid; place-content: center; justify-items: center; gap: 16px; color: #8a95a8; } .empty strong { color: #44516a; }
	@media (max-width: 620px) { .detail-header { flex-direction: column; } .cost { text-align: left; } .info-grid { grid-template-columns: 1fr; } .wide { grid-column: auto; } .detail-panel, .action-panel { padding: 21px 18px; } .actions { flex-direction: column-reverse; } .actions button { width: 100%; } }
</style>
