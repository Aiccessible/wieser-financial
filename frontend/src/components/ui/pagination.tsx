import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
}) => {
    return (
        <div className="flex items-center justify-center gap-4 font-mono">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-2 border-2 border-black disabled:opacity-50 disabled:cursor-not-allowed hover:border-blue-500 transition-colors"
            >
                <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (pageNum) => (
                        <button
                            key={pageNum}
                            onClick={() => onPageChange(pageNum)}
                            className={`w-8 h-8 flex items-center justify-center border-2 ${
                                pageNum === currentPage
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-black hover:border-blue-500'
                            } transition-colors`}
                        >
                            {pageNum}
                        </button>
                    )
                )}
            </div>

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="p-2 border-2 border-black disabled:opacity-50 disabled:cursor-not-allowed hover:border-blue-500 transition-colors"
            >
                <ChevronRight className="h-4 w-4" />
            </button>
        </div>
    )
}

export { Pagination }
