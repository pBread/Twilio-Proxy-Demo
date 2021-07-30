import qs from "querystring";

/****************************************************
 Arrays
****************************************************/
export function toArray(it: any) {
  return Array.isArray(it) ? it : [it];
}

/****************************************************
 Environment
****************************************************/
export const isDev = process.env.NODE_ENV === "development";

export function makeUrl<Q extends {}>(pathname: string, query?: Q) {
  const origin = isDev ? "http://localhost:3001" : window.location.origin;

  const qStr = query ? qs.stringify(query) : null;
  return `${origin}/${pathname}${qStr ? `?${qStr}` : ""}`;
}

/****************************************************
 Functions
****************************************************/
export function safeFn<F extends (...args: any[]) => any>(
  fn: F,
  ...args: any[]
) {
  try {
    return fn(...args);
  } catch {
    return null;
  }
}

/****************************************************
 Objects
****************************************************/
export function cleanObj<T extends {}>(obj: T) {
  return Object.entries(obj)
    .filter(([key, val]) => val !== undefined && val !== null)
    .reduce((acc, [key, val]) => ({ ...acc, [key]: val }), {});
}

/****************************************************
 Phone Formatting
****************************************************/
export function to10DLC(phone: string) {
  const { area, prefix, line } = phone.match(
    /^\s*(?:\+?(?<country>\d{1,3}))?[-. (]*(?<area>\d{3})[-. )]*(?<prefix>\d{3})[-. ]*(?<line>\d{4})(?: *x(\d+))?\s*$/
  ).groups;

  return `+${1}${area}${prefix}${line}`;
}

export function toPrettyPhone(phone: string) {
  const { area, prefix, line } = phone.match(
    /^\s*(?:\+?(?<country>\d{1,3}))?[-. (]*(?<area>\d{3})[-. )]*(?<prefix>\d{3})[-. ]*(?<line>\d{4})(?: *x(\d+))?\s*$/
  ).groups;

  return `(${area}) ${prefix}-${line}`;
}
