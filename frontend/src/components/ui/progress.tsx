'use client'
export const Progress = ({ value }: { value: number }) => {
    return (
        <>
            <progress
                value={value}
                max={1}
                style={{
                    width: '250px', // Fixed width for consistency
                    height: '12px', // Slightly larger for better visibility
                    borderRadius: '6px',
                    backgroundColor: '#e0e0e0',
                    boxShadow: '0 4px 10px rgba(0, 122, 255, 0.3)', // Soft blue glow effect
                    border: 'none',
                    appearance: 'none', // Removes browser default styling
                    WebkitAppearance: 'none', // For Safari
                    overflow: 'hidden', // Ensures rounded corners apply properly
                }}
            />
            <style>{`
                progress::-webkit-progress-bar {
                    background-color: #e0e0e0;
                    border-radius: 6px;
                }

                progress::-webkit-progress-value {
                    background-color: #007aff; /* Apple-style blue */
                    border-radius: 6px;
                    transition: width 0.3s ease-in-out; /* Smooth transition effect */
                }

                progress::-moz-progress-bar {
                    background-color: #007aff;
                    border-radius: 6px;
                }
            `}</style>
        </>
    )
}
