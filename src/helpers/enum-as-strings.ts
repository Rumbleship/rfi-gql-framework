export function enumAsStrings<TEnum extends Record<string, any>>(toConvert: TEnum): string[] {
  const strings: string[] = [];
  for (const txnType in toConvert) {
    if (toConvert.hasOwnProperty(txnType)) {
      strings.push(Reflect.get(toConvert as any, txnType));
    }
  }
  return strings;
}
