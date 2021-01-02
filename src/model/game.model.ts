import {Player} from './player.model';

export interface Game {
    uuid: string

    firstPlayer: Player
    secondPlayer: Player

    currentPlayer: Player

    winner: Player
    winningCode: string

    board: number[][]
}
