import { createMemo, For } from 'solid-js';
import type { StreamData, ViewMode } from '../types';

interface StreamViewProps {
	data: StreamData;
	isActive: boolean;
	onActivate: () => void;
	onUpdateTitle: (newTitle: string) => void;
	onClear: () => void;
	onToggleView: () => void;
}

export const StreamView = (props: StreamViewProps) => {

	// Memoized Calculation: Only re-runs when spurts change
	const totalTime = createMemo(() => {
		return props.data.spurts.reduce((acc, s) => acc + s.duration, 0).toFixed(1);
	});

	// Helper for the View Toggle Label
	const viewLabel = () => {
		switch (props.data.viewMode) {
			case 'wall': return 'Wall View';
			case 'ordered': return 'Ordered List';
			case 'reversed': return 'Reversed List';
		}
	};

	// Helper to render the spurts based on mode
	const renderSpurts = () => {
		const spurts = props.data.spurts;
		// For 'reversed', we create a copy and reverse it
		const displaySpurts = props.data.viewMode === 'reversed'
			? [...spurts].reverse()
			: spurts;

		const isWall = props.data.viewMode === 'wall';

		return (
			<div class={`text-[14pt] leading-relaxed break-words whitespace-pre-wrap ${isWall ? '' : 'flex flex-col gap-2'}`}>
				<For each={displaySpurts}>
					{(spurt) => (
						<span
							class={`
                hover:text-white hover:bg-gray-800 cursor-pointer transition-colors duration-150 rounded px-1 -mx-1
                ${isWall ? '' : 'block border-b border-gray-900 pb-1'} 
              `}
							title={`${spurt.duration.toFixed(1)}s`}
						>
							{spurt.text}{" "}
						</span>
					)}
				</For>
				{/* Cursor only makes sense in standard wall/ordered view */}
				{props.data.viewMode !== 'reversed' && (
					<span class="inline-block w-2 h-5 bg-gray-500 animate-pulse align-middle ml-1"></span>
				)}
			</div>
		);
	};

	return (
		<div
			onClick={props.onActivate}
			class={`
        w-[48ch] flex flex-col gap-2 transition-all duration-300 p-4 rounded
        ${props.isActive ? 'bg-[#1a1a1a] border border-gray-600 shadow-xl scale-[1.01]' : 'opacity-60 hover:opacity-100 border border-transparent'}
      `}
		>
			{/* HEADER ROW 1: Time | Title | Clear */}
			<div class="flex justify-between items-center text-xs uppercase tracking-widest text-gray-500">
				<div class="w-16 font-mono text-gray-400">
					{totalTime()}s
				</div>

				<input
					value={props.data.title}
					onInput={(e) => props.onUpdateTitle(e.currentTarget.value)}
					class="bg-transparent text-center font-bold text-gray-300 focus:text-white outline-none w-full"
				/>

				<div class="w-16 text-right">
					<button onClick={(e) => { e.stopPropagation(); props.onClear(); }} class="hover:text-red-500">
						CLR
					</button>
				</div>
			</div>

			{/* HEADER ROW 2: View Toggle (Centered below title) */}
			<div class="flex justify-center mb-4">
				<button
					onClick={(e) => { e.stopPropagation(); props.onToggleView(); }}
					class="text-[10px] bg-gray-800 hover:bg-gray-700 text-gray-400 px-2 py-0.5 rounded transition-colors"
				>
					{viewLabel()}
				</button>
			</div>

			{/* CONTENT */}
			{renderSpurts()}
		</div>
	);
};
