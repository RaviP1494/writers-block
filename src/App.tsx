import { createSignal, For } from 'solid-js';
import { Block } from './components/Block';
import { StreamView } from './components/StreamView';
import type { Spurt, StreamData, ViewMode } from './types';

function App() {
	// Initial State: One Stream
	const [streams, setStreams] = createSignal<StreamData[]>([
		{ id: '1', title: 'Stream Alpha', spurts: [], viewMode: 'wall' }
	]);

	// Which stream is receiving input?
	const [activeStreamId, setActiveStreamId] = createSignal('1');

	// --- ACTIONS ---

	const handleNewSpurt = (spurt: Spurt) => {
		setStreams(prev => prev.map(stream => {
			if (stream.id === activeStreamId()) {
				return { ...stream, spurts: [...stream.spurts, spurt] };
			}
			return stream;
		}));
	};

	const createNewStream = () => {
		const newId = crypto.randomUUID();
		setStreams(prev => [
			...prev,
			{ id: newId, title: 'New Stream', spurts: [], viewMode: 'wall' }
		]);
		setActiveStreamId(newId); // Auto-focus the new one
	};

	const updateTitle = (id: string, newTitle: string) => {
		setStreams(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
	};

	const clearStream = (id: string) => {
		setStreams(prev => prev.map(s => s.id === id ? { ...s, spurts: [] } : s));
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

			{/* 1. THE BLOCK */}
			<div class="fixed top-8 z-10 w-[48ch] bg-[#1a1a1a]/90 backdrop-blur border border-gray-700 p-6 rounded shadow-2xl">
				<Block
					delayThreshold={1000}
					onSpurt={handleNewSpurt}
				/>
				<div class="absolute -right-32 top-0">
					<button
						onClick={createNewStream}
						class="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded text-xs border border-gray-600 transition-all"
					>
						+ New Stream
					</button>
				</div>
			</div>

			{/* Spacer for the fixed header */}
			<div class="h-64"></div>

			{/* 2. THE STREAMS CONTAINER (Horizontal Layout) */}
			<div class="flex flex-wrap justify-center gap-8 px-8 w-full">
				<For each={streams()}>
					{(stream) => (
						<StreamView
							data={stream}
							isActive={stream.id === activeStreamId()}
							onActivate={() => setActiveStreamId(stream.id)}
							onUpdateTitle={(val) => updateTitle(stream.id, val)}
							onClear={() => clearStream(stream.id)}
							onToggleView={() => toggleViewMode(stream.id)}
						/>
					)}
				</For>
			</div>

		</div>
	);
}

export default App;
