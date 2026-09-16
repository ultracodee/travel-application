<script lang="ts">
	import type { ApplicationFieldConfig, ApplicationFieldValue } from '$lib/types/application';

	const now = new Date();
	const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(
		2,
		'0'
	)}`;

	let {
		fields,
		values,
		errors,
		onChange
	}: {
		fields: ApplicationFieldConfig[];
		values: Record<string, ApplicationFieldValue>;
		errors: Record<string, string>;
		onChange: (name: string, value: ApplicationFieldValue) => void;
	} = $props();
</script>

<div class="form-grid">
	{#each fields as field (field.name)}
		<div class:full-width={field.fullWidth} class:checkbox-field={field.type === 'checkbox'} class="field">
			<label for={`application-${field.name}`}
				>{field.label}{#if field.required}
					<span>*</span>{/if}</label
			>
			{#if field.type === 'textarea'}
				<textarea
					id={`application-${field.name}`}
					rows="3"
					value={String(values[field.name] ?? '')}
					oninput={(event) => onChange(field.name, event.currentTarget.value)}></textarea>
			{:else if field.type === 'select'}
				<select
					id={`application-${field.name}`}
					value={String(values[field.name] ?? '')}
					onchange={(event) => onChange(field.name, event.currentTarget.value)}
				>
					<option value="">请选择</option>
					{#each field.options ?? [] as option (option.value)}<option value={option.value}>{option.label}</option
						>{/each}
				</select>
			{:else if field.type === 'checkbox'}
				<input
					id={`application-${field.name}`}
					type="checkbox"
					class="checkbox-input"
					checked={Boolean(values[field.name])}
					onchange={(event) => onChange(field.name, event.currentTarget.checked)}
				/>
			{:else}
				<input
					id={`application-${field.name}`}
					type={field.type}
					min={field.minToday ? today : field.min}
					max={field.maxToday ? today : field.max}
					maxlength={field.maxLength}
					readonly={field.readonly}
					value={String(values[field.name] ?? '')}
					oninput={(event) =>
						onChange(
							field.name,
							field.type === 'number' ? Number(event.currentTarget.value) : event.currentTarget.value
						)}
				/>
			{/if}
			{#if field.suffix}<span class="field-suffix">{field.suffix}</span>{/if}
			{#if errors[field.name]}<small class="error">{errors[field.name]}</small>{/if}
		</div>
	{/each}
</div>

<style>
	.form-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 20px 22px;
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
	}
	input,
	select {
		height: 42px;
		padding: 0 12px;
	}
	textarea {
		padding: 11px 12px;
		resize: none;
		line-height: 1.55;
	}
	.full-width {
		grid-column: 1 / -1;
	}
	.checkbox-input {
		width: 16px;
		height: 16px;
		margin: 0;
	}
	.checkbox-field {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.checkbox-field label {
		order: 2;
		margin: 0;
	}
	.checkbox-field .checkbox-input {
		order: 1;
	}
	.field-suffix {
		display: block;
		margin-top: -30px;
		padding-right: 12px;
		color: #7b879a;
		font-size: 13px;
		text-align: right;
		pointer-events: none;
	}
	.error {
		display: block;
		margin-top: 6px;
		color: #d7505e;
		font-size: 12px;
	}
	@media (max-width: 620px) {
		.form-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
