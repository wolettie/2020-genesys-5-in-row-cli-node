import axios, {AxiosResponse} from 'axios';
import {Game} from '../model/game.model';
import {GameResponseModel} from '../model/gameResponse.model';

export function registerUser(playerName: string) : Promise<AxiosResponse<string>> {
    return axios.post('http://localhost:8080/five-a-row/api/v1/player/register', {name: playerName});
}

export function checkGameStatus(token: string) : Promise<AxiosResponse<Game>> {
    return axios.get(
        'http://localhost:8080/five-a-row/api/v1/game/status', {
            headers: {
                Authorization: `Bearer ${token}`,
            }
        });
}

export function dropDisc(token: string, column: number) : Promise<AxiosResponse<GameResponseModel>> {
    return axios.post(
        'http://localhost:8080/five-a-row/api/v1/game/dropDisc', {
            column
        },{
            headers: {
                Authorization: `Bearer ${token}`,
            }
        });
}

export async function disconnect(token: string) : Promise<AxiosResponse<Game>> {
    return axios.post('http://localhost:8080/five-a-row/api/v1/player/quit', {},{
        headers: {
            Authorization: `Bearer ${token}`,
        }
    });
}
