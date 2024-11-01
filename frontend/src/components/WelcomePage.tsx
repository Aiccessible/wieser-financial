import { useCallback, useEffect, useState } from 'react'
import WordByWordRender from './WordByWord'
import { CustomTextBox } from './common/CustomTextBox'
import Markdown from 'react-markdown'
import Plaid from '../components/Plaid'
const WelcomePage = ({ setIsDone }: { setIsDone: (arg: boolean) => void }) => {
    const [wordIndex, setWordIndex] = useState(0)
    const typingSpeed = 300
    useEffect(() => {
        const intervalId = setInterval(() => {
            setWordIndex((wordIndex) => {
                if (wordIndex > welcomeMessage.split(' ').length) {
                    setIsDone(true)
                }
                return wordIndex + 1
            })
        }, typingSpeed)

        return () => clearInterval(intervalId) // Cleanup if component unmounts
    }, [typingSpeed, setWordIndex, setIsDone])

    return (
        <CustomTextBox>
            <Markdown>
                {welcomeMessage
                    .split(' ')
                    .slice(0, wordIndex > welcomeMessage.length ? welcomeMessage.length - 1 : wordIndex)
                    .join(' ')}
            </Markdown>
        </CustomTextBox>
    )
}
export default WelcomePage

const welcomeMessage = `**Hi, I’m Wieser**
My mission is to enable everyone to have access to the financial wisdom which is currently kept secret.  
I want to live in a world where everyone can understand their financial journey and guide it to their final destination.

Connecting an account will help me assist you in financial optimization.`
