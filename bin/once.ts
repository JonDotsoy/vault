export const once = <T>(f: () => T, m?: T) => () => ((m = m ?? f()), m)
