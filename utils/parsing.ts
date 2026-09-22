export function isValidEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

export function isValidUsername(username: string): boolean {
    const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/;
    return USERNAME_REGEX.test(username);
}