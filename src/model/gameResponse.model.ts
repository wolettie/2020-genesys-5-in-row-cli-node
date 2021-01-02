import {Game} from './game.model';

export interface GameResponseModel {
    game: Game
    errorMessage: string
}
