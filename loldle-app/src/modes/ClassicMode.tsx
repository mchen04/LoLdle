import { useMemo } from 'react'
import { useGame } from '../hooks/useGame'
import { ChampionSearch } from '../components/ChampionSearch'
import { VictoryState } from '../components/VictoryState'
import { evaluateClassicGuess, getMatchColor } from '../utils/gameLogic'
import { getChampionById } from '../data'
import type { ClassicGuessResult, AppSettings } from '../types/champion'

const COLUMNS = [
  { key: 'champion', label: 'Champion' },
  { key: 'gender', label: 'Gender' },
  { key: 'positions', label: 'Position(s)' },
  { key: 'species', label: 'Species' },
  { key: 'resource', label: 'Resource' },
  { key: 'rangeType', label: 'Range' },
  { key: 'regions', label: 'Region(s)' },
  { key: 'releaseYear', label: 'Year' },
] as const

interface Props {
  settings: AppSettings
}

export function ClassicMode({ settings }: Props) {
  const { target, guessIds, solved, guessCount, submitGuess, nextRound } = useGame('classic')

  const guessResults: ClassicGuessResult[] = useMemo(() => {
    if (!target) return []
    return guessIds
      .map(id => getChampionById(id))
      .filter(Boolean)
      .map(guess => evaluateClassicGuess(guess!, target))
  }, [guessIds, target])

  if (!target) return null

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {solved ? (
        <VictoryState champion={target} mode="classic" guessCount={guessCount} onNextRound={nextRound} />
      ) : (
        <ChampionSearch
          onSelect={submitGuess}
          usedIds={guessIds}
          placeholder="Guess a champion..."
          hardMode={settings.hardMode}
        />
      )}

      {guessResults.length > 0 && (
        <div className={`w-full overflow-x-auto scrollbar-thin ${settings.scaleToFit ? 'max-w-full' : ''}`}>
          <table className={`w-full border-collapse min-w-[640px] ${settings.scaleToFit ? 'table-fixed' : ''}`}>
            <thead>
              <tr>
                {COLUMNS.map(col => (
                  <th
                    key={col.key}
                    className="px-2 py-2 text-xs font-semibold text-lol-text uppercase tracking-wider text-center"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {guessResults.map((result, rowIdx) => (
                <GuessRow
                  key={result.champion.id}
                  result={result}
                  rowIdx={rowIdx}
                  colorblind={settings.colorblind}
                  isNew={rowIdx === 0 && !solved}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function GuessRow({ result, rowIdx, colorblind, isNew }: {
  result: ClassicGuessResult
  rowIdx: number
  colorblind: boolean
  isNew: boolean
}) {
  const { champion: guess, matches } = result
  const isCorrect = matches.champion === 'correct'

  const cells = [
    {
      content: (
        <div className="flex flex-col items-center gap-1">
          <img src={guess.icon} alt="" className="w-8 h-8 rounded" />
          <span className="text-xs font-medium leading-tight">{guess.name}</span>
        </div>
      ),
      color: getMatchColor(matches.champion, colorblind),
    },
    {
      content: <span className="text-sm">{guess.gender}</span>,
      color: getMatchColor(matches.gender, colorblind),
    },
    {
      content: <span className="text-xs leading-tight">{guess.positions.join(', ')}</span>,
      color: getMatchColor(matches.positions, colorblind),
    },
    {
      content: <span className="text-xs leading-tight">{guess.species.join(', ')}</span>,
      color: getMatchColor(matches.species, colorblind),
    },
    {
      content: <span className="text-xs leading-tight">{guess.resource}</span>,
      color: getMatchColor(matches.resource, colorblind),
    },
    {
      content: <span className="text-sm">{guess.rangeType}</span>,
      color: getMatchColor(matches.rangeType, colorblind),
    },
    {
      content: <span className="text-xs leading-tight">{guess.regions.join(', ')}</span>,
      color: getMatchColor(matches.regions, colorblind),
    },
    {
      content: (
        <div className="flex items-center justify-center gap-1">
          <span className="text-sm">{guess.releaseYear}</span>
          {matches.releaseYear.hint !== 'correct' && (
            <span className="text-base">{matches.releaseYear.hint === 'higher' ? '↑' : '↓'}</span>
          )}
        </div>
      ),
      color: getMatchColor(matches.releaseYear.result, colorblind),
    },
  ]

  return (
    <tr className={isCorrect ? 'ring-2 ring-lol-gold rounded' : ''}>
      {cells.map((cell, colIdx) => (
        <td
          key={colIdx}
          className={`p-1.5 text-center ${cell.color} border border-lol-darker/50
                     ${isNew ? 'tile-reveal' : ''}`}
          style={isNew ? { animationDelay: `${colIdx * 0.08}s` } : undefined}
        >
          <div className="flex items-center justify-center min-h-[3rem] text-white">
            {cell.content}
          </div>
        </td>
      ))}
    </tr>
  )
}
