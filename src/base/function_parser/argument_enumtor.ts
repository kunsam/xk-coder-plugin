import * as ts from "typescript";

export function NumberKeywordArgEnumtor(): number[] {
  return [null, NaN, 0, -100, 100, 999999999999999999999, Infinity, 100.001];
}

export function StringKeywordArgEnumtor(): string[] {
  return [
    "",
    `longlongstring: StringKeywordArgEnumtorStringKeywordArgEnumtorStringKeywordArgEnumtorStringKeywordArgEnumtor`,
  ];
}

export function getFunctionEnumArgs(
  kind: ts.SyntaxKind,
  argName: string
): any[] {
  switch (kind) {
    case ts.SyntaxKind.NumberKeyword: {
      return NumberKeywordArgEnumtor();
    }
    case ts.SyntaxKind.NullKeyword: {
      return [null];
    }
    case ts.SyntaxKind.StringKeyword: {
      return StringKeywordArgEnumtor();
    }
    case ts.SyntaxKind.FunctionType: {
      return [function () {}];
    }
    default:
    case ts.SyntaxKind.TypeLiteral: {
      return [argName];
    }
  }
}
