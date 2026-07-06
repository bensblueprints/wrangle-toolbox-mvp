// query.js — JSONPath queries via jsonpath-plus. Pure JS, no Electron/DOM imports.
import { JSONPath } from 'jsonpath-plus';

export const CHEATSHEET = [
  { expr: '$', desc: 'Root object' },
  { expr: '$.store.book[*].author', desc: 'All authors of all books' },
  { expr: '$..author', desc: 'All authors, anywhere in the document' },
  { expr: '$.store.*', desc: 'Everything directly under store' },
  { expr: '$..book[2]', desc: 'The third book' },
  { expr: '$..book[-1:]', desc: 'The last book' },
  { expr: '$..book[0,1]', desc: 'The first two books' },
  { expr: '$..book[?(@.isbn)]', desc: 'Books that have an ISBN' },
  { expr: '$..book[?(@.price<10)]', desc: 'Books cheaper than 10' },
  { expr: '$..*', desc: 'Every value in the document' },
];

export function runJsonPath(input, pathExpr) {
  if (!pathExpr || !pathExpr.trim()) throw new Error('Enter a JSONPath expression (e.g. $.store.book[*].title)');
  const json = typeof input === 'string' ? JSON.parse(input) : input;
  const result = JSONPath({ path: pathExpr, json, wrap: true });
  return { count: result.length, result };
}
