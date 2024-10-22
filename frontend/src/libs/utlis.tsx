import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import React from 'react'
import { Link } from 'react-router-dom'
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// Define the types for the function arguments
type MakeLinksOfTechnicalPhrasesArgs = {
    gptAnalysis: string
    technicalPhrases: string[]
    id: string
    analysisType: string
}

// Utility function to create links for technical phrases
const makeLinksOfTechnicalPhrases = ({
    gptAnalysis,
    technicalPhrases,
    analysisType,
    id,
}: MakeLinksOfTechnicalPhrasesArgs): JSX.Element => {
    console.log('here2', technicalPhrases)
    if (!gptAnalysis || !technicalPhrases) {
        return <div>{gptAnalysis}</div>
    }

    let remainingText = gptAnalysis // Remaining text to process
    const elements: JSX.Element[] = [] // Array to hold both text and <Link> elements

    // Iterate over each technical phrase and replace it with a <Link> component
    technicalPhrases.forEach((phrase, index) => {
        const phraseIndex = remainingText.toLowerCase().indexOf(phrase.toLowerCase())
        console.log(phraseIndex, remainingText, phrase)
        if (phraseIndex !== -1) {
            // Add any text before the phrase
            if (phraseIndex > 0) {
                elements.push(<span key={`text-before-${index}`}>{remainingText.slice(0, phraseIndex)}</span>)
            }

            // Add the <Link> for the found phrase
            const prefix = id ? `/institution/${id}` : ''
            elements.push(
                <Link
                    key={`link-${index}`}
                    to={`${prefix}/analysis/${analysisType}${encodeURIComponent(phrase)}`} // Customize your link path here
                    className="technical-link text-blue-500 underline hover:text-blue-700 hover:underline-offset-2 transition duration-300 ease-in-out"
                >
                    {phrase}
                </Link>
            )

            // Update the remaining text after the phrase
            remainingText = remainingText.slice(phraseIndex + phrase.length)
        }
    })

    // Add any remaining text after processing all phrases
    if (remainingText) {
        elements.push(<span key="remaining-text">{remainingText}</span>)
    }

    // Return the JSX array with links and text
    return <>{elements}</>
}

export default makeLinksOfTechnicalPhrases
