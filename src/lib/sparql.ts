import { prefixes as knownPrefixes } from '@zazuko/rdf-vocabularies'
import { BlankNode, Literal, NamedNode, Term, Variable } from 'rdf-js'
import { Value } from './value'
import { PartialString, TemplateResult } from './TemplateResult'
import * as turtleSyntax from './syntax/turtle'

export type SparqlValue<T extends Term = Term> = Value<SparqlTemplateResult, T>

interface SparqlOptions {
  base?: string
  prologue?: boolean
}

function prefixDeclarations(prefixes: Iterable<string>): string[] {
  return [...prefixes]
    .filter(prefix => prefix in knownPrefixes)
    .map(prefix => `PREFIX ${prefix}: <${knownPrefixes[prefix]}>`)
}

export class SparqlTemplateResult extends TemplateResult<SparqlTemplateResult, SparqlValue, SparqlOptions> {
  // eslint-disable-next-line no-useless-constructor
  public constructor(strings: TemplateStringsArray, values: SparqlValue[], turtle: (strings: TemplateStringsArray, ...values: SparqlValue<any>[]) => SparqlTemplateResult) {
    super(strings, values, turtle)
  }

  protected get __defaultOptions(): SparqlOptions {
    return {
      prologue: true,
    }
  }

  protected _evaluateLiteral(term: Literal, options: SparqlOptions): PartialString {
    return turtleSyntax.literal(term, options.base)
  }

  protected _evaluateNamedNode(term: NamedNode, options: SparqlOptions): PartialString {
    return turtleSyntax.namedNode(term, options.base)
  }

  protected _evaluateBlankNode(term: BlankNode): PartialString {
    return {
      value: turtleSyntax.blankNode(term),
      prefixes: [],
    }
  }

  protected _evaluateVariable(term: Variable): PartialString {
    return {
      value: `?${term.value}`,
      prefixes: [],
    }
  }

  protected _getFinalString(result: string, prefixes: Iterable<string>, options: SparqlOptions): string {
    const prologue = options.prologue || typeof options.prologue === 'undefined'
    let prologueLines: string[] = []
    if (prologue) {
      prologueLines = prefixDeclarations(prefixes)
      if (options.base) {
        prologueLines = [`BASE <${options.base}>`, ...prologueLines]
      }
      if (prologueLines.length > 0) {
        prologueLines.push('\n')
      }
    }

    return `${prologueLines.join('\n')}${result}`
  }
}

export const sparql = (strings: TemplateStringsArray, ...values: SparqlValue[]) =>
  new SparqlTemplateResult(strings, values, sparql)
