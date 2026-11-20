import { z } from "zod";
import type { InferSchema, ToolMetadata } from "xmcp";

export const schema = {
  query: z.string().describe("Words from the title or author"),
};

export const metadata: ToolMetadata = {
  name: "search-books",
  description: "Search the bookshop catalog by title or author",
  annotations: { readOnlyHint: true },
};

const BOOKS = [
  {
    title: "The Left Hand of Darkness",
    author: "Ursula K. Le Guin",
    inStock: 4,
  },
  { title: "Ficciones", author: "Jorge Luis Borges", inStock: 0 },
  { title: "Kindred", author: "Octavia E. Butler", inStock: 2 },
];

export default function searchBooks({ query }: InferSchema<typeof schema>) {
  const words = query.toLowerCase();
  const books = BOOKS.filter((book) =>
    `${book.title} ${book.author}`.toLowerCase().includes(words)
  );
  return { structuredContent: { books } };
}
