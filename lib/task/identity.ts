export const kebabCaseToCamelTaskName = (text: string) =>
  // find one or more characters after - and replace with single uppercase
  text.replace(/-./g, (x) => x.toUpperCase()[1]);

export const camelCaseToKebabTaskName = (text: string) =>
  // find one or more uppercase characters and separate with -
  text.replace(/[A-Z]+/g, (match: string) => `-${match}`)
    .toLocaleLowerCase();
