export function enumAsStrings<TEnum>(toConvert: TEnum) {
  const strings: string[] = [];
  for (const txnType in toConvert) {
    if (toConvert.hasOwnProperty(txnType)) {
      strings.push(Reflect.get(toConvert as any, txnType));
    }
  }
  return strings;
}
