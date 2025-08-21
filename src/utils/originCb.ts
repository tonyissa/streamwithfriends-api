type OriginCallback = (err: Error | null, origin: ValueOrArray<OriginType>) => void
type OriginType = string | boolean | RegExp
type ValueOrArray<T> = T | ArrayOfValueOrArray<T>

interface ArrayOfValueOrArray<T> extends Array<ValueOrArray<T>> {
}

export default function originCB(origin: string | undefined, cb: OriginCallback): void {
    const allowed = [
        "https://streamwithfriends.vercel.app",
        "http://localhost:5173"
      ];
      const ngrokRegex = /^https:\/\/[a-z0-9-]+\.ngrok-free\.app$/;
      if (!origin) {
        cb(null, true);
        return;
      }
      if (allowed.includes(origin) || ngrokRegex.test(origin)) {
        cb(null, origin);
      } else {
        cb(new Error("Not allowed"), false);
      }
}