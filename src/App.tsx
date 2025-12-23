// App.tsx

import { createSignal, For } from 'solid-js';
import { Block } from './components/Block';
import { StreamView } from './components/StreamView';
import type { Spurt, StreamData, ViewMode } from './types';

function App() {
	// --- STATE ---
	const [streams, setStreams] = createSignal<StreamData[]>([
		// Default minimized to false
		{ id: '1', title: 'Stream Alpha', spurts: [], viewMode: 'wall', minimized: false }
	]);
	const [activeStreamId, setActiveStreamId] = createSignal('1');

	// TUNING CONTROLS
	const [delayMs, setDelayMs] = createSignal(1500); // Default: 1.5s to cut
	const [paraMs, setParaMs] = createSignal(10000);   // Default: 10s to paragraph

	// --- ACTIONS ---

	const handleNewSpurt = (incoming: Partial<Spurt>) => {
		setStreams(prev => prev.map(stream => {
			if (stream.id !== activeStreamId()) return stream;

			const lastSpurt = stream.spurts[stream.spurts.length - 1];
			let isNewParagraph = true;

			if (lastSpurt) {
				const lastSpurtEndTime = lastSpurt.createdAt + (lastSpurt.duration * 1000);
				const timeSinceLast = incoming.createdAt! - lastSpurtEndTime;
				isNewParagraph = timeSinceLast > paraMs();
			}

			const fullSpurt: Spurt = {
				id: crypto.randomUUID(),
				text: incoming.text!,
				createdAt: incoming.createdAt!,
				duration: incoming.duration!,
				isParagraphStart: isNewParagraph
			};

			return { ...stream, spurts: [...stream.spurts, fullSpurt] };
		}));
	};

	const createNewStream = () => {
		const newId = crypto.randomUUID();
		setStreams(prev => [
			...prev,
			{ id: newId, title: 'New Stream', spurts: [], viewMode: 'wall', minimized: false }
		]);
		setActiveStreamId(newId);
	};

	const updateTitle = (id: string, newTitle: string) => {
		setStreams(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
	};

	const clearStream = (id: string) => {
		setStreams(prev => prev.map(s => s.id === id ? { ...s, spurts: [] } : s));
	};

	const deleteStream = (id: string) => {
		if (streams().length <= 1) return;
		setStreams(prev => prev.filter(s => s.id !== id));
		// If we deleted the active one, switch to the first available
		if (activeStreamId() === id) {
			setActiveStreamId(streams()[0].id);
		}
	};

	const toggleViewMode = (id: string) => {
		const modes: ViewMode[] = ['wall', 'ordered', 'reversed'];
		setStreams(prev => prev.map(s => {
			if (s.id !== id) return s;
			const currentIndex = modes.indexOf(s.viewMode);
			const nextIndex = (currentIndex + 1) % modes.length;
			return { ...s, viewMode: modes[nextIndex] };
		}));
	};

	// NEW: Toggle Minimize State
	const toggleMinimize = (id: string) => {
		setStreams(prev => prev.map(s => s.id === id ? { ...s, minimized: !s.minimized } : s));
	};

	return (
		<div class="min-h-screen bg-[#111] text-gray-300 font-mono flex flex-col items-center py-12 gap-8 relative">

			{/* 1. THE BLOCK & CONTROLS */}
			<div class="fixed top-8 z-10 w-[28ch] bg-[#1a1a1a]/95 backdrop-blur border border-gray-700 p-6 rounded shadow-2xl transition-all">
				<Block
					delayThreshold={delayMs()}
					paragraphThreshold={paraMs()}
					onSpurt={handleNewSpurt}
				/>

				{/* The Tuning Dashboard */}
				<div class="flex justify-between items-center mt-6 pt-4 border-t border-gray-800/50 text-xs select-none">
					{/* Cut Delay */}
					<div class="flex flex-col items-center gap-3 group">
						<label class="text-blue-500 font-bold uppercase tracking-wider group-hover:text-gray-400 transition-colors">Cut</label>
						<div class="flex items-center bg-gray-900 rounded border border-gray-800 group-hover:border-gray-600 transition-colors">
							<button onClick={() => setDelayMs(prev => Math.max(250, prev - 250))} class="px-2 py-1 text-gray-500 hover:text-white hover:bg-gray-800 rounded-l transition-colors">-</button>
							<span class="w-12 text-center text-blue-500 font-mono">{delayMs()}ms</span>
							<button onClick={() => setDelayMs(prev => prev + 250)} class="px-2 py-1 text-gray-500 hover:text-white hover:bg-gray-800 rounded-r transition-colors">+</button>
						</div>
					</div>
					{/* Paragraph Threshold */}
					<div class="flex flex-col items-center gap-3 group">
						<label class="text-purple-500 font-bold uppercase tracking-wider group-hover:text-gray-400 transition-colors">Gap</label>
						<div class="flex items-center bg-gray-900 rounded border border-gray-800 group-hover:border-gray-600 transition-colors">
							<button onClick={() => setParaMs(prev => Math.max(1000, prev - 250))} class="px-2 py-1 text-gray-500 hover:text-white hover:bg-gray-800 rounded-l transition-colors">-</button>
							<span class="w-12 text-center text-purple-500 font-mono">{paraMs()}ms</span>
							<button onClick={() => setParaMs(prev => prev + 250)} class="px-2 py-1 text-gray-500 hover:text-white hover:bg-gray-800 rounded-r transition-colors">+</button>
						</div>
					</div>
				</div>

				{/* New Stream Button */}
				<div class="absolute left-3/4 -translate-x-14 top-6">
					<button onClick={createNewStream} class="bg-gray-800 hover:bg-gray-700 text-gray-300 px-1 py-1/2 rounded text-xs border border-gray-600 transition-all">+</button>
				</div>
			</div>

			<div class="h-64"></div>

			{/* 2. THE STREAMS (Filtered: Only show if NOT minimized) */}
			<div class="flex flex-wrap justify-center gap-8 px-8 w-full pb-24">
				<For each={streams().filter(s => !s.minimized)}>
					{(stream) => (
						<StreamView
							data={stream}
							isActive={stream.id === activeStreamId()}
							gapThreshold={paraMs()}
							onActivate={() => setActiveStreamId(stream.id)}
							onUpdateTitle={(val) => updateTitle(stream.id, val)}
							onClear={() => clearStream(stream.id)}
							onDelete={() => deleteStream(stream.id)}
							onToggleView={() => toggleViewMode(stream.id)}
							onMinimize={() => toggleMinimize(stream.id)} // <--- Pass toggle
						/>
					)}
				</For>
			</div>

			{/* 3. THE TASKBAR (Fixed Bottom) */}
			{/* Only appears if there is at least one minimized stream */}
			{streams().some(s => s.minimized) && (
				<div class="fixed bottom-0 left-0 w-full bg-[#111]/90 backdrop-blur border-t border-gray-800 p-2 flex gap-2 items-center z-50 overflow-x-auto">
					<span class="text-[10px] text-gray-600 font-bold uppercase tracking-widest ml-4 mr-2">Dock</span>
					<For each={streams().filter(s => s.minimized)}>
						{(stream) => (
							<button
								onClick={() => toggleMinimize(stream.id)}
								class={`
									flex items-center gap-2 px-4 py-2 rounded text-xs font-mono border transition-all
									${stream.id === activeStreamId() ? 'border-blue-500/50 bg-blue-900/10 text-blue-400' : 'border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-600'}
								`}
							>
								<span>{stream.title || "Untitled"}</span>
								<span class="text-gray-600">[{stream.spurts.length}]</span>
							</button>
						)}
					</For>
				</div>
			)}

		</div>
	);
}

export default App;
