export const colors = {ground:'#233f34'};
export const fontFamily = 'DM Sans Variable, sans-serif';
export const weights = {prefix:500,headline:700,eventName:500,name:700,title:400};
export function familyFor(id:string):string { return id === 'serif' ? 'Fraunces Variable, Georgia, serif' : id === 'mono' ? 'monospace' : fontFamily; }
