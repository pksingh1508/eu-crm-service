// A PostgREST `or` filter that matches rows where any of the columns contains
// the text. Values in `or` filters can't contain , . : ( ) unless quoted, and
// LIKE wildcards are escaped first, so "50%" or "a_b" match literally.
export const containsAny = (columns: string[], text: string) => {
  const pattern = `%${text.replace(/[\\%_]/g, "\\$&")}%`
  const quoted = `"${pattern.replace(/["\\]/g, "\\$&")}"`

  return columns.map((column) => `${column}.ilike.${quoted}`).join(",")
}
