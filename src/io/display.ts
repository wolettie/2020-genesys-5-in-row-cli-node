import {prompt} from 'prompts';
import {Player} from '../model/player.model';
import {Game} from '../model/game.model';
import * as chalk from 'chalk';
import {AxiosError, AxiosResponse} from 'axios';

/**
 * Put as much console output & input method here
 */

export function playerInfoInput(): Promise<{playerName: string, colour: string}> {
    return prompt([
        {
            type: 'text',
            name: 'playerName',
            message: 'Enter your name'
        },
        {
            type: 'select',
            name: 'colour',
            message: 'Colour',
            choices: [
                {title: 'red', value: 'red'},
                {title: 'green', value: 'green'},
                {title: 'yellow', value: 'yellow'},
                {title: 'blue', value: 'blue'},
                {title: 'magenta', value: 'magenta'},
                {title: 'cyan', value: 'cyan'},
            ]
        }
    ]);
}

export function displayBoard(player: Player, game: Game): void {
    console.clear();
    const rowHeight = game.board[0].length;
    const myNumber = (game.firstPlayer.uuid === player.uuid) ? 1 : 2;
    const myDisk = (game.firstPlayer.uuid === player.uuid) ? 'O' : 'X';
    const oppDisk = (game.firstPlayer.uuid === player.uuid) ? 'X' : 'O';
    for (let r = rowHeight - 1; r >= 0; r--) {
        let rowString = '';
        for (let c = 0; c < game.board.length; c++) {
            const value = game.board[c][r];
            let str = undefined;
            if (value === 0) {
                str = ' ';
            } else if (value === myNumber) {
                str = chalk[player.colour](myDisk);
            } else {
                str = chalk.whiteBright(oppDisk);
            }
            rowString += chalk.grey('[') + str + chalk.grey(']');
        }
        console.log(rowString);
    }
    const colStr = [];
    for (let c = 0; c < game.board.length; c++) {
        colStr.push(` ${c + 1} `);
    }
    console.log(colStr.join(''));
}

export async function selectColumn(player: Player, game: Game) : Promise<number> {
    const {column} = await prompt(
        {
            type: 'number',
            name: 'column',
            message: `It's your turn ${player.name}! Drop disc between 1 and ${game.board.length}`,
            validate: value => value > 0 && value <= game.board.length ? true : 'Out of range!'
        }
    );
    return column - 1;
}

export function translateGameEnding(player: Player, game: Game) : void {
    if (game.winner.uuid === player.uuid) {
        console.log(`You WIN! by ${translateWinningCode(game.winningCode)}!`);
    } else {
        console.log(`The opponent '${game.winner.name}' win, by ${translateWinningCode(game.winningCode)}...`);
    }
}

function translateWinningCode(code: string) : string {
    if (code === 'PLDISCON') {
        return 'player disconnected';
    } else if (code.startsWith('MOVE-')) {
        return translateMoveCode(code);
    } else {
        return 'unknown reason';
    }
}

function translateMoveCode(code: string) : string {
    const codes = code.split('-');
    if (codes.length == 4) {
        let pattern = 'unknown';
        switch (codes[1]) {
        case 'AtColumnFinder':
            pattern = 'vertical';
            break;
        case 'AtDiagonalDownFinder':
            pattern = 'diagonal from upper left to lower right';
            break;
        case 'AtDiagonalUpFinder':
            pattern = 'diagonal from lower left to upper right';
            break;
        case 'AtRowFinder':
            pattern = 'horizontal';
            break;
        }
        return `${pattern} 5-in-a-row found at point ${codes[2]}, ${codes[3]}`;
    } else {
        return 'unknown move code';
    }
}

export async function playAgainConfirmation() : Promise<boolean> {
    const {value} = await prompt(
        {
            type: 'confirm',
            name: 'value',
            message: 'Do you want to play again?'
        }
    );
    return value;
}

export function translateAxiosError(error: AxiosError) : string | undefined {
    switch (error.code) {
    case 'ECONNREFUSED':
        return 'failed to connect the server';
    default:
        console.log(error);
        return error.code;
    }
}
