import { createSignal, onCleanup } from 'solid-js';
import { BlockProps } from '../types';

export const Block = (props: BlockProps) => {
	const [text, setText] = createSignal("");

	let timer: number | undefined;
	let startTime: number = 0;
	let lastKeystroke: number = 0;

	const handleInput = (e: InputEvent) => {
		const val = (e.target as HTMLTextAreaElement).value;
		const now = Date.now();

		setText(val);
		lastKeystroke = now;

		// Start clock on first char
		if (val.length === 1 && text().length === 1) { // text() is already updated
			startTime = now;
		}
		// Fallback: if we somehow missed the start (paste event), sync it
		if (startTime === 0) startTime = now;

		clearTimeout(timer);
		timer = setTimeout(() => finishSpurt(), props.delayThreshold);
	};

	const finishSpurt = () => {
		const currentText = text().trim();
		if (!currentText) return;

		// PRECISION TIMING:
		// We measure from the first char to the last keystroke.
		const duration = (lastKeystroke - startTime) / 1000;

		props.onSpurt({
			text: currentText,
			createdAt: Date.now(),
			duration: duration > 0 ? duration : 0.1 // Prevent 0s duration
		});

		setText("");
		startTime = 0;
		lastKeystroke = 0;
	};

	onCleanup(() => clearTimeout(timer));

	return (
		<div class="w-full h-full flex flex-col">
			<div class="text-xs text-gray-500 mb-2 font-bold uppercase tracking-widest flex justify-between">
				<span>Active Thought</span>
				<span class={text().length > 0 ? "text-green-500 animate-pulse" : "text-gray-700"}>
					{text().length > 0 ? "RECORDING" : "IDLE"}
				</span>
			</div>

			<textarea
				value={text()}
				onInput={handleInput}
				placeholder="Type here..."
				autofocus
				class="bg-transparent text-gray-200 text-lg font-mono outline-none w-full h-32 resize-none placeholder-gray-800"
			/>
		</div>
	);
};
