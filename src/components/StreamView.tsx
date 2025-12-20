import { createMemo, For } from 'solid-js';
import type { StreamData } from '../types';

interface StreamViewProps {
	data: StreamData;
	isActive: boolean;
	gapThreshold: number;
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

		// 1. WALL VIEW (Strict Inline)
		if (isWall) {
			return (
				<div class="text-[14pt] leading-relaxed break-words whitespace-normal text-left">
					<For each={spurts}>
						{(spurt, i) => (
							<>
								{/* Paragraph Break: A literal empty block to force a new line */}
								{/* Only if it's a paragraph start AND not the very first item */}
								{(spurt.isParagraphStart && i() > 0) && (
									<div class="h-4 w-full block"></div>
								)}
								<span
									class="hover:text-white hover:bg-gray-400 cursor-pointer transition-colors duration-150 rounded px-1"
									title={`${spurt.duration.toFixed(2)}s`}
								>
									{spurt.text}{" "}
								</span>
							</>
						)}
					</For>
				</div>
			);
		}

		// 2. LIST VIEWS (Ordered & Reversed)
		// We process list to render Spurt + The Gap that follows it visually
		const listItems = isReversed ? [...spurts].reverse() : spurts;

		return (
			<div class="flex flex-col gap-1">
				<For each={listItems}>
					{(spurt, index) => {
						// --- GAP CALCULATION ---
						let gapTime = 0;
						let isParaBreak = false; // Is the NEXT thing a paragraph break?

						if (!isReversed) {
							// ORDERED: Gap is between ME and NEXT
							const nextSpurt = listItems[index() + 1];
							if (nextSpurt) {
								const myEnd = spurt.createdAt + (spurt.duration * 1000);
								gapTime = (nextSpurt.createdAt - myEnd) / 1000;
								isParaBreak = nextSpurt.isParagraphStart;
							}
						} else {
							// REVERSED: Gap is between ME and the one VISUALLY BELOW me (chronologically older)
							// Actually, in reverse view, we usually want to see the gap that led *to* this spurt.
							// But consistent with "Timeline", let's show the gap *after* this thought.

							const nextVisualItem = listItems[index() + 1]; // This is chronologically OLDER
							if (nextVisualItem) {
								// Gap = (My Start) - (Older Item End)
								const olderEnd = nextVisualItem.createdAt + (nextVisualItem.duration * 1000);
								gapTime = (spurt.createdAt - olderEnd) / 1000;
								isParaBreak = spurt.isParagraphStart; // If I am a paragraph start, there is a big break below me
							}
						}

						gapTime = Math.max(0, gapTime);

						// Bar Width Logic
						const barWidthPercent = Math.min(100, (gapTime * 1000 / props.gapThreshold) * 100);

						return (
							<div class="flex flex-col">

								{/* A. THE SPURT ROW */}
								<div class="flex gap-4 items-baseline group">
									{/* Left: Text */}
									<div class="flex-1 text-[14pt] leading-relaxed break-words">
										<span class="hover:text-white transition-colors">{spurt.text}</span>
									</div>
									{/* Right: Duration */}
									<div class="w-12 text-right text-[10px] font-mono text-green-400/60 group-hover:text-lime-300">
										{spurt.duration.toFixed(1)}s
									</div>
								</div>

								{/* B. THE GAP ROW (Only if there is a next item) */}
								{index() < listItems.length - 1 && (
									<div class="flex gap-4 items-center my-1 h-4">

										{/* Left: The Visual Bar area */}
										<div class="flex-1 flex items-center justify-center h-full relative">

											{/* Scenario 1: Paragraph Break (The Horizontal Line) */}
											{isParaBreak ? (
												<div class="w-full h-px bg-gray-400"></div>
											) : (
												/* Scenario 2: Just a Pause (The Centered Growing Bar) */
												/* Only show if gap > 0.1s to avoid clutter */
												gapTime > 0.1 && (
													<div
														class="h-1 bg-gray-300 rounded-full transition-all"
														style={{ width: `${barWidthPercent}%`, 'min-width': '2px' }}
													></div>
												)
											)}
										</div>

										{/* Right: Gap Time */}
										<div class="w-12 text-right text-[10px] font-mono text-gray-400">
											{/* Only show gap time if it's significant (>0.5s) */}
											{gapTime > 0.5 && `${gapTime.toFixed(1)}s`}
										</div>
									</div>
								)}
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
