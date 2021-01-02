import * as request from './logic/httpRequests';
import * as display from './io/display';
import {Game} from './model/game.model';
import {decode} from 'jsonwebtoken';
import {BehaviorSubject, interval, Subscription} from 'rxjs';
import {Player} from './model/player.model';
import {Observable} from 'rxjs/internal/Observable';

const gameEvent: BehaviorSubject<Game> = new BehaviorSubject<Game>(undefined);
const playerEvent: BehaviorSubject<Player> = new BehaviorSubject<Player>(undefined);
let gamePollInterval: Observable<number>;
let gameEventSub: Subscription;
let playerEventSub: Subscription;
let gamePollIntervalSub: Subscription;

/**
 * To be called at the end of file
 * This method setup what needs to happen on events such as player registered or game is updated.
 */
function play() : void {
    playerRegistration();

    // when player registered, start timer
    gameEventSub = playerEvent.subscribe(() => {
        gamePollInterval = interval(2500);
        startPolling();
    });

    // on each game status poll
    playerEventSub = gameEvent.subscribe(game => {
        const player = playerEvent.value;
        if (game) {
            onNewGameStatus(player, game);
        }
    }, error => {
        console.error('error');
    });
}

/*
    Any logic dependent on subject/observable is written below.
 */

function playerRegistration() : void {
    display.playerInfoInput().then(({playerName, colour}) => {
        registerPlayer(playerName, colour);
    });
}

function registerPlayer(playerName: string, colour: string) {
    gameEvent.next(undefined);
    request.registerUser(playerName).then(({data}) => {
        playerRegistered(data, playerName, colour);
    }).catch(error => {
        console.clear();
        console.error('registration failed due to ' + display.translateAxiosError(error));
        playerRegistration();
    });
}

function playerRegistered(token: string, playerName: string, colour: string) : void {
    const uuid = decode(token, {json: true}).user_uuid;
    const player = {uuid, token, colour, name: playerName} as Player;
    playerEvent.next(player);
}

function startPolling() : void {
    gamePollIntervalSub?.unsubscribe();
    // keep polling game status
    if (!gameEvent.value?.winner) {
        gamePollIntervalSub = gamePollInterval.subscribe(() => {
            if (playerEvent.value) {
                request.checkGameStatus(playerEvent.value.token).then(game => {
                    gameEvent.next(game.data);
                }).catch(err => {
                    if (err.code === 403 && gameEvent.value?.winner) {
                        // nothing to worry
                    } else {
                        console.error(`failed to fetch game status due to error ${err.code}`);
                    }
                });
            }
        });
    }
}

async function myTurn(player: Player, game: Game) : Promise<void> {
    gamePollIntervalSub?.unsubscribe();
    const column = await display.selectColumn(player, game);
    request.dropDisc(player.token, column).then(response => {
        gameEvent.next(response.data.game);
        startPolling();
    }).catch(error => {
        if (error.response?.data?.errorMessage) {
            display.displayBoard(player, game);
            console.error(error.response?.data?.errorMessage);
            myTurn(player, game);
        }
    });
}

async function onNewGameStatus(player: Player, game: Game) : Promise<void> {
    if (game?.winner) {
        gamePollIntervalSub?.unsubscribe();
        display.displayBoard(playerEvent.value, game);
        display.translateGameEnding(player, game);
        request.disconnect(player.token)
            .then(() => confirmToPlayAgain(player))
            .catch(err => {
                if (err.code === 403) {
                    confirmToPlayAgain(player);
                } else {
                    closeGame();
                }
            });
    } else if (game) {
        display.displayBoard(player, game);
        if (game.currentPlayer.uuid === player.uuid) {
            myTurn(player, game);
        } else {
            console.log(`waiting ${game.currentPlayer.name} to drop disc`);
        }
    } else {
        console.log('Waiting game to start');
    }
}

async function confirmToPlayAgain(player: Player) {
    const confirm = await display.playAgainConfirmation();
    if (confirm) {
        registerPlayer(player.name, player.colour);
    } else {
        closeGame();
    }
}

async function closeGame() : Promise<void> {
    console.log('closing game');
    const player = playerEvent.value;
    playerEventSub?.unsubscribe();
    gameEventSub?.unsubscribe();
    gamePollIntervalSub?.unsubscribe();
    playerEvent?.complete();
    gameEvent?.complete();
    try {
        if (player) {
            await request.disconnect(player.token);
        }
    } finally {
        console.log('closed');
        process.exit(1);
    }
}

process.on('exit', () => closeGame());
process.on('SIGINT', () => closeGame()); // catch control+C

play(); // start game
