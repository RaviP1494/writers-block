import { createMemo, For } from 'solid-js';
import type { StreamData } from '../types';

interface StreamViewProps {
	data: StreamData;
	isActive: boolean;
	gapThreshold: number; // We need this passed down to scale the bars!
	onActivate: () => void;
	onUpdateTitle: (newTitle: string) => void;
	onClear: () => void;
	onDelete: () => void;
	onToggleView: () => void;
}

export const StreamView = (props: StreamViewProps) => {

	const totalTime = createMemo(() => {
		return props.data.spurts.reduce((acc, s) => acc + s.duration, 0).toFixed(1);
	});

	const viewLabel = () => {
		switch (props.data.viewMode) {
			case 'wall': return 'Wall View';
			case 'ordered': return 'Ordered';
			case 'reversed': return 'Reversed';
		}
	};

	const renderContent = () => {
		const spurts = props.data.spurts;
		const mode = props.data.viewMode;
		const isWall = mode === 'wall';
		const isReversed = mode === 'reversed';

		// 1. WALL VIEW (Pure Stream of Consciousness)
		if (isWall) {
			return (
				<div class="text-[14pt] leading-relaxed break-words whitespace-pre-wrap">
					<For each={spurts}>
						{(spurt) => (
							<span
								class="hover:text-white hover:bg-gray-800 cursor-pointer transition-colors duration-150 rounded px-1"
								title={`${spurt.duration.toFixed(2)}s`}
							>
								{spurt.text}{" "}
							</span>
						)}
					</For>
				</div>
			);
		}

		// 2. LIST VIEWS (Ordered & Reversed)
		// We need to preprocess the list to calculate gaps between items
		const listItems = isReversed ? [...spurts].reverse() : spurts;

		return (
			<div class="flex flex-col">
				<For each={listItems}>
					{(spurt, index) => {
						// Calculate the Pause Gap
						// In Ordered: Gap is time between THIS spurt end and NEXT spurt start
						// In Reversed: Gap is time between THIS spurt end and PREVIOUS (chronological) spurt start

						let gapTime = 0;
						let showParagraphDivider = false;

						if (!isReversed) {
							// ORDERED LOGIC
							const nextSpurt = listItems[index() + 1];
							if (nextSpurt) {
								const myEnd = spurt.createdAt + (spurt.duration * 1000);
								gapTime = (nextSpurt.createdAt - myEnd) / 1000;
								if (nextSpurt.isParagraphStart) showParagraphDivider = true;
							}
						} else {
							// REVERSED LOGIC
							// In reversed, the "Next" item in the list is actually the "Previous" chronological item
							// But visually, we want to show the gap that occurred AFTER the current item displayed
							const prevSpurt = listItems[index() - 1]; // The one above me visually (chronologically newer)

							// Actually, for reversed, it's cleaner to show the gap that led TO this spurt?
							// Let's stick to the visual flow: Top to Bottom.
							// Item 0 (Newest) -> Gap that happened before it -> Item 1

							if (index() < listItems.length - 1) {
								const nextVisualItem = listItems[index() + 1]; // Chronologically older
								const olderEnd = nextVisualItem.createdAt + (nextVisualItem.duration * 1000);
								gapTime = (spurt.createdAt - olderEnd) / 1000;
								if (spurt.isParagraphStart) showParagraphDivider = true;
							}
						}

						// Cap gap at 0 for safety
						gapTime = Math.max(0, gapTime);

						// Calculate Bar Width % (Scale relative to Paragraph Threshold)
						// If gap is 2.5s and Threshold is 5s, bar is 50% width
						const barWidth = Math.min(100, (gapTime * 1000 / props.gapThreshold) * 100);

						return (
							<div class="group relative">
								{/* PARAGRAPH DIVIDER (The Line) */}
								{showParagraphDivider && (
									<div class="w-full h-px bg-gray-800 my-6"></div>
								)}

								{/* THE ROW: Content | Timeline */}
								<div class="flex gap-4">

									{/* LEFT: The Text (Flexible Width) */}
									<div class="flex-1 text-[14pt] leading-relaxed break-words py-1 border-b border-gray-900/50">
										<span class="hover:text-white transition-colors">{spurt.text}</span>

										{/* The "Small Separator" inside a paragraph (if NOT a paragraph break) */}
										{!showParagraphDivider && gapTime > 0 && (
											<div class="h-1 w-full"></div>
										)}
									</div>

									{/* RIGHT: The Timeline (Fixed Width) */}
									<div class="w-16 flex flex-col items-end justify-center text-[10px] font-mono text-gray-600 opacity-50 group-hover:opacity-100 transition-opacity">

										{/* Spurt Duration */}
										<div class="text-blue-500/80">{spurt.duration.toFixed(1)}s</div>

										{/* The Gap Bar (Only if there is a next item) */}
										{(gapTime > 0 && !showParagraphDivider) && (
											<div class="w-full flex items-center justify-end gap-1 mt-1 h-3">
												<span class="text-gray-700">{gapTime.toFixed(1)}s</span>
												<div class="h-1 bg-gray-700 rounded-full" style={{ width: `${barWidth}%` }}></div>
											</div>
										)}
									</div>
								</div>
							</div>
						);
					}}
				</For>
			</div>
		);
	};

	return (
		<div
			onClick={props.onActivate}
			class={`
        w-[56ch] flex flex-col gap-2 transition-all duration-300 p-6 rounded relative
        ${props.isActive ? 'bg-[#1a1a1a] border border-gray-600 shadow-xl' : 'opacity-60 hover:opacity-100 border border-transparent'}
      `}
		>
			{/* HEADER */}
			<div class="flex justify-between items-center text-xs uppercase tracking-widest text-gray-500 mb-4 border-b border-gray-800 pb-2">
				<div class="w-20 font-mono text-gray-400">
					{totalTime()}s
				</div>

				<button
					onClick={(e) => { e.stopPropagation(); props.onToggleView(); }}
					class="text-[10px] bg-gray-800 hover:bg-gray-700 text-gray-400 px-3 py-1 rounded transition-colors"
				>
					{viewLabel()}
				</button>

				<div class="w-20 text-right flex justify-end gap-3">
					<button onClick={(e) => { e.stopPropagation(); props.onClear(); }} class="hover:text-yellow-500 font-bold">CLR</button>
					<button onClick={(e) => { e.stopPropagation(); props.onDelete(); }} class="hover:text-red-500 font-bold px-1">✕</button>
				</div>
			</div>

			<input
				value={props.data.title}
				onInput={(e) => props.onUpdateTitle(e.currentTarget.value)}
				class="bg-transparent text-center font-bold text-gray-300 focus:text-white outline-none w-full text-sm mb-6"
				placeholder="Untitled Stream"
			/>

			{renderContent()}
		</div>
	);
};
