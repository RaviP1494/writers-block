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
	const [delayMs, setDelayMs] = createSignal(1500); // Default: 1.0s to cut
	const [paraMs, setParaMs] = createSignal(10000);   // Default: 5.0s to paragraph

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
			<div class="fixed top-8 z-10 w-[28ch] bg-[#1a1a1a]/95 backdrop-blur border border-gray-700 p-6 rounded shadow-2xl transition-all">

				{/* The Engine */}
				<Block
					delayThreshold={delayMs()}
					paragraphThreshold={paraMs()} // Passing it down (even if Block doesn't strictly logic it, keeps interface clean)
					onSpurt={handleNewSpurt}
				/>

{/* The Tuning Dashboard (Stepper Version) */}
        <div class="flex justify-between items-center mt-6 pt-4 border-t border-gray-800/50 text-xs select-none">
            
            {/* Cut Delay Control */}
            <div class="flex flex-col items-center gap-3 group">
              <label class="text-blue-500 font-bold uppercase tracking-wider group-hover:text-gray-400 transition-colors">
                Cut
              </label>
              <div class="flex items-center bg-gray-900 rounded border border-gray-800 group-hover:border-gray-600 transition-colors">
                <button 
                  onClick={() => setDelayMs(prev => Math.max(250, prev - 250))}
                  class="px-2 py-1 text-gray-500 hover:text-white hover:bg-gray-800 rounded-l transition-colors"
                >
                  -
                </button>
                <span class="w-12 text-center text-blue-500 font-mono">
                  {delayMs()}ms
                </span>
                <button 
                  onClick={() => setDelayMs(prev => prev + 250)}
                  class="px-2 py-1 text-gray-500 hover:text-white hover:bg-gray-800 rounded-r transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Paragraph Threshold Control */}
            <div class="flex flex-col items-center gap-3 group">
              <label class="text-purple-500 font-bold uppercase tracking-wider group-hover:text-gray-400 transition-colors">
                Gap
              </label>
              <div class="flex items-center bg-gray-900 rounded border border-gray-800 group-hover:border-gray-600 transition-colors">
                <button 
                  onClick={() => setParaMs(prev => Math.max(1000, prev - 250))}
                  class="px-2 py-1 text-gray-500 hover:text-white hover:bg-gray-800 rounded-l transition-colors"
                >
                  -
                </button>
                <span class="w-12 text-center text-purple-500 font-mono">
                  {paraMs()}ms
                </span>
							<button
								onClick={() => setParaMs(prev => prev + 250)}
								class="px-2 py-1 text-gray-500 hover:text-white hover:bg-gray-800 rounded-r transition-colors"
							>
								+
							</button>
						</div>
					</div>

				</div>
				{/* New Stream Button (Floating) */}
				<div class="absolute left-3/4 -translate-x-14 top-6">
					<button
						onClick={createNewStream}
						class="bg-gray-800 hover:bg-gray-700 text-gray-300 px-1 py-1/2 rounded text-xs border border-gray-600 transition-all"
					>
						+
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
