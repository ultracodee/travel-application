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

	function getFieldClass(field: ApplicationFieldConfig) {
		return [
			'min-w-0',
			field.fullWidth ? 'col-span-full' : '',
			field.type === 'checkbox' ? 'flex items-center gap-2 pt-[27px]' : ''
		]
			.filter(Boolean)
			.join(' ');
	}
</script>

<div class="grid grid-cols-2 gap-x-[22px] gap-y-5 max-[620px]:grid-cols-1">
	{#each fields as field (field.name)}
		<div class={getFieldClass(field)}>
			{#if field.type === 'checkbox'}
				<input
					id={`application-${field.name}`}
					type="checkbox"
					class="size-4 shrink-0"
					checked={Boolean(values[field.name])}
					onchange={(event) => onChange(field.name, event.currentTarget.checked)}
				/>
				<label class="text-[13px] font-semibold text-[#3e4a61]" for={`application-${field.name}`}
					>{field.label}{#if field.required}
						<span class="text-[#e05b68]">*</span>{/if}</label
				>
			{:else}
				<label class="form-label" for={`application-${field.name}`}
					>{field.label}{#if field.required}
						<span>*</span>{/if}</label
				>
			{/if}
			{#if field.type !== 'checkbox'}
				{#if field.type === 'textarea'}
					<textarea
						id={`application-${field.name}`}
						class="form-control form-textarea"
						rows="3"
						value={String(values[field.name] ?? '')}
						oninput={(event) => onChange(field.name, event.currentTarget.value)}></textarea>
				{:else if field.type === 'select'}
					<select
						id={`application-${field.name}`}
						class="form-control form-select"
						value={String(values[field.name] ?? '')}
						onchange={(event) => onChange(field.name, event.currentTarget.value)}
					>
						<option value="">请选择</option>
						{#each field.options ?? [] as option (option.value)}<option value={option.value}>{option.label}</option
							>{/each}
					</select>
				{:else}
					<input
						id={`application-${field.name}`}
						class="form-control form-input"
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
			{/if}
			{#if field.suffix}<span class="pointer-events-none mt-[-30px] block pr-3 text-right text-[13px] text-[#7b879a]"
					>{field.suffix}</span
				>{/if}
			{#if errors[field.name]}<small class="form-error">{errors[field.name]}</small>{/if}
		</div>
	{/each}
</div>
