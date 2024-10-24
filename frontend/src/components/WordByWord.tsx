import React, { useState, useEffect } from 'react'
import { CustomTextBox } from './common/CustomTextBox'

const WordByWordRender = ({ text, typingSpeed = 300 }: any) => {
    const [displayedText, setDisplayedText] = useState('')
    const words = text.split(' ')

    useEffect(() => {
        let wordIndex = 0
        const intervalId = setInterval(() => {
            if (wordIndex < words.length) {
                setDisplayedText((prev) => (prev ? `${prev} ${words[wordIndex]}` : words[wordIndex]))
                wordIndex++
            } else {
                clearInterval(intervalId) // Stop once all words are displayed
            }
        }, typingSpeed)

        return () => clearInterval(intervalId) // Cleanup if component unmounts
    }, [text, typingSpeed, words])

    return <CustomTextBox>{displayedText}</CustomTextBox>
}

export default WordByWordRender
