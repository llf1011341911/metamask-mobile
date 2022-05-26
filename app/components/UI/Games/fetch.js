import { useMemo } from 'react';
import axios from 'axios';
import qs from 'query-string';
import Web3 from "web3"
import AppConstants from '../../../core/AppConstants';
import Logger from '../../../util/Logger';
import {worldBuild} from "./world_build"

const gamesWeb3 = new Web3(AppConstants.GAMES.WEB3);

const worldAddresses = [
    '0x8e559d60c0bdb1c2946e16f92d1c5d82b9ace25b',
    '0xb70b6dfbb7152dcb8ce938eda1d1262b8651aee8',
  ];

export function findAccountsByAddresses(addresses, callback) {
    // const web3 = new Web3(new Web3.providers.HttpProvider("https://data-seed-prebsc-1-s1.binance.org:8545"));
    // const contracts = web3.eth.getBlock("latest");
    // Logger.log("数据"+JSON.stringify(contracts))
    Logger.log("数据开始")
    const batchRequest = new gamesWeb3.eth.BatchRequest();
    const { abi } = worldBuild;
    const contracts = worldAddresses.map(
      (address) => new gamesWeb3.eth.Contract(abi, address)
    );
    const accounts = [];
    const errors = [];
    let i = addresses.length * contracts.length;
    addresses.forEach((address) => {
      contracts.forEach((contract) => {
        let req = contract.methods
          .getAccountIdByAddress(address)
          .call
              .request({
              }, (err,res) => {
                Logger.log("数据返回")
                Logger.log(err,res)
                if (!err) {
                  accounts.push({
                    world: {
                      name: contract.options.address.slice(-6),
                      icon: '',
                      address: contract.options.address,
                    },
                    id: res,
                    email: '',
                    address,
                  });
                } else {
                  errors.push(err);
                }
                if (--i === 0) {
                  callback(errors, accounts);
                }
              });
          Logger.log("1123344"+JSON.stringify(req))
        batchRequest.add(req);
      });
    });
    batchRequest.execute();
  }


// //* API
// const gamesApi = axios.create({
//     baseURL: AppConstants.GAMES_URL,
// });

// const getGamesList =(params)=>
//     gamesApi.post("x/accounts/search",{
//         ...params,
//         pageSize:10
//     });

// const getGamesDetail =()=>{

// };

// export  function requestGamesList(params) {
//     return {
//         "pageSize": 10,
//         "accounts": [{
//                 "worldAddress": "0x59d590745a053e65a57ecda300caaef25b32a1e8",
//                 "id": "2",
//                 "address": "0x4b86fff84a6705915ee4934f145e418758aad0e7",
//                 "trustAdmin": false,
//                 "trustWorld": false,
//                 "nonce": 0,
//                 "level": 0,
//                 "registeredAt": "2022-05-11T07:43:32.000Z",
//                 "insertedAt": "2022-05-19T17:34:02.141Z",
//                 "updatedAt": "2022-05-19T17:34:02.141Z",
//                 "blockHash": "0xbd5ce4cc7485295aa9f0fbaf52e63f1719661c5835dab7d30134c83dea061753",
//                 "blockNumber": "133",
//                 "transactionsCount": 0,
//                 "tokenTransfersCount": 0,
//                 "email": "johndoe@github.com",
//                 "pos": ["133", "0"],
//                 "world": {
//                     "icon": "LzlqLzRBQVFTa1pKUmdBQkFRQUFBUU...",
//                     "name": "32a1E8"
//                 }
//             },
//             {
//                 "worldAddress": "0xf295aab528c1102ead914c7471729c76c0fe2e6d",
//                 "id": "2",
//                 "address": "0x4b86fff84a6705915ee4934f145e418758aad0e7",
//                 "trustAdmin": false,
//                 "trustWorld": false,
//                 "nonce": 0,
//                 "level": 0,
//                 "registeredAt": "2022-05-11T07:43:31.000Z",
//                 "insertedAt": "2022-05-19T17:34:02.051Z",
//                 "updatedAt": "2022-05-19T17:34:02.051Z",
//                 "blockHash": "0x6894e1d7493633731afc3262a0ec6efe4056ac464bf803a14a1af7000634761f",
//                 "blockNumber": "132",
//                 "transactionsCount": 0,
//                 "tokenTransfersCount": 0,
//                 "email": "johndoe@github.com",
//                 "pos": ["132", "0"],
//                 "world": {
//                     "icon": "LzlqLzRBQVFTa1pKUmdBQkFRQUFBUU...",
//                     "name": "FE2e6d"
//                 }
//             },
//             {
//                 "worldAddress": "0x59d590745a053e65a57ecda300caaef25b32a1e8",
//                 "id": "1",
//                 "address": "0x0ec94b0f7d593e0e3e3e4743324f208ec8d01ba3",
//                 "trustAdmin": false,
//                 "trustWorld": false,
//                 "nonce": 0,
//                 "level": 0,
//                 "registeredAt": "2022-05-11T06:02:27.000Z",
//                 "insertedAt": "2022-05-19T17:34:02.052Z",
//                 "updatedAt": "2022-05-19T17:34:02.566Z",
//                 "blockHash": "0xa93fd59c218c09b427dcbb75f428842a66b0f7e38e55ee8d0d6e6ea23b6733be",
//                 "blockNumber": "130",
//                 "transactionsCount": 0,
//                 "tokenTransfersCount": 0,
//                 "email": "johndoe@github.com",
//                 "pos": ["130", "0"],
//                 "world": {
//                     "icon": "LzlqLzRBQVFTa1pKUmdBQkFRQUFBUU...",
//                     "name": "32a1E8"
//                 }
//             }
//         ],
//         "hasNext": false
//     }
// }