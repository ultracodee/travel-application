<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { APPLICATION_STATUS_LABEL, type ApplicationStatus, type TravelApplication } from '$lib/types/application';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import { getAuthState, hasRole } from '$lib/client/auth';
	import {
		getApplicationAmount,
		getApplicationFieldEntries,
		getApplicationSummary,
		getApplicationTypeLabel
	} from '$lib/utils/applicationDisplay';

	let application = $state<TravelApplication | null>(null);
	let loading = $state(true);
	let errorMessage = $state('');
	let actionMessage = $state('');
	let comment = $state('');
	let acting = $state(false);
	let isApprover = $state(false);
	let isApplicant = $state(false);

	onMount(async () => {
		const auth = await getAuthState();
		isApprover = hasRole(auth.data, 'approver');
		const response = await fetch(`/api/applications/${page.params.id}`);
		if (response.ok) {
			application = (await response.json()).data;
			isApplicant = auth.data?.id === application?.applicant.id;
		} else errorMessage = '申请不存在或已被删除。';
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

<svelte:head><title>申请详情 - 申请管理</title></svelte:head>

<div class="page-heading">
	<div>
		<h1>申请详情</h1>
		<p>申请编号：{page.params.id}</p>
	</div>
	<a class="secondary-button" href="/applications">← 返回列表</a>
</div>

{#if loading}
	<section class="panel grid min-h-[240px] place-content-center justify-items-center gap-4 text-[#8a95a8]">
		正在加载申请详情…
	</section>
{:else if errorMessage}
	<section class="panel grid min-h-[240px] place-content-center justify-items-center gap-4 text-[#8a95a8]">
		<strong>{errorMessage}</strong><a class="primary-button" href="/applications">返回申请列表</a>
	</section>
{:else if application}
	<section class="panel mb-[18px] px-7 py-[26px] max-[620px]:px-[18px] max-[620px]:py-[21px]">
		<div class="flex justify-between gap-5 border-b border-[#edf0f5] pb-[22px] max-[620px]:flex-col">
			<div>
				<StatusBadge status={application.status} />
				<h2 class="my-3 mb-1.5 text-[22px]">{application.title}</h2>
				<p class="m-0 text-[13px] text-[#8a95a8]">
					{getApplicationTypeLabel(application)} · {getApplicationSummary(application)}
				</p>
			</div>
			{#if getApplicationAmount(application) !== undefined}
				<div class="text-right text-2xl font-bold text-[#3975f6] max-[620px]:text-left">
					¥ {getApplicationAmount(application)?.toFixed(2)}<small
						class="mt-1 block text-[11px] font-normal text-[#9aa4b5]">预计金额</small
					>
				</div>
			{/if}
		</div>
		<div class="grid grid-cols-2 gap-5 pt-[22px] max-[620px]:grid-cols-1 [&_div]:grid [&_div]:gap-[7px]">
			<div>
				<span class="text-xs text-[#8a95a8]">申请人</span><strong class="text-sm leading-[1.6] text-[#34415a]"
					>{application.applicant.name}</strong
				>
			</div>
			<div>
				<span class="text-xs text-[#8a95a8]">部门 / 职位</span><strong class="text-sm leading-[1.6] text-[#34415a]"
					>{application.applicant.department} / {application.applicant.position ?? '—'}</strong
				>
			</div>
			<div class="col-span-full max-[620px]:col-auto">
				<span class="text-xs text-[#8a95a8]">申请说明</span><strong class="text-sm leading-[1.6] text-[#34415a]"
					>{application.description || '—'}</strong
				>
			</div>
			{#each getApplicationFieldEntries(application) as field (field.label)}
				<div>
					<span class="text-xs text-[#8a95a8]">{field.label}</span><strong class="text-sm leading-[1.6] text-[#34415a]"
						>{field.value}</strong
					>
				</div>
			{/each}
			{#if application.remark}<div class="col-span-full max-[620px]:col-auto">
					<span class="text-xs text-[#8a95a8]">备注</span><strong class="text-sm leading-[1.6] text-[#34415a]"
						>{application.remark}</strong
					>
				</div>{/if}
		</div>
	</section>
	<section class="panel mb-[18px] px-7 py-[26px] max-[620px]:px-[18px] max-[620px]:py-[21px]">
		<div class="flex items-center justify-between">
			<h2 class="m-0 text-[17px]">审批记录</h2>
			<span class="text-xs text-[#8a95a8]">{application.approvalRecords.length} 条记录</span>
		</div>
		{#if application.approvalRecords.length === 0}<p class="text-[13px] text-[#8a95a8]">暂无审批记录</p>{:else}
			<div class="mt-5 grid gap-[18px]">
				{#each application.approvalRecords as record (record.id)}<div class="flex items-start gap-3">
						<span class="mt-[5px] size-[9px] rounded-full bg-[#3975f6]"></span>
						<div>
							<strong class="block text-[13px] text-[#34415a]"
								>{record.approver.name} · {record.action === 'approved' ? '通过' : '驳回'}</strong
							><small class="mt-[5px] block text-xs text-[#8a95a8]"
								>{record.operatedAt}
								{#if record.comment}
									· {record.comment}{/if}</small
							>
						</div>
					</div>{/each}
			</div>
		{/if}
	</section>
	{#if (isApprover && application.status === 'pending') || (isApplicant && ['draft', 'rejected'].includes(application.status))}
		<section class="panel mb-[18px] px-7 py-[26px] max-[620px]:px-[18px] max-[620px]:py-[21px]">
			{#if isApprover}
				<h2 class="m-0 text-[17px]">处理申请</h2>
				<textarea
					class="form-control form-textarea mt-4"
					rows="3"
					placeholder="填写审批意见（可选）"
					bind:value={comment}></textarea>
			{:else}
				<h2 class="m-0 text-[17px]">{application.status === 'rejected' ? '修改申请' : '提交申请'}</h2>
				<p class="mt-2 mb-0 text-[13px] text-[#8a95a8]">
					{application.status === 'rejected'
						? '申请已驳回，请修改后重新提交审批。'
						: '草稿已保存，确认无误后即可提交审批。'}
				</p>
			{/if}
			<div class="mt-3.5 flex justify-end gap-2.5 max-[620px]:flex-col-reverse max-[620px]:[&>*]:w-full">
				{#if isApplicant && ['draft', 'rejected'].includes(application.status)}
					<a class="primary-button" href={`/apply?id=${application.id}`}
						>{application.status === 'rejected' ? '编辑并重新提交' : '编辑并提交审批'}</a
					>
				{/if}
				{#if isApprover && application.status === 'pending'}<button
						class="danger-button"
						disabled={acting}
						onclick={() => changeStatus('rejected')}>驳回</button
					><button class="primary-button" disabled={acting} onclick={() => changeStatus('approved')}>通过</button>{/if}
			</div>
			{#if actionMessage}<p class="mt-3 mb-0 text-[13px] text-[#237a52]">{actionMessage}</p>{/if}
		</section>
	{/if}
{/if}
