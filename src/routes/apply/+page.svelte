<script lang="ts">
	import {
		TRANSPORT_LABEL,
		type TransportType,
		type TravelApplicationInput
	} from '$lib/types/application';
	import { validateTravelApplication, type ValidationErrors } from '$lib/utils/applicationValidation';

	const transportOptions: TransportType[] = ['train', 'flight', 'car', 'other'];

	let form = $state<TravelApplicationInput>({
		applicant: {
			id: 'user-001',
			name: '张三',
			department: '研发部',
			position: '前端开发'
		},
		from: '',
		to: '',
		startDate: '',
		endDate: '',
		reason: '',
		transport: 'train',
		estimatedCost: 0,
		remark: ''
	});

	let errors = $state<ValidationErrors>({});
	let notice = $state('');
	let noticeTone = $state<'success' | 'info'>('info');
	let previewReady = $state(false);

	type EditableField =
		| 'from'
		| 'to'
		| 'startDate'
		| 'endDate'
		| 'reason'
		| 'transport'
		| 'estimatedCost'
		| 'remark';

	function updateField(field: EditableField, value: string) {
		form = {
			...form,
			[field]: field === 'estimatedCost' ? (value === '' ? 0 : Number(value)) : value
		};
		if (errors[field]) {
			errors = { ...errors, [field]: undefined };
		}
		if (field === 'startDate' || field === 'endDate') {
			errors = { ...errors, dateRange: undefined };
		}
		notice = '';
		previewReady = false;
	}

	function validate() {
		errors = validateTravelApplication(form);
		return Object.keys(errors).length === 0;
	}

	function saveDraft() {
		errors = {};
		noticeTone = 'success';
		notice = '草稿已保存，可稍后继续填写。';
		previewReady = false;
	}

	function preparePreview() {
		if (!validate()) {
			noticeTone = 'info';
			notice = '请先完善表单中的必填信息。';
			return;
		}
		noticeTone = 'success';
		notice = '信息校验通过，下一步将进入申请预览。';
		previewReady = true;
	}
</script>

<svelte:head>
	<title>发起差旅申请 - 差旅管理</title>
</svelte:head>

<div class="page-heading">
	<div>
		<h1>发起差旅申请</h1>
		<p>填写申请信息，确认无误后进入预览。</p>
	</div>
	<div class="step-indicator" aria-label="申请流程">
		<span class="step active">1</span>
		<span>填写申请</span>
		<span class="step-line"></span>
		<span class="step">2</span>
		<span>预览提交</span>
	</div>
</div>

