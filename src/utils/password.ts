export async function saltAndHashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const data = encoder.encode(password);
    const salted = new Uint8Array([...salt, ...data]);

    const hashBuffer = await crypto.subtle.digest("SHA-256", salted);
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    return `${Buffer.from(salt).toString("base64")}:${Buffer.from(hashArray).toString("base64")}`;
}


export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
    const [saltB64, hashB64] = storedHash.split(":");
    if (!saltB64 || !hashB64) return false;

    const salt = Uint8Array.from(Buffer.from(saltB64, "base64"));
    const expectedHash = Buffer.from(hashB64, "base64");

    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const salted = new Uint8Array([...salt, ...data]);

    const hashBuffer = await crypto.subtle.digest("SHA-256", salted);
    const actualHash = Buffer.from(hashBuffer);

    return expectedHash.length === actualHash.length &&
        expectedHash.every((b, i) => b === actualHash[i]);
}
