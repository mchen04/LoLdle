interface Props {
  onClick: () => void
}

export function GiveUpButton({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="text-xs text-lol-text/60 hover:text-lol-red transition-colors"
    >
      Give Up
    </button>
  )
}
