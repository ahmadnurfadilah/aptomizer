"use client";

import { ArrowUpRight } from "lucide-react";
import { useRef, useEffect } from "react";

export const ChatInput = ({
	input,
	handleOnSubmit,
	handleInputChange,
}: {
	input: string;
	handleOnSubmit: (e: React.FormEvent<HTMLFormElement> | React.KeyboardEvent<HTMLDivElement>) => void;
	handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
	const textboxRef = useRef<HTMLDivElement>(null);

	// When input changes from outside (like from a suggestion), update the contentEditable div
	useEffect(() => {
		if (textboxRef.current && input !== textboxRef.current.textContent) {
			textboxRef.current.textContent = input;
		}
	}, [input]);

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				const textbox = e.currentTarget.querySelector('[role="textbox"]') as HTMLDivElement;
				handleOnSubmit(e);
				textbox.innerHTML = '';
			}}
			className="w-full rounded-2xl bg-zinc-900 border border-zinc-800 p-4 flex flex-col items-end justify-between gap-2">
			<div
				ref={textboxRef}
				contentEditable
				role="textbox"
				onInput={(e: React.FormEvent<HTMLDivElement>) => {
					const target = e.target as HTMLDivElement;
					if (!target.textContent?.trim()) target.innerHTML = '';
					handleInputChange({ target: { value: target.textContent || '' } } as React.ChangeEvent<HTMLInputElement>);
				}}
				onKeyDown={(e) => {
					if (e.key === 'Enter' && !e.shiftKey) {
						e.preventDefault();
						handleOnSubmit(e);
						(e.target as HTMLDivElement).innerHTML = '';
					}
				}}
				data-placeholder="Send message to AptoMizer..."
				className={`overflow-y-auto max-h-12 whitespace-pre-wrap relative w-full focus:border-none focus:outline-0 focus:ring-0 text-sm before:text-zinc-600 before:absolute before:left-0 before:top-0 before:pointer-events-none empty:before:content-[attr(data-placeholder)]`}
			></div>
			<button className={`rounded-full p-2 shrink-0 bg-white text-gray-900 transition-all disabled:cursor-not-allowed disabled:bg-white/50 ${input.length > 0 && '-rotate-45'}`} disabled={input.length === 0}>
				<ArrowUpRight className="size-4" />
			</button>
		</form>
	);
}