<form class="application-form" onsubmit={(event) => { event.preventDefault(); preparePreview(); }}>
	<section class="panel form-panel">
		<div class="section-heading">
			<div>
				<h2>申请人信息</h2>
				<p>当前登录用户信息已自动带入。</p>
			</div>
			<span class="required-tip">* 为必填项</span>
		</div>
		<div class="form-grid applicant-grid">
			<div class="field">
				<label for="applicant-name">申请人 <span>*</span></label>
				<input id="applicant-name" value={form.applicant.name} readonly />
				{#if errors.applicant}<small class="error">{errors.applicant}</small>{/if}
			</div>
			<div class="field">
				<label for="department">所属部门 <span>*</span></label>
				<input id="department" value={form.applicant.department} readonly />
			</div>
			<div class="field">
				<label for="position">职位</label>
				<input id="position" value={form.applicant.position ?? ''} readonly />
			</div>
		</div>
	</section>

	<section class="panel form-panel">
		<div class="section-heading">
			<div>
				<h2>出行信息</h2>
				<p>请填写本次差旅的行程与时间安排。</p>
			</div>
		</div>
		<div class="form-grid">
			<div class="field">
				<label for="from">出发地 <span>*</span></label>
				<input
					id="from"
					placeholder="例如：上海"
					value={form.from}
					oninput={(event) => updateField('from', event.currentTarget.value)}
				/>
				{#if errors.from}<small class="error">{errors.from}</small>{/if}
			</div>
			<div class="field">
				<label for="to">目的地 <span>*</span></label>
				<input
					id="to"
					placeholder="例如：北京"
					value={form.to}
					oninput={(event) => updateField('to', event.currentTarget.value)}
				/>
				{#if errors.to}<small class="error">{errors.to}</small>{/if}
			</div>
			<div class="field">
				<label for="start-date">出发日期 <span>*</span></label>
				<input
					id="start-date"
					type="date"
					value={form.startDate}
					onchange={(event) => updateField('startDate', event.currentTarget.value)}
				/>
				{#if errors.startDate}<small class="error">{errors.startDate}</small>{/if}
			</div>
			<div class="field">
				<label for="end-date">返回日期 <span>*</span></label>
				<input
					id="end-date"
					type="date"
					value={form.endDate}
					onchange={(event) => updateField('endDate', event.currentTarget.value)}
				/>
				{#if errors.endDate}<small class="error">{errors.endDate}</small>{/if}
				{#if errors.dateRange}<small class="error">{errors.dateRange}</small>{/if}
			</div>
			<div class="field">
				<label for="transport">交通方式 <span>*</span></label>
				<select
					id="transport"
					value={form.transport}
					onchange={(event) => updateField('transport', event.currentTarget.value)}
				>
					{#each transportOptions as option}
						<option value={option}>{TRANSPORT_LABEL[option]}</option>
					{/each}
				</select>
			</div>
			<div class="field">
				<label for="estimated-cost">预计费用 <span>*</span></label>
				<div class="input-with-suffix">
					<input
						id="estimated-cost"
						type="number"
						min="0"
						step="0.01"
						placeholder="0.00"
						value={form.estimatedCost || ''}
						oninput={(event) => updateField('estimatedCost', event.currentTarget.value)}
					/>
					<span>元</span>
				</div>
				{#if errors.estimatedCost}<small class="error">{errors.estimatedCost}</small>{/if}
			</div>
		</div>
		<div class="field full-width">
			<label for="reason">出行事由 <span>*</span></label>
			<textarea
				id="reason"
				rows="4"
				maxlength="500"
				placeholder="请说明本次出差的工作目的、客户或项目背景"
				value={form.reason}
				oninput={(event) => updateField('reason', event.currentTarget.value)}
			></textarea>
			<div class="field-footer">
				{#if errors.reason}<small class="error">{errors.reason}</small>{:else}<span></span>{/if}
				<span class="counter">{form.reason.length}/500</span>
			</div>
		</div>
		<div class="field full-width">
			<label for="remark">备注</label>
			<textarea
				id="remark"
				rows="3"
				placeholder="其他需要说明的信息（选填）"
				value={form.remark}
				oninput={(event) => updateField('remark', event.currentTarget.value)}
			></textarea>
		</div>
	</section>

	{#if notice}
		<div
			class:success-notice={noticeTone === 'success'}
			class:info-notice={noticeTone === 'info'}
			class="notice"
			role="status"
		>
			<span>{noticeTone === 'success' ? '✓' : '!'}</span>
			{notice}
			{#if previewReady}<span class="preview-hint">（预览入口已准备）</span>{/if}
		</div>
	{/if}

	<div class="form-actions">
		<button type="button" class="secondary-button" onclick={saveDraft}>保存草稿</button>
		<button type="submit" class="primary-button">下一步：预览 <span aria-hidden="true">→</span></button>
	</div>
</form>

<style>
	.step-indicator {
		display: flex;
		align-items: center;
		gap: 8px;
		color: #8a95a8;
		font-size: 12px;
		white-space: nowrap;
	}
	.step {
		width: 24px;
		height: 24px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: #edf1f7;
		color: #8490a4;
		font-weight: 700;
	}
	.step.active {
		background: #3975f6;
		color: white;
	}
	.step-line {
		width: 28px;
		height: 1px;
		background: #d8deea;
	}
	.application-form {
		display: grid;
		gap: 18px;
	}
	.form-panel {
		padding: 26px 28px;
	}
	.section-heading {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16px;
		margin-bottom: 22px;
	}
	.section-heading h2 {
		margin: 0;
		font-size: 17px;
	}
	.section-heading p {
		margin: 6px 0 0;
		color: #8a95a8;
		font-size: 13px;
	}
	.required-tip {
		color: #9aa4b5;
		font-size: 12px;
	}
	.form-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 20px 22px;
	}
	.applicant-grid {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}
	.field {
		min-width: 0;
	}
	.field label {
		display: block;
		margin-bottom: 8px;
		color: #3e4a61;
		font-size: 13px;
		font-weight: 650;
	}
	.field label span {
		color: #e05b68;
	}
	input,
	select,
	textarea {
		width: 100%;
		border: 1px solid #dfe5ee;
		border-radius: 8px;
		outline: none;
		background: #fff;
		color: #253047;
		transition:
			border-color 0.18s,
			box-shadow 0.18s;
	}
	input,
	select {
		height: 42px;
		padding: 0 12px;
	}
	textarea {
		padding: 11px 12px;
		resize: vertical;
		line-height: 1.55;
	}
	input::placeholder,
	textarea::placeholder {
		color: #b2bac7;
	}
	input:focus,
	select:focus,
	textarea:focus {
		border-color: #3975f6;
		box-shadow: 0 0 0 3px #3975f61c;
	}
	input[readonly] {
		background: #f7f9fc;
		color: #65728a;
	}
	.input-with-suffix {
		position: relative;
	}
	.input-with-suffix input {
		padding-right: 38px;
	}
	.input-with-suffix span {
		position: absolute;
		top: 50%;
		right: 13px;
		color: #8c97a9;
		transform: translateY(-50%);
		font-size: 13px;
	}
	.full-width {
		margin-top: 20px;
	}
	.field-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}
	.counter {
		color: #a2abba;
		font-size: 11px;
	}
	.error {
		display: block;
		margin-top: 6px;
		color: #d7505e;
		font-size: 12px;
	}
	.notice {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 14px;
		border-radius: 9px;
		font-size: 13px;
	}
	.notice > span:first-child {
		width: 20px;
		height: 20px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		font-weight: 700;
	}
	.success-notice {
		color: #237a52;
		background: #ecfaf2;
		border: 1px solid #ccefdc;
	}
	.success-notice > span:first-child {
		color: white;
		background: #35ad72;
	}
	.info-notice {
		color: #946b16;
		background: #fff8e7;
		border: 1px solid #f3e2af;
	}
	.info-notice > span:first-child {
		color: white;
		background: #d7a83d;
	}
	.preview-hint {
		color: #5c8bdc;
	}
	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		padding-bottom: 12px;
	}
	.secondary-button {
		min-height: 42px;
		padding: 0 18px;
		border: 1px solid #d9e0eb;
		border-radius: 9px;
		background: white;
		color: #526078;
		font-weight: 650;
		cursor: pointer;
	}
	.secondary-button:hover {
		background: #f7f9fc;
	}
	button {
		cursor: pointer;
	}
	@media (max-width: 720px) {
		.step-indicator {
			display: none;
		}
		.form-panel {
			padding: 21px 18px;
		}
		.form-grid,
		.applicant-grid {
			grid-template-columns: 1fr;
			gap: 16px;
		}
		.full-width {
			margin-top: 16px;
		}
		.form-actions {
			flex-direction: column-reverse;
		}
		.form-actions button {
			width: 100%;
		}
	}
</style>
