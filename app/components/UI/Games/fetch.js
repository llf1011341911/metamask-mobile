import { useMemo } from 'react';
import axios from 'axios';
import qs from 'query-string';
import Web3 from 'web3';
import AppConstants from '../../../core/AppConstants';
import Logger from '../../../util/Logger';
import { worldBuild } from './world_build';
import { getWeb3 } from '../../../util/web3';
import { worldABI, metaverseABI } from '../../../abi/worldABI';

const gamesWeb3 = new Web3(AppConstants.GAMES.WEB3);

const worldAddresses = [
  '0x8e559d60c0bdb1c2946e16f92d1c5d82b9ace25b',
  '0xb70b6dfbb7152dcb8ce938eda1d1262b8651aee8',
];

// async function getWorldsInfo(metaverse, url) {
//   const web3 = getWeb3(url);
//   const contract = new web3.eth.Contract(metaverseABI, metaverse);
//   const addresses = await contract.methods.getWorlds().call();
//   const batchRequest = new web3.eth.BatchRequest();
//   const promises = addresses.map(
//     (address) =>
//       new Promise((resolve, reject) => {
//         const req = contract.methods
//           .getWorldInfo(address)
//           .call.request({}, (err, res) => {
//             if (!err) {
//               resolve(res);
//             } else {
//               reject(err);
//             }
//           });
//         batchRequest.add(req);
//       }),
//   );
//   batchRequest.execute();
//   return Promise.all(promises);
// }

// async function getWorldInfo(address, metaverse, url) {
//   const web3 = getWeb3(url);
//   const contract = new web3.eth.Contract(metaverseABI, metaverse);
//   return contract.methods.getWorldInfo(address).call();
// }

export async function findAccountsByAddresses(addresses, worldAddresses, url) {
  const web3 = getWeb3(url);
  const batchRequest = new web3.eth.BatchRequest();
  const contracts = worldAddresses.map(
    (address) => new web3.eth.Contract(worldABI, address),
  );
  const promises = [];
  addresses.forEach((address) => {
    contracts.forEach((contract) => {
      const promise = new Promise((resolve, reject) => {
        const req = contract.methods
          .getAccountIdByAddress(address)
          .call.request({}, (err, res) => {
            if (!err) {
              resolve({
                address,
                accoundID: res,
                worldAddress: contract.options.address,
              });
            } else {
              reject(err);
            }
          });
        batchRequest.add(req);
      });
      promises.push(promise);
    });
  });
  batchRequest.execute();
  return await Promise.all(promises);
}

/**
 * 获取详情
 * @param {*} id
 * @returns
 */
export async function getGamesDetail(address, metaverse, url) {
  const web3 = getWeb3(url);
  const contract = new web3.eth.Contract(metaverseABI, metaverse);
  return contract.methods.getWorldInfo(address).call();
}

export async function getWorldsInfo(metaverse, url) {
  const web3 = getWeb3(url);

  const contract = new web3.eth.Contract(metaverseABI, metaverse);
  const addresses = await contract.methods.getWorlds().call();
  const batchRequest = new web3.eth.BatchRequest();

  const promises = addresses.map(
    (address) =>
      new Promise((resolve, reject) => {
        const req = contract.methods
          .getWorldInfo(address)
          .call.request({}, (err, res) => {
            if (!err) {
              resolve(res);
            } else {
              reject(err);
            }
          });
        batchRequest.add(req);
      }),
  );
  batchRequest.execute();
  return Promise.all(promises);
}

// export async function getWorldInfo(address, metaverse, url) {
//   const web3 = getWeb3(url);
//   const contract = new web3.eth.Contract(metaverseABI, metaverse);
//   return contract.methods.getWorldInfo(address).call();
// }
