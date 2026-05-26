import { useMemo } from 'react'
import { useGame } from '../hooks/useGame'
import { ChampionSearch } from '../components/ChampionSearch'
import { VictoryState } from '../components/VictoryState'
import { GiveUpButton } from '../components/GiveUpButton'
import { evaluateClassicGuess, getMatchColor } from '../utils/gameLogic'
import { getChampionById } from '../data'
import type { ClassicGuessResult, AppSettings } from '../types/champion'

const COLUMNS = [
  { key: 'champion', label: 'Champ' },
  { key: 'gender', label: 'Gender' },
  { key: 'positions', label: 'Pos' },
  { key: 'species', label: 'Species' },
  { key: 'resource', label: 'Res' },
  { key: 'rangeType', label: 'Range' },
  { key: 'regions', label: 'Region' },
  { key: 'releaseYear', label: 'Year' },
] as const

interface Props {
  settings: AppSettings
}

export function ClassicMode({ settings }: Props) {
  const { target, guessIds, solved, givenUp, guessCount, submitGuess, nextRound, giveUp } = useGame('classic')

  const guessResults: ClassicGuessResult[] = useMemo(() => {
    if (!target) return []
    return guessIds.flatMap(id => {
      const guess = getChampionById(id)
      return guess ? [evaluateClassicGuess(guess, target)] : []
    })
  }, [guessIds, target])

  if (!target) return null

  const isFinished = solved || givenUp

  return (
    <div className="flex flex-col h-full gap-2">
      {isFinished ? (
        <div className="flex justify-center">
          <VictoryState champion={target} mode="classic" guessCount={guessCount} givenUp={givenUp} onNextRound={nextRound} />
        </div>
      ) : (
        <div className="flex-shrink-0 flex flex-col items-center gap-1 w-full">
          <ChampionSearch
            onSelect={submitGuess}
            usedIds={guessIds}
            placeholder="Guess a champion..."
            hardMode={settings.hardMode}
          />
          <GiveUpButton onClick={giveUp} />
        </div>
      )}

      {guessResults.length > 0 && (
        <div className="flex-1 min-h-0 w-full overflow-auto scrollbar-thin">
          <table className="w-full border-collapse min-w-[560px] table-fixed">
            <thead className="sticky top-0 z-10 bg-lol-dark">
              <tr>
                {COLUMNS.map(col => (
                  <th key={col.key} className="px-1 py-1 text-[10px] font-semibold text-lol-text uppercase tracking-wider text-center">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {guessResults.map((result, i) => (
                <GuessRow key={result.champion.id} result={result} colorblind={settings.colorblind} isNew={i === 0 && !isFinished} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function GuessRow({ result, colorblind, isNew }: { result: ClassicGuessResult; colorblind: boolean; isNew: boolean }) {
  const { champion: guess, matches } = result
  const isCorrect = matches.champion === 'correct'

  const cells = [
    { content: (<div className="flex flex-col items-center gap-0.5"><img src={guess.icon} alt="" className="w-6 h-6 rounded" /><span className="text-[9px] font-medium leading-tight">{guess.name}</span></div>), color: getMatchColor(matches.champion, colorblind) },
    { content: <span className="text-xs">{guess.gender}</span>, color: getMatchColor(matches.gender, colorblind) },
    { content: <span className="text-[10px] leading-tight">{guess.positions.join(', ')}</span>, color: getMatchColor(matches.positions, colorblind) },
    { content: <span className="text-[10px] leading-tight">{guess.species.join(', ')}</span>, color: getMatchColor(matches.species, colorblind) },
    { content: <span className="text-[10px] leading-tight">{guess.resource}</span>, color: getMatchColor(matches.resource, colorblind) },
    { content: <span className="text-xs">{guess.rangeType}</span>, color: getMatchColor(matches.rangeType, colorblind) },
    { content: <span className="text-[10px] leading-tight">{guess.regions.join(', ')}</span>, color: getMatchColor(matches.regions, colorblind) },
    { content: (<div className="flex items-center justify-center gap-0.5"><span className="text-xs">{guess.releaseYear}</span>{matches.releaseYear.hint !== 'correct' && <span className="text-sm">{matches.releaseYear.hint === 'higher' ? '↑' : '↓'}</span>}</div>), color: getMatchColor(matches.releaseYear.result, colorblind) },
  ]

  return (
    <tr className={isCorrect ? 'ring-2 ring-lol-gold rounded' : ''}>
      {cells.map((cell, colIdx) => (
        <td key={colIdx} className={`p-1 text-center ${cell.color} border border-lol-darker/50 ${isNew ? 'tile-reveal' : ''}`}
          style={isNew ? { animationDelay: `${colIdx * 0.08}s` } : undefined}>
          <div className="flex items-center justify-center min-h-[2.2rem] text-white">{cell.content}</div>
        </td>
      ))}
    </tr>
  )
}
