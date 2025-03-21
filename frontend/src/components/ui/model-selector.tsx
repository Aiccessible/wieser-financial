"use client";

import {
    ChevronDownIcon,
    SparklesIcon,
    BrainCircuitIcon,
    BotIcon,
    ChevronUpIcon,
} from "lucide-react";
import { useState } from "react";

const models = {
    sonnet: <SparklesIcon size={18} className="text-purple-500" />,
    o1: <BrainCircuitIcon size={18} className="text-green-500" />,
    "gpt-4o": <BotIcon size={18} className="text-orange-500" />,
};

export type ModelOption = "sonnet" | "gpt-4o";

const modelArray: ModelOption[] = ["sonnet", "gpt-4o"];
const ModelSelector = ({
    selectedModel,
    setSelectedModel,
}: {
    selectedModel: ModelOption;
    setSelectedModel: (model: ModelOption) => void;
}) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative w-64">
            <div className="relative mt-1">
                <button
                    onClick={() => setOpen(!open)}
                    className="w-full flex items-center justify-between px-4 py-2 text-lg font-medium dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl shadow-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all cursor-pointer"
                >
                    <div className="flex items-center gap-2">
                        {models[selectedModel]}
                        <span className="capitalize text-white">
                            {selectedModel === "sonnet"
                                ? "haiku"
                                : selectedModel}
                        </span>
                    </div>
                    {open ? (
                        <ChevronUpIcon
                            className="text-gray-500"
                            size={18}
                            onClick={() => setOpen(false)}
                        />
                    ) : (
                        <ChevronDownIcon
                            className="text-gray-500"
                            size={18}
                            onClick={() => setOpen(true)}
                        />
                    )}
                </button>

                <div
                    style={{ zIndex: 100 }}
                    className="absolute left-0 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden"
                >
                    {open &&
                        modelArray.map((model) => (
                            <div
                                key={model}
                                onClick={() => {
                                    setOpen(!open);
                                    //localStorage.setItem("asimov-model", model);
                                    setSelectedModel(model);
                                }}
                                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-all"
                            >
                                {models[model]}
                                <span className="capitalize">
                                    {model === "sonnet" ? "haiku" : model}
                                </span>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
};

export default ModelSelector;
