import { createSignal, onCleanup } from 'solid-js';
import { BlockProps, Spurt } from '../types';

export const Block = (props: BlockProps) => {
	const [text, setText] = createSignal("");
	let timer: number | undefined;
	let startTime: number = Date.now();

	const handleInput = (e: InputEvent) => {
		const val = (e.target as HTMLTextAreaElement).value;
		setText(val);
		if (val.length === 1 && text().length === 0) startTime = Date.now();
		clearTimeout(timer);
		timer = setTimeout(() => finishSpurt(), props.delayThreshold);
	};

	const finishSpurt = () => {
		const currentText = text().trim();
		if (!currentText) return;
		const now = Date.now();
		const duration = (now - startTime) / 1000;

		props.onSpurt({
			id: crypto.randomUUID(),
			text: currentText,
			createdAt: now,
			duration: duration
		});

		setText("");
		startTime = Date.now();
	};

	onCleanup(() => clearTimeout(timer));

	return (
		<div class="w-full h-full flex flex-col">
			<div class="text-xs text-gray-600 mb-2 font-bold uppercase tracking-widest">
				Active Thought
			</div>

			{/* The Input Area
        - Text size: text-lg (approx 14pt)
        - Height: h-32 (fixed height for the 'square' feel)
        - Resize: none (locks the shape)
      */}
			<textarea
				value={text()}
				onInput={handleInput}
				placeholder="Type here..."
				autofocus
				class="bg-transparent text-gray-200 text-lg font-mono outline-none w-full h-32 resize-none placeholder-gray-700"
			/>

			{/* Live Helper (Optional) */}
			<div class="text-right text-xs text-gray-700 mt-2">
				{text().length > 0 ? "Typing..." : "Ready"}
			</div>
		</div>
	);
};
