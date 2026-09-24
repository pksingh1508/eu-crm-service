// First letter (or digit) of the first two words, e.g. "Anna Nowak" -> "AN"
const getInitials = (name: string) =>
  name
    .split("@")[0]
    .split(/[\s._-]+/)
    .map((part) => part.match(/[\p{L}\p{N}]/u)?.[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?"

const InitialsAvatar = ({ name }: { name: string }) => (
  <span
    aria-hidden="true"
    className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-muted/60 text-[11px] font-semibold text-foreground/80"
  >
    {getInitials(name)}
  </span>
)

export default InitialsAvatar
