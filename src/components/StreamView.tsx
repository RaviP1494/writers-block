// StreamView.tsx

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
	onMinimize: () => void; // <--- NEW PROP
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

	// ... [renderContent logic remains identical, omitted for brevity but include it in your file] ...
	// (Ensure you keep the renderContent function from your previous file here!)
	const renderContent = () => {
		const spurts = props.data.spurts;
		const mode = props.data.viewMode;
		const isWall = mode === 'wall';
		const isReversed = mode === 'reversed';

		if (isWall) {
			return (
				<div class="text-[14pt] leading-relaxed break-words whitespace-normal text-left">
					<For each={spurts}>
						{(spurt, i) => (
							<>
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

		const listItems = isReversed ? [...spurts].reverse() : spurts;

		return (
			<div class="flex flex-col gap-1">
				<For each={listItems}>
					{(spurt, index) => {
						let gapTime = 0;
						let isParaBreak = false;

						if (!isReversed) {
							const nextSpurt = listItems[index() + 1];
							if (nextSpurt) {
								const myEnd = spurt.createdAt + (spurt.duration * 1000);
								gapTime = (nextSpurt.createdAt - myEnd) / 1000;
								isParaBreak = nextSpurt.isParagraphStart;
							}
						} else {
							const nextVisualItem = listItems[index() + 1];
							if (nextVisualItem) {
								const olderEnd = nextVisualItem.createdAt + (nextVisualItem.duration * 1000);
								gapTime = (spurt.createdAt - olderEnd) / 1000;
								isParaBreak = spurt.isParagraphStart;
							}
						}

						gapTime = Math.max(0, gapTime);
						const barWidthPercent = Math.min(100, (gapTime * 1000 / props.gapThreshold) * 100);

						return (
							<div class="flex flex-col">
								<div class="flex gap-4 items-baseline group">
									<div class="flex-1 text-[14pt] leading-relaxed break-words">
										<span class="hover:text-white transition-colors">{spurt.text}</span>
									</div>
									<div class="w-12 text-right text-[10px] font-mono text-green-400/60 group-hover:text-lime-300">
										{spurt.duration.toFixed(1)}s
									</div>
								</div>

								{index() < listItems.length - 1 && (
									<div class="flex gap-4 items-center my-1 h-4">
										<div class="flex-1 flex items-center justify-center h-full relative">
											{isParaBreak ? (
												<div class="w-full h-px bg-blue-400"></div>
											) : (
												(
													<div
														class="h-1 bg-gray-300 rounded-full transition-all"
														style={{ width: `${barWidthPercent}%`, 'min-width': '2px' }}
													></div>
												)
											)}
										</div>
										<div class="w-12 text-right text-[10px] font-mono text-gray-400">
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
					{/* NEW MINIMIZE BUTTON */}
					<button
						onClick={(e) => { e.stopPropagation(); props.onMinimize(); }}
						class="hover:text-blue-400 font-bold px-1"
						title="Minimize to Dock"
					>
						_
					</button>

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
