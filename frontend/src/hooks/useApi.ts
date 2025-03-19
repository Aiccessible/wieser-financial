export const useAPI = () => {
    // const captcha = useCaptcha();

    const apiFetch = async (url: string, opts?: RequestInit) => {
        const response = await fetch(url, {
            credentials: 'include',
            ...(opts ?? {}),
            headers: {
                // 'g-recaptcha-response': captcha.token,
                ...(opts?.headers ?? {}),
            },
            redirect: 'manual',
        })
        if (response.status === 401) {
            // The redirect URL will be in the Location header

            return response
        } else {
            return response
        }
    }

    return { apiFetch }
}
