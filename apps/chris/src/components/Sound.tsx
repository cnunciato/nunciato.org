import { signal, Signal } from "@preact/signals";
import { createRef } from "preact";

type Props = {
    url: string;
};

const buffer: Signal<number[]> = signal([]);
const complete: Signal<number> = signal(0);

export default function Sound({ url }: Props) {
    const audioUrl = `/api/audio?f=${url.replace("s3/audio/", "")}`;
    const ref = createRef<HTMLAudioElement>();

    if (!import.meta.env.SSR) {
        async function loadSound(url: string) {
            const ctx = new AudioContext();
            try {
                const response = await fetch(audioUrl);

                const decoded = await ctx.decodeAudioData(await response.arrayBuffer());
                const raw = decoded.getChannelData(0);
                const samples = 1000; // Number of samples we want to have in our final data set
                const blockSize = Math.floor(raw.length / samples); // the number of samples in each subdivision
                const filtered = [];

                for (let i = 0; i < samples; i++) {
                    let blockStart = blockSize * i; // the location of the first sample in the block
                    let sum = 0;
                    for (let j = 0; j < blockSize; j++) {
                        sum = sum + Math.abs(raw[blockStart + j]); // find the sum of all the samples in the block
                    }
                    filtered.push(sum / blockSize); // divide the sum by the block size to get the average
                }

                console.log({ filtered });

                const normalize = (filtered: number[]) => {
                    const multiplier = Math.pow(Math.max(...filtered), -1);
                    return filtered.map(n => n * multiplier);
                };

                const normalized = normalize(filtered);

                console.log({ normalized });

                const data = normalized;
                return data;
            } catch (error: any) {
                console.error(`Unable to fetch the audio file. Error: ${error.message}`);
            }
        }

        loadSound(url).then(b => {
            if (b && buffer.value.length === 0) {
                buffer.value = b;
            }
        });
    }

    function onTime() {
        const current = ref.current?.currentTime;
        const duration = ref.current?.duration;

        if (current && duration) {
            complete.value = (current / duration) * 100;
            console.log(complete.value);
        }
    }

    return (
        <div>
            <div class="relative h-56 w-full">
                <ol class="z-0 absolute flex w-full justify-evenly items-center top-0 right-0 bottom-0 left-0">
                    {buffer.value.map(v => (
                        <li
                            class="bg-neutral-700"
                            style={`height: ${v * 100}%; width: ${100 / buffer.value.length}%;`}
                        ></li>
                    ))}
                </ol>
                <div
                    class="absolute z-10 bg-neutral-200 rounded-lg opacity-50 top-0 right-0 bottom-0 left-0 transition-all"
                    style={`width: ${complete.value}%`}
                ></div>
            </div>
            <audio
                controls
                className="rounded shadow w-full block mt-2"
                ref={ref}
                onTimeUpdate={onTime}
            >
                <source src={audioUrl}></source>
            </audio>
        </div>
    );
}
