import { useMemo } from 'react';
import axios from 'axios';
import qs from 'query-string';
import Web3 from "web3"
import AppConstants from '../../../core/AppConstants';
import Logger from '../../../util/Logger';
import { worldBuild } from "./world_build"

const gamesWeb3 = new Web3(AppConstants.GAMES.WEB3);

const worldAddresses = [
  '0x8e559d60c0bdb1c2946e16f92d1c5d82b9ace25b',
  '0xb70b6dfbb7152dcb8ce938eda1d1262b8651aee8',
];

export async function findAccountsByAddresses(addresses) {
  const batchRequest = new gamesWeb3.eth.BatchRequest();
  const { abi } = worldBuild;
  const contracts = worldAddresses.map(
    (address) => new gamesWeb3.eth.Contract(abi, address)
  );
  const promises = [];
  addresses.forEach((address) => {
    contracts.forEach((contract) => {
      const promise = new Promise((resolve, reject) => {
        const req = contract.methods
          .getAccountIdByAddress(address)
          .call.request({}, (err, res) => {
            console.log(res)
            if (!err) {
              resolve(
                res === '0'
                  ? null
                  : {
                    world: {
                      name: contract.options.address.slice(-6),
                      icon: '暂无数据',
                      address: contract.options.address,
                    },
                    id: res,
                    email: '暂无数据',
                    address,
                    desc: "暂无数据",
                  }
              );
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
  return (await Promise.all(promises)).filter((account) => account !== null);
}

/**
 * 获取详情
 * @param {*} id 
 * @returns 
 */
export async function getGamesDetail(id, worldAddress) {
  const { abi } = worldBuild;
  const contract = new gamesWeb3.eth.Contract(abi, worldAddress);
  const account = {};
  const promises = [];
  const batchRequest = new gamesWeb3.eth.BatchRequest();
  //get address
  let promise = new Promise((resolve, reject) => {
    const req = contract.methods
      .getAddressById(id)
      .call.request({}, (err, res) => {
        console.log("详情数据" + res)
        if (!err) {
          account.address = res;
          resolve(res);
        } else {
          reject(err);
        }
      });
    batchRequest.add(req);
  });
  promises.push(promise);
  //get trust world
  promise = new Promise((resolve, reject) => {
    const req = contract.methods
      .isTrustWorld(id)
      .call.request({}, (err, res) => {
        console.log("详情数据" + res)
        if (!err) {
          account.trustWorld = res;
          resolve(res);
        } else {
          reject(err);
        }
      });
    batchRequest.add(req);
  });
  promises.push(promise);
  //TODO
  //get trust admin
  //get homepage
  //get desc
  //get email
  //get icon
  batchRequest.execute();
  await Promise.all(promises);
  return gamesWeb3.utils.hexToBytes(account.address).every((byte) => byte === 0)
    ? null
    : account;
}