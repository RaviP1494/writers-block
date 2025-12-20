import { createSignal, For } from 'solid-js';
import { Block } from './components/Block';
import { StreamView } from './components/StreamView';
import type { Spurt, StreamData, ViewMode } from './types';

function App() {
	// --- STATE ---
	const [streams, setStreams] = createSignal<StreamData[]>([
		{ id: '1', title: 'Stream Alpha', spurts: [], viewMode: 'wall' }
	]);
	const [activeStreamId, setActiveStreamId] = createSignal('1');

	// TUNING CONTROLS
	const [delayMs, setDelayMs] = createSignal(1000); // Default: 1.0s to cut
	const [paraMs, setParaMs] = createSignal(5000);   // Default: 5.0s to paragraph

	// --- ACTIONS ---

	const handleNewSpurt = (incoming: Partial<Spurt>) => {
		setStreams(prev => prev.map(stream => {
			if (stream.id !== activeStreamId()) return stream;

			const lastSpurt = stream.spurts[stream.spurts.length - 1];
			let isNewParagraph = true;

			if (lastSpurt) {
				// CORRECTION: Measure gap from the END of the last spurt
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
			{ id: newId, title: 'New Stream', spurts: [], viewMode: 'wall' }
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

	return (
		<div class="min-h-screen bg-[#111] text-gray-300 font-mono flex flex-col items-center py-12 gap-8">

			{/* 1. THE BLOCK & CONTROLS */}
			<div class="fixed top-8 z-10 w-[48ch] bg-[#1a1a1a]/95 backdrop-blur border border-gray-700 p-6 rounded shadow-2xl transition-all">

				{/* The Engine */}
				<Block
					delayThreshold={delayMs()}
					paragraphThreshold={paraMs()} // Passing it down (even if Block doesn't strictly logic it, keeps interface clean)
					onSpurt={handleNewSpurt}
				/>

				{/* The Tuning Dashboard */}
				<div class="flex justify-between items-center mt-6 pt-4 border-t border-gray-800 text-xs">

					{/* Cut Delay Control */}
					<div class="flex items-center gap-2">
						<label class="text-gray-500 font-bold uppercase tracking-wider">Cut(ms)</label>
						<input
							type="number"
							value={delayMs()}
							onInput={(e) => setDelayMs(Number(e.currentTarget.value))}
							class="bg-gray-900 border border-gray-700 rounded w-16 px-2 py-1 text-center text-blue-400 focus:border-blue-500 outline-none"
						/>
					</div>

					{/* Paragraph Threshold Control */}
					<div class="flex items-center gap-2">
						<label class="text-gray-500 font-bold uppercase tracking-wider">Gap(ms)</label>
						<input
							type="number"
							value={paraMs()}
							onInput={(e) => setParaMs(Number(e.currentTarget.value))}
							class="bg-gray-900 border border-gray-700 rounded w-16 px-2 py-1 text-center text-purple-400 focus:border-purple-500 outline-none"
						/>
					</div>

				</div>

				{/* New Stream Button (Floating) */}
				<div class="absolute -right-32 top-0">
					<button
						onClick={createNewStream}
						class="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded text-xs border border-gray-600 transition-all"
					>
						+ New Stream
					</button>
				</div>
			</div>

			<div class="h-64"></div>

			{/* 2. THE STREAMS */}
			<div class="flex flex-wrap justify-center gap-8 px-8 w-full">
				<For each={streams()}>
					{(stream) => (
						<StreamView 
  data={stream}
  isActive={stream.id === activeStreamId()}
  gapThreshold={paraMs()} // <--- PASS THIS PROP
  onActivate={() => setActiveStreamId(stream.id)}
  onUpdateTitle={(val) => updateTitle(stream.id, val)}
  onClear={() => clearStream(stream.id)}
  onDelete={() => deleteStream(stream.id)}
  onToggleView={() => toggleViewMode(stream.id)}
/>
					)}
				</For>
			</div>
		</div>
	);
}

export default App;
