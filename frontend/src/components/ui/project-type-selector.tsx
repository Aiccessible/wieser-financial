'use client'

import {
    ChevronDownIcon,
    BrainCircuitIcon,
    ChevronUpIcon,
    StarIcon,
    MapIcon,
} from 'lucide-react'
import { useState } from 'react'

const projectTypes = {
    personalWebsite: <StarIcon size={18} className="text-purple-500" />,
    landingPage: <MapIcon size={18} className="text-green-500" />,
    other: <BrainCircuitIcon size={18} className="text-orange-500" />,
}

export type ProjectOption = 'personalWebsite' | 'landingPage' | 'other'

const modelArray: ProjectOption[] = ['personalWebsite', 'landingPage', 'other']
const ProjectTypeSelector = ({
    selectedProject,
    setSelectedProject,
}: {
    selectedProject: ProjectOption | undefined
    setSelectedProject: (model: ProjectOption) => void
}) => {
    const [open, setOpen] = useState(false)
    return (
        <div className="relative w-full">
            <div className="relative mt-1">
                <button
                    onClick={() => setOpen(!open)}
                    className=" flex items-center justify-between px-4 py-2 text-lg font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl shadow-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all cursor-pointer"
                >
                    <div className="flex items-center gap-2">
                        {selectedProject && projectTypes[selectedProject]}
                        <span className="capitalize">
                            {selectedProject ?? 'Project Type'}
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
                    className="absolute left-0 mt-2  bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden"
                >
                    {open &&
                        modelArray.map((model) => (
                            <div
                                key={model}
                                onClick={() => {
                                    setOpen(!open)
                                    //localStorage.setItem("asimov-model", model);
                                    setSelectedProject(model)
                                }}
                                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-all"
                            >
                                {projectTypes[model]}
                                <span className="capitalize">
                                    {model }
                                </span>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    )
}

export default ProjectTypeSelector
